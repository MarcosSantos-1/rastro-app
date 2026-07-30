/** Domínio Rastro — denúncias / ocorrências (Firestore `denuncias`). */

export type DenunciaCategoria =
  | "descarte_irregular"
  | "conteiner_cheio"
  | "contaminacao_reciclavel"
  | "entulho_obra"
  | "residuo_verde"
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
  iaContemPessoas?: boolean | null;
  iaReciclavel?: boolean | null;
  iaDescricao?: string | null;
  iaRaw?: unknown;
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
  contaminacao_reciclavel: "Contaminação",
  entulho_obra: "Entulho / obra",
  residuo_verde: "Resíduo verde",
  outros: "Outros",
};

export const STATUS_LABEL: Record<DenunciaStatus, string> = {
  pendente: "Em análise",
  em_analise: "Em análise",
  validada: "Validada",
  roteada: "Roteada",
  descartada: "Descartada",
};

const CATEGORIAS = new Set<string>(Object.keys(CATEGORIA_LABEL));
const STATUSES = new Set<string>(Object.keys(STATUS_LABEL));

export function isDenunciaAtiva(status: DenunciaStatus): boolean {
  return status === "pendente" || status === "em_analise";
}

export function isDenunciaResolvida(status: DenunciaStatus): boolean {
  return status === "validada" || status === "roteada";
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
  const status = (stRaw && STATUSES.has(stRaw) ? stRaw : "em_analise") as DenunciaStatus;

  const createdAt =
    asString(raw.createdAt) ??
    (raw.createdAt && typeof (raw.createdAt as { toDate?: () => Date }).toDate === "function"
      ? (raw.createdAt as { toDate: () => Date }).toDate().toISOString()
      : new Date(0).toISOString());

  const atualizadoEm = asString(raw.atualizadoEm) ?? asString(raw.updatedAt) ?? createdAt;

  const fotoUrls = Array.isArray(raw.fotoUrls)
    ? (raw.fotoUrls.filter((u) => typeof u === "string") as string[])
    : undefined;

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
    fotoUrl: asString(raw.fotoUrl) ?? fotoUrls?.[0],
    fotoUrls,
    observacao: asString(raw.observacao),
    userId: asString(raw.userId),
  };
}
