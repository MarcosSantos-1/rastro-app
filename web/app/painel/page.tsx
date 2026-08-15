"use client";

import { useAuthWeb } from "@/lib/contexts/AuthWebContext";
import { AppShell } from "../components/AppShell";
import { OcorrenciaModal } from "../components/ocorrencias/OcorrenciaModal";
import { GooeySearchInput } from "../components/ui/gooey-search-input";
import { StatusBadge } from "../components/ui/status-badge";
import { TableSkeleton, PageAuthSkeleton } from "../components/ui/skeleton";
import { formatDateTimeBr } from "@/lib/format";
import {
  CATEGORIA_LABEL,
  STATUS_LABEL,
  categoriaLabel,
  denunciaFotoUrls,
  normalizeDenunciaStatus,
  type Denuncia,
  type DenunciaCategoria,
} from "@/lib/denuncias";
import { useDenuncias } from "@/lib/hooks/useDenuncias";
import { cn } from "@/lib/utils";
import { CATEGORIA_MDI, MdiIcon } from "../components/ui/mdi-icon";
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ImageIcon,
  Inbox,
  Loader2,
  Route,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";

type StatusFilter = "todos" | "em_analise" | "validada" | "roteada" | "descartada";
type SortKey = "createdAt" | "fotos" | "categoria" | "municipio" | "endereco" | "status";
type SortDir = "asc" | "desc";
type GroupKey = "none" | "categoria" | "municipio" | "status";

const PAGE_SIZE = 20;

const STATUS_ICONS: Record<StatusFilter, LucideIcon> = {
  todos: Inbox,
  em_analise: Loader2,
  validada: CheckCircle2,
  roteada: Route,
  descartada: Ban,
};

