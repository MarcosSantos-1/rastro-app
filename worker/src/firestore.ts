import type { FirestoreIaFields } from "./gemini";

type DenunciaStatus = "em_analise" | "validada" | "descartada";

/** Válida → validada; inválida → descartada. */
export function statusFromIa(ia: FirestoreIaFields): DenunciaStatus {
  return ia.iaValida ? "validada" : "descartada";
}

function firestoreValue(v: unknown): Record<string, unknown> {
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number" && Number.isFinite(v)) {
    return Number.isInteger(v)
      ? { integerValue: String(v) }
      : { doubleValue: v };
  }
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "object") {
    return { stringValue: JSON.stringify(v) };
  }
  return { stringValue: String(v) };
}

/** Atualiza campos ia* + status via REST (Bearer = Firebase ID token do cidadão). */
export async function patchDenunciaTriagem(opts: {
  projectId: string;
  idToken: string;
  denunciaId: string;
  ia: FirestoreIaFields;
}): Promise<void> {
  const status = statusFromIa(opts.ia);
  const atualizadoEm = new Date().toISOString();

  const fields: Record<string, Record<string, unknown>> = {
    iaValida: firestoreValue(opts.ia.iaValida),
    iaScore: firestoreValue(opts.ia.iaScore),
    iaContemPessoas: firestoreValue(opts.ia.iaContemPessoas),
    iaReciclavel: firestoreValue(opts.ia.iaReciclavel),
    iaDescricao: firestoreValue(opts.ia.iaDescricao),
    iaRaw: firestoreValue(opts.ia.iaRaw),
    status: firestoreValue(status),
    atualizadoEm: firestoreValue(atualizadoEm),
  };

  const masks = Object.keys(fields)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join("&");

  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(opts.projectId)}/databases/(default)/documents/denuncias/${encodeURIComponent(opts.denunciaId)}?${masks}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${opts.idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Firestore PATCH ${res.status}: ${text.slice(0, 400)}`);
  }
}
