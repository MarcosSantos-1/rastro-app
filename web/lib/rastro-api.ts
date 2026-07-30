import { auth } from "@/lib/firebase";

function apiBase(): string | null {
  const base = (process.env.NEXT_PUBLIC_RASTRO_API_URL || "").trim().replace(/\/+$/, "");
  return base || null;
}

export function isR2FotoUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith(".r2.dev")) return true;
    if (u.hostname.includes("r2.cloudflarestorage.com")) return true;
    const configured = (process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL || "").trim();
    if (configured) {
      const base = new URL(configured);
      if (u.origin === base.origin) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Apaga objeto no R2 via Worker (requer usuário autenticado no Firebase). */
export async function deleteR2FotoViaApi(fotoUrl: string): Promise<void> {
  const base = apiBase();
  if (!base) {
    console.warn("NEXT_PUBLIC_RASTRO_API_URL ausente — não foi possível apagar no R2:", fotoUrl);
    return;
  }
  const user = auth.currentUser;
  if (!user) {
    console.warn("Sem sessão Firebase — skip delete R2:", fotoUrl);
    return;
  }
  const token = await user.getIdToken();
  const res = await fetch(`${base}/v1/fotos`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fotoUrl }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || `Delete R2 falhou (HTTP ${res.status})`);
  }
}
