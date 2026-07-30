import { auth } from "@/lib/firebase";

export type UploadFotoResult = {
  fotoUrl: string;
  key: string;
  triage?: string;
};

function apiBase(): string {
  const base = (process.env.EXPO_PUBLIC_RASTRO_API_URL || "").trim().replace(/\/+$/, "");
  if (!base) {
    throw new Error(
      "EXPO_PUBLIC_RASTRO_API_URL não configurada (URL do Worker rastro-api)",
    );
  }
  return base;
}

async function bearerToken(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");
  return user.getIdToken();
}

/** Upload JPEG para R2. Triagem Gemini roda em background no Worker. */
export async function uploadFotoViaApi(opts: {
  denunciaId: string;
  index: number;
  blob: Blob;
}): Promise<UploadFotoResult> {
  const token = await bearerToken();
  const res = await fetch(`${apiBase()}/v1/fotos`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "image/jpeg",
      "X-Denuncia-Id": opts.denunciaId,
      "X-Foto-Index": String(opts.index),
    },
    body: opts.blob,
  });

  const data = (await res.json().catch(() => ({}))) as UploadFotoResult & {
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || `Upload falhou (HTTP ${res.status})`);
  }
  if (!data.fotoUrl || typeof data.fotoUrl !== "string") {
    throw new Error("Resposta do Worker sem fotoUrl");
  }
  // Só devolve campos seguros — evita código antigo espalhar ia* undefined no Firestore.
  return {
    fotoUrl: data.fotoUrl,
    key: typeof data.key === "string" ? data.key : "",
    triage: typeof data.triage === "string" ? data.triage : undefined,
  };
}

export async function deleteFotoViaApi(fotoUrl: string): Promise<void> {
  const token = await bearerToken();
  const res = await fetch(`${apiBase()}/v1/fotos`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fotoUrl }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Delete falhou (HTTP ${res.status})`);
  }
}
