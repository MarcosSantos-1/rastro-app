import { AuthError, verifyFirebaseIdToken } from "./firebase-auth";
import { analyzeImageWithGemini } from "./gemini";
import { patchDenunciaTriagem, patchDenunciaTriagemErro } from "./firestore";
import { emptyCors, jsonResponse } from "./cors";

export interface Env {
  R2_BUCKET: R2Bucket;
  GEMINI_API_KEY: string;
  GEMINI_MODEL: string;
  FIREBASE_PROJECT_ID: string;
  R2_PUBLIC_BASE_URL: string;
  /** "false" desliga Gemini em background (economiza tokens). */
  TRIAGE_ENABLED?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;
const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;

function objectKey(uid: string, denunciaId: string, index: number): string {
  return `denuncias/${uid}/${denunciaId}_${index}.jpg`;
}

function publicUrl(base: string, key: string): string {
  return `${base.replace(/\/+$/, "")}/${key}`;
}

function keyFromFotoUrl(fotoUrl: string, publicBase: string): string | null {
  try {
    const base = publicBase.replace(/\/+$/, "");
    if (fotoUrl.startsWith(`${base}/`)) {
      return decodeURIComponent(fotoUrl.slice(base.length + 1).split("?")[0]);
    }
    const u = new URL(fotoUrl);
    if (u.hostname.endsWith(".r2.dev") || u.hostname.includes("r2.cloudflarestorage.com")) {
      const path = u.pathname.replace(/^\/+/, "");
      return path ? decodeURIComponent(path) : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function readImageBody(request: Request): Promise<{
  bytes: ArrayBuffer;
  mimeType: string;
}> {
  const contentType = (request.headers.get("Content-Type") || "").toLowerCase();

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const file = form.get("file") ?? form.get("foto") ?? form.get("image");
    if (!(file instanceof File)) {
      throw new BadRequest("multipart: envie campo file|foto|image");
    }
    const bytes = await file.arrayBuffer();
    const mimeType = file.type || "image/jpeg";
    return { bytes, mimeType };
  }

  const bytes = await request.arrayBuffer();
  const mimeType = contentType.startsWith("image/")
    ? contentType.split(";")[0].trim()
    : "image/jpeg";
  return { bytes, mimeType };
}

class BadRequest extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BadRequest";
  }
}

async function handlePostFoto(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  const publicBase = (env.R2_PUBLIC_BASE_URL || "").trim();
  if (!publicBase) {
    return jsonResponse(
      request,
      {
        error:
          "R2_PUBLIC_BASE_URL vazia. Habilite Public Development URL no bucket e configure a var no wrangler.",
      },
      500,
    );
  }

  const authHeader = request.headers.get("Authorization");
  const user = await verifyFirebaseIdToken(authHeader, env.FIREBASE_PROJECT_ID);
  const idToken = authHeader!.slice("Bearer ".length).trim();

  const denunciaId = (request.headers.get("X-Denuncia-Id") || "").trim();
  const indexRaw = (request.headers.get("X-Foto-Index") || "0").trim();
  const index = Number(indexRaw);

  if (!SAFE_ID.test(denunciaId)) {
    throw new BadRequest("X-Denuncia-Id inválido");
  }
  if (!Number.isInteger(index) || index < 0 || index > 9) {
    throw new BadRequest("X-Foto-Index inválido (0–9)");
  }

  const { bytes, mimeType } = await readImageBody(request);
  if (bytes.byteLength === 0) throw new BadRequest("Corpo da imagem vazio");
  if (bytes.byteLength > MAX_BYTES) {
    throw new BadRequest(`Imagem > ${MAX_BYTES} bytes`);
  }
  if (!mimeType.startsWith("image/")) {
    throw new BadRequest("Content-Type deve ser image/*");
  }

  const key = objectKey(user.uid, denunciaId, index);
  await env.R2_BUCKET.put(key, bytes, {
    httpMetadata: { contentType: mimeType },
  });

  const fotoUrl = publicUrl(publicBase, key);

  // Triagem Gemini em segundo plano (foto já cai no portal como Em análise).
  const triageOn = (env.TRIAGE_ENABLED ?? "true").toLowerCase() !== "false";
  const hasGeminiKey = Boolean((env.GEMINI_API_KEY || "").trim());
  const shouldTriage = triageOn && index === 0;

  if (shouldTriage) {
    const imageCopy = bytes.slice(0);
    ctx.waitUntil(
      (async () => {
        try {
          if (!hasGeminiKey) {
            throw new Error("GEMINI_API_KEY ausente no Worker");
          }
          const ia = await analyzeImageWithGemini({
            apiKey: env.GEMINI_API_KEY,
            model: env.GEMINI_MODEL || "gemini-3.1-flash-lite",
            imageBytes: imageCopy,
            mimeType,
          });
          await patchDenunciaTriagem({
            projectId: env.FIREBASE_PROJECT_ID,
            idToken,
            denunciaId,
            ia,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("triagem background falhou", message);
          try {
            await patchDenunciaTriagemErro({
              projectId: env.FIREBASE_PROJECT_ID,
              idToken,
              denunciaId,
              message,
            });
          } catch (err2) {
            console.error(
              "falha ao gravar iaErro",
              err2 instanceof Error ? err2.message : String(err2),
            );
          }
        }
      })(),
    );
  }

  return jsonResponse(request, {
    fotoUrl,
    key,
    triage: shouldTriage ? "background" : "skipped",
  });
}

async function handleDeleteFoto(request: Request, env: Env): Promise<Response> {
  await verifyFirebaseIdToken(
    request.headers.get("Authorization"),
    env.FIREBASE_PROJECT_ID,
  );

  let key: string | null = null;
  const url = new URL(request.url);
  const qKey = url.searchParams.get("key");
  if (qKey) key = qKey;

  if (!key) {
    const body = (await request.json().catch(() => null)) as {
      key?: string;
      fotoUrl?: string;
    } | null;
    if (body?.key) key = body.key;
    else if (body?.fotoUrl) {
      key = keyFromFotoUrl(body.fotoUrl, env.R2_PUBLIC_BASE_URL || "");
    }
  }

  if (!key || !key.startsWith("denuncias/") || key.includes("..")) {
    throw new BadRequest("key/fotoUrl inválido");
  }

  await env.R2_BUCKET.delete(key);
  return jsonResponse(request, { ok: true, key });
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") {
      return emptyCors(request);
    }

    const { pathname } = new URL(request.url);

    try {
      if (request.method === "GET" && (pathname === "/" || pathname === "/health")) {
        return jsonResponse(request, {
          ok: true,
          service: "rastro-api",
          r2PublicConfigured: Boolean((env.R2_PUBLIC_BASE_URL || "").trim()),
          triageEnabled: (env.TRIAGE_ENABLED ?? "true").toLowerCase() !== "false",
          geminiConfigured: Boolean((env.GEMINI_API_KEY || "").trim()),
        });
      }

      if (pathname === "/v1/fotos") {
        if (request.method === "POST") return await handlePostFoto(request, env, ctx);
        if (request.method === "DELETE") return await handleDeleteFoto(request, env);
      }

      return jsonResponse(request, { error: "Not found" }, 404);
    } catch (err) {
      if (err instanceof AuthError) {
        return jsonResponse(request, { error: err.message }, 401);
      }
      if (err instanceof BadRequest) {
        return jsonResponse(request, { error: err.message }, 400);
      }
      const message = err instanceof Error ? err.message : String(err);
      console.error("rastro-api error", message);
      return jsonResponse(request, { error: message }, 500);
    }
  },
};
