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
  iaDescricao?: string | null;
  iaContemPessoas?: boolean | null;
  iaReciclavel?: boolean | null;
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
  entulho_obra: "Entulho / obra",
  residuo_verde: "Resíduo verde",
  outros: "Outros",
};

export const STATUS_LABEL: Record<DenunciaStatus, string> = {
  pendente: "Em análise", // legado — tratado como em_analise na UI
  em_analise: "Em análise",
  validada: "Validada",
  roteada: "Roteada",
  descartada: "Descartada",
};

/** Status usados em filtros/ações do painel (sem Pendente). */
export const STATUS_FILTERS = [
  "em_analise",
  "validada",
  "roteada",
  "descartada",
] as const satisfies readonly DenunciaStatus[];

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
      return "bg-emerald-600/20 text-emerald-800 dark:text-emerald-300";
    case "validada":
      return "bg-green-500/20 text-green-700 dark:bg-green-500/25 dark:text-green-300";
    case "em_analise":
    case "pendente":
      return "bg-amber-500/15 text-amber-800 dark:text-amber-300";
    case "descartada":
      return "bg-red-600/20 text-red-700 dark:bg-red-500/25 dark:text-red-300";
    default:
      return "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400";
  }
}

/** Normaliza status legado pendente → em_analise para filtros. */
export function normalizeDenunciaStatus(s: DenunciaStatus): DenunciaStatus {
  return s === "pendente" ? "em_analise" : s;
}

/**
 * Se a IA já respondeu e o doc ainda está em análise, aplica o status final.
 * Não sobrescreve roteada / ajustes manuais posteriores.
 */
export function statusAposTriagemIa(
  status: DenunciaStatus,
  iaValida: boolean | null | undefined,
): DenunciaStatus {
  if (iaValida == null) return normalizeDenunciaStatus(status);
  if (status === "em_analise" || status === "pendente") {
    return iaValida ? "validada" : "descartada";
  }
  return status;
}

export function isStatusEmAnalise(s: DenunciaStatus): boolean {
  return s === "em_analise" || s === "pendente";
}

export function categoriaMarkerColor(c: DenunciaCategoria): string {
  switch (c) {
    case "descarte_irregular":
      return "#dc2626";
    case "conteiner_cheio":
      return "#d97706";
    case "contaminacao_reciclavel":
      return "#2563eb";
    case "entulho_obra":
      return "#a16207";
    case "residuo_verde":
      return "#16a34a";
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
  const statusRaw = (stRaw && STATUSES.has(stRaw) ? stRaw : "em_analise") as DenunciaStatus;
  const iaValida = asBool(raw.iaValida) ?? null;
  const status = statusAposTriagemIa(statusRaw, iaValida);

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
    iaValida,
    iaDescricao: asString(raw.iaDescricao) ?? null,
    iaContemPessoas: asBool(raw.iaContemPessoas) ?? null,
    iaReciclavel: asBool(raw.iaReciclavel) ?? null,
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

/** URLs de foto normalizadas (fotoUrls ou fallback fotoUrl). */
export function denunciaFotoUrls(d: Pick<Denuncia, "fotoUrl" | "fotoUrls">): string[] {
  if (d.fotoUrls?.length) return d.fotoUrls.filter(Boolean);
  if (d.fotoUrl) return [d.fotoUrl];
  return [];
}