function cmpText(a: string, b: string) {
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

function sortValue(r: Denuncia, key: SortKey): string | number {
  switch (key) {
    case "createdAt":
      return new Date(r.createdAt).getTime() || 0;
    case "fotos":
      return denunciaFotoUrls(r).length;
    case "categoria":
      return categoriaLabel(r.categoria);
    case "municipio":
      return (r.municipio ?? "").trim();
    case "endereco":
      return (r.endereco ?? "").trim();
    case "status":
      return STATUS_LABEL[normalizeDenunciaStatus(r.status)];
  }
}

function groupLabel(r: Denuncia, g: Exclude<GroupKey, "none">): string {
  if (g === "categoria") return categoriaLabel(r.categoria);
  if (g === "municipio") return r.municipio?.trim() || "Sem município";
  return STATUS_LABEL[normalizeDenunciaStatus(r.status)];
}

export default function PainelPage() {
  const { ready, profile } = useAuthWeb();
  const router = useRouter();
  const { items, loading, error } = useDenuncias(!!ready && !!profile?.nome);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<"ALL" | DenunciaCategoria>("ALL");
  const [statusTab, setStatusTab] = useState<StatusFilter>("todos");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Denuncia | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [groupBy, setGroupBy] = useState<GroupKey>("none");

  useEffect(() => {
    if (ready && !profile?.nome) router.replace("/");
  }, [ready, profile?.nome, router]);

  useEffect(() => {
    setPage(1);
  }, [search, categoria, statusTab, sortKey, sortDir, groupBy]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (categoria !== "ALL" && r.categoria !== categoria) return false;
      if (
        statusTab !== "todos" &&
        normalizeDenunciaStatus(r.status) !== statusTab
      ) {
        return false;
      }
      if (q) {
        const blob =
          `${r.id} ${r.endereco} ${r.municipio} ${categoriaLabel(r.categoria)}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, categoria, statusTab]);

  const sorted = useMemo(() => {
    const rows = [...filtered];
    const dir = sortDir === "asc" ? 1 : -1;
    rows.sort((a, b) => {
      if (groupBy !== "none") {
        const g = cmpText(groupLabel(a, groupBy), groupLabel(b, groupBy));
        if (g !== 0) return g;
      }
      const va = sortValue(a, sortKey);
      const vb = sortValue(b, sortKey);
      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * dir;
      }
      return cmpText(String(va), String(vb)) * dir;
    });
    return rows;
  }, [filtered, sortKey, sortDir, groupBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, safePage]);

  // Mantém o modal sincronizado com o snapshot em tempo real
  useEffect(() => {
    if (!selected) return;
    const fresh = items.find((i) => i.id === selected.id);
    if (!fresh) {
      setSelected(null);
      return;
    }
    if (
      fresh.status !== selected.status ||
      fresh.fotoUrl !== selected.fotoUrl ||
      fresh.atualizadoEm !== selected.atualizadoEm ||
      fresh.iaValida !== selected.iaValida ||
      fresh.iaScore !== selected.iaScore ||
      fresh.iaDescricao !== selected.iaDescricao ||
      fresh.iaErro !== selected.iaErro ||
      JSON.stringify(fresh.fotoUrls) !== JSON.stringify(selected.fotoUrls)
    ) {
      setSelected(fresh);
    }
  }, [items, selected]);

  if (!ready || !profile?.nome) {
    return <PageAuthSkeleton />;
  }

  const toggleSort = (key: SortKey) => {
    const firstDir: SortDir =
      key === "createdAt" || key === "fotos" ? "desc" : "asc";
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir(firstDir);
      return;
    }
    if (sortDir === firstDir) {
      setSortDir(firstDir === "asc" ? "desc" : "asc");
      return;
    }
    setSortKey("createdAt");
    setSortDir("desc");
  };

  return (
    <AppShell>
      <OcorrenciaModal
        denuncia={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />

      <header className="mb-6">
        <h1 className="font-display text-2xl font-black text-[var(--verde-esc)] lg:text-3xl">
          Ocorrências
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Curadoria e acompanhamento de denúncias — {filtered.length} com os filtros atuais
          {items.length !== filtered.length ? ` (${items.length} no total)` : ""}.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-4">
        <GooeySearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por endereço, município ou ID…"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-eyebrow text-[var(--muted)]">
            Categoria
          </span>
          {(
            [
              ["ALL", "Todas"],
              ["descarte_irregular", CATEGORIA_LABEL.descarte_irregular],
              ["conteiner_cheio", CATEGORIA_LABEL.conteiner_cheio],
              ["contaminacao_reciclavel", CATEGORIA_LABEL.contaminacao_reciclavel],
              ["entulho_obra", CATEGORIA_LABEL.entulho_obra],
              ["residuo_verde", CATEGORIA_LABEL.residuo_verde],
              ["outros", CATEGORIA_LABEL.outros],
            ] as const
          ).map(([key, label]) => {
            const active = categoria === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategoria(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                  active
                    ? "border-rastro-600 bg-rastro-600 text-white shadow-[var(--shadow-cta)]"
                    : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] hover:bg-[var(--accent-soft)]",
                )}
              >
                {key === "ALL" ? (
                  <Inbox className="h-3.5 w-3.5 opacity-90" />
                ) : (
                  <MdiIcon
                    path={CATEGORIA_MDI[key as DenunciaCategoria]}
                    className="h-3.5 w-3.5 opacity-90"
                  />
                )}
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-1 border-b border-[var(--border)] pb-px">
          {(
            [
              ["todos", "Todos"],
              ["em_analise", STATUS_LABEL.em_analise],
              ["validada", STATUS_LABEL.validada],
              ["roteada", STATUS_LABEL.roteada],
              ["descartada", STATUS_LABEL.descartada],
            ] as const
          ).map(([key, label]) => {
            const active = statusTab === key;
            const Icon = STATUS_ICONS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setStatusTab(key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-t-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "border-b-2 border-rastro-600 text-rastro-600 dark:border-rastro-400 dark:text-rastro-400"
                    : "border-b-2 border-transparent text-[var(--muted)] hover:text-[var(--foreground)]",
                )}
              >
                {key === "em_analise" ? (
                  <Icon
                    className={cn("h-3.5 w-3.5", active && "animate-spin")}
                  />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
                {label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="font-eyebrow text-[var(--muted)]">Agrupar</span>
          {(
            [
              ["none", "Nenhum"],
              ["categoria", "Categoria"],
              ["municipio", "Município"],
              ["status", "Status"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setGroupBy(key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                groupBy === key
                  ? "border-rastro-600 bg-rastro-600 text-white"
                  : "border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] hover:bg-[var(--accent-soft)]",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          Erro ao carregar denúncias: {error}
        </div>
      )}

      {loading ? (
        <TableSkeleton rows={8} />
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)] surface-card">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--accent-soft)]/35">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <SortTh
                    label="Categoria"
                    k="categoria"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortTh
                    label="Município"
                    k="municipio"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortTh
                    label="Endereço"
                    k="endereco"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortTh
                    label="Status"
                    k="status"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortTh
                    label="Fotos"
                    k="fotos"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortTh
                    label="Criada em"
                    k="createdAt"
                    sortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <th className="px-3 py-3 font-semibold">
                    <span className="sr-only">Abrir</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-[var(--muted)]"
                    >
                      Nenhuma ocorrência encontrada.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r, i) => {
                    const fotos = denunciaFotoUrls(r).length;
                    const prev = i > 0 ? pageRows[i - 1] : null;
                    const showGroup =
                      groupBy !== "none" &&
                      (!prev || groupLabel(prev, groupBy) !== groupLabel(r, groupBy));
                    return (
                      <Fragment key={r.id}>
                        {showGroup ? (
                          <tr className="bg-[var(--accent-soft)]/40">
                            <td
                              colSpan={8}
                              className="px-4 py-2 font-eyebrow text-[var(--accent)]"
                            >
                              {groupLabel(r, groupBy)}
                            </td>
                          </tr>
                        ) : null}
                      <tr
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelected(r)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(r);
                          }
                        }}
                        className="group cursor-pointer transition-colors hover:bg-[var(--accent-soft)]/55"
                      >
                        <td className="px-4 py-3 font-data text-xs uppercase text-[var(--muted)]">
                          {r.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-rastro-600">
                              <MdiIcon
                                path={CATEGORIA_MDI[r.categoria]}
                                className="h-4 w-4"
                              />
                            </span>
                            <span className="font-medium">{categoriaLabel(r.categoria)}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3">{r.municipio || "—"}</td>
                        <td className="max-w-xs truncate px-4 py-3 text-[var(--muted)] group-hover:text-[var(--foreground)]">
                          {r.endereco || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} className="font-bold" />
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 font-data text-xs text-[var(--muted)]">
                            <ImageIcon className="h-3.5 w-3.5" />
                            {fotos}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 font-data text-xs text-[var(--muted)]">
                          {formatDateTimeBr(r.createdAt)}
                        </td>
                        <td className="px-3 py-3">
                          <ChevronRight className="h-4 w-4 text-[var(--muted)] transition-transform group-hover:translate-x-0.5 group-hover:text-rastro-600" />
                        </td>
                      </tr>
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--muted)]">
                Página {safePage} de {totalPages} · {PAGE_SIZE} por página
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--accent-soft)] disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-1.5 text-sm font-semibold hover:bg-[var(--accent-soft)] disabled:opacity-40"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AppShell>
  );
}

function SortTh({
  label,
  k,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === k;
  return (
    <th
      className="px-4 py-3 font-semibold"
      aria-sort={
        active ? (sortDir === "asc" ? "ascending" : "descending") : "none"
      }
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        title={`Ordenar por ${label.toLowerCase()}`}
        className="inline-flex items-center gap-1 hover:text-[var(--accent)]"
      >
        {label}
        <span className="inline-flex flex-col leading-none" aria-hidden>
          <ChevronUp
            className={cn(
              "h-3 w-3",
              active && sortDir === "asc"
                ? "text-[var(--accent)]"
                : "text-[var(--muted)]/35",
            )}
          />
          <ChevronDown
            className={cn(
              "-mt-0.5 h-3 w-3",
              active && sortDir === "desc"
                ? "text-[var(--accent)]"
                : "text-[var(--muted)]/35",
            )}
          />
        </span>
      </button>
    </th>
  );
}
