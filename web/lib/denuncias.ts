/** Domínio Rastro — denúncias / ocorrências (Firestore `denuncias`). */

export type DenunciaCategoria =
  | "descarte_irregular"
  | "conteiner_cheio"
  | "contaminacao_reciclavel"
  | "outros";

export type DenunciaStatus =
  | "pendente"
  | "em_analise"
  | "validada"
  | "roteada"
  | "descartada";

export interface DenunciaDoc {
  categoria: DenunciaCategoria;
  status: DenunciaStatus;
  municipio?: string;
  bairro?: string;
  endereco?: string;
  lat: number;
  lng: number;
  iaScore?: number | null;
  iaValida?: boolean | null;
  createdAt: string;
  atualizadoEm?: string;
  updatedAt?: string;
  cidadaoAnonimo?: boolean;
  fotoUrl?: string;
  fotoUrls?: string[];
  observacao?: string;
  userId?: string;
}

export type Denuncia = DenunciaDoc & { id: string };

export const DENUNCIAS_COLLECTION = "denuncias";

export const CATEGORIA_LABEL: Record<DenunciaCategoria, string> = {
  descarte_irregular: "Descarte irregular",
  conteiner_cheio: "Contêiner cheio",
  contaminacao_reciclavel: "Contaminação de reciclável",
  outros: "Outros",
};

export const STATUS_LABEL: Record<DenunciaStatus, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  validada: "Validada",
  roteada: "Roteada",
  descartada: "Descartada",
};

const CATEGORIAS = new Set<string>(Object.keys(CATEGORIA_LABEL));
const STATUSES = new Set<string>(Object.keys(STATUS_LABEL));

export function categoriaLabel(c: DenunciaCategoria): string {
  return CATEGORIA_LABEL[c];
}

export function statusLabel(s: DenunciaStatus): string {
  return STATUS_LABEL[s];
}

export function statusBadgeClass(s: DenunciaStatus): string {
  switch (s) {
    case "roteada":
      return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400";
    case "validada":
      return "bg-sky-500/15 text-sky-700 dark:text-sky-300";
    case "em_analise":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
    case "descartada":
      return "bg-red-500/15 text-red-700 dark:text-red-400";
    default:
      return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400";
  }
}

export function categoriaMarkerColor(c: DenunciaCategoria): string {
  switch (c) {
    case "descarte_irregular":
      return "#dc2626";
    case "conteiner_cheio":
      return "#d97706";
    case "contaminacao_reciclavel":
      return "#2563eb";
    case "outros":
      return "#71717a";
  }
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function asNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

/** Normaliza doc Firestore (campos opcionais / aliases) para `Denuncia`. */
export function parseDenunciaDoc(id: string, raw: Record<string, unknown>): Denuncia | null {
  const lat = asNumber(raw.lat);
  const lng = asNumber(raw.lng);
  if (lat == null || lng == null) return null;

  const catRaw = asString(raw.categoria) ?? asString(raw.tipo);
  const categoria = (
    catRaw && CATEGORIAS.has(catRaw) ? catRaw : "descarte_irregular"
  ) as DenunciaCategoria;

  const stRaw = asString(raw.status);
  const status = (stRaw && STATUSES.has(stRaw) ? stRaw : "pendente") as DenunciaStatus;

  const createdAt =
    asString(raw.createdAt) ??
    (raw.createdAt && typeof (raw.createdAt as { toDate?: () => Date }).toDate === "function"
      ? (raw.createdAt as { toDate: () => Date }).toDate().toISOString()
      : new Date(0).toISOString());

  const atualizadoEm =
    asString(raw.atualizadoEm) ??
    asString(raw.updatedAt) ??
    createdAt;

  return {
    id,
    categoria,
    status,
    municipio: asString(raw.municipio) ?? "",
    bairro: asString(raw.bairro) ?? "",
    endereco:
      asString(raw.endereco) ??
      asString(raw.enderecoGeocodificado) ??
      asString(raw.logradouro) ??
      "",
    lat,
    lng,
    iaScore: asNumber(raw.iaScore) ?? null,
    iaValida: asBool(raw.iaValida) ?? null,
    createdAt,
    atualizadoEm,
    cidadaoAnonimo: asBool(raw.cidadaoAnonimo),
    fotoUrl:
      asString(raw.fotoUrl) ??
      (Array.isArray(raw.fotoUrls) && typeof raw.fotoUrls[0] === "string"
        ? raw.fotoUrls[0]
        : undefined),
    fotoUrls: Array.isArray(raw.fotoUrls)
      ? (raw.fotoUrls.filter((u) => typeof u === "string") as string[])
      : undefined,
    observacao: asString(raw.observacao),
    userId: asString(raw.userId),
  };
}
