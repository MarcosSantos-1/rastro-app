"use client";

import { useAuthWeb } from "@/lib/contexts/AuthWebContext";
import { AppShell } from "../components/AppShell";
import { formatDateTimeBr } from "@/lib/format";
import {
  CATEGORIA_LABEL,
  STATUS_LABEL,
  categoriaLabel,
  statusBadgeClass,
  statusLabel,
  type Denuncia,
  type DenunciaCategoria,
  type DenunciaStatus,
} from "@/lib/denuncias";
import { useDenuncias } from "@/lib/hooks/useDenuncias";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type StatusFilter = "todos" | DenunciaStatus;

const PAGE_SIZE = 20;

export default function PainelPage() {
  const { ready, profile } = useAuthWeb();
  const router = useRouter();
  const { items, loading, error } = useDenuncias(!!ready && !!profile?.nome);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState<"ALL" | DenunciaCategoria>("ALL");
  const [statusTab, setStatusTab] = useState<StatusFilter>("todos");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Denuncia | null>(null);

  useEffect(() => {
    if (ready && !profile?.nome) router.replace("/");
  }, [ready, profile?.nome, router]);

  useEffect(() => {
    setPage(1);
  }, [search, categoria, statusTab]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((r) => {
      if (categoria !== "ALL" && r.categoria !== categoria) return false;
      if (statusTab !== "todos" && r.status !== statusTab) return false;
      if (q) {
        const blob =
          `${r.id} ${r.endereco} ${r.bairro} ${r.municipio} ${categoriaLabel(r.categoria)}`.toLowerCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    });
  }, [items, search, categoria, statusTab]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const pageRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  if (!ready || !profile?.nome) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell>
      {selected && (
        <DetailDrawer denuncia={selected} onClose={() => setSelected(null)} />
      )}

      <header className="mb-6">
        <h1 className="text-2xl font-bold lg:text-3xl">Ocorrências</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Curadoria e acompanhamento de denúncias — {filtered.length} com os filtros atuais
          {items.length !== filtered.length ? ` (${items.length} no total)` : ""}.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-4">
        <div className="relative max-w-xl">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por endereço, bairro, município…"
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Categoria:
          </span>
          {(
            [
              ["ALL", "Todas"],
              ["descarte_irregular", CATEGORIA_LABEL.descarte_irregular],
              ["conteiner_cheio", CATEGORIA_LABEL.conteiner_cheio],
              ["contaminacao_reciclavel", CATEGORIA_LABEL.contaminacao_reciclavel],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategoria(key)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                categoria === key
                  ? "bg-green-600 text-white"
                  : "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
          {(
            [
              ["todos", "Todos"],
              ["pendente", STATUS_LABEL.pendente],
              ["em_analise", STATUS_LABEL.em_analise],
              ["validada", STATUS_LABEL.validada],
              ["roteada", STATUS_LABEL.roteada],
              ["descartada", STATUS_LABEL.descartada],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusTab(key)}
              className={`rounded-t-lg px-3 py-2 text-sm font-semibold ${
                statusTab === key
                  ? "border-b-2 border-green-600 text-green-600 dark:border-green-400 dark:text-green-300"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
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
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          Carregando ocorrências…
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Categoria</th>
                  <th className="px-4 py-3 font-semibold">Município</th>
                  <th className="px-4 py-3 font-semibold">Endereço</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">IA</th>
                  <th className="px-4 py-3 font-semibold">Criada em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {pageRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-10 text-center text-zinc-500 dark:text-zinc-400"
                    >
                      Nenhuma ocorrência encontrada.
                    </td>
                  </tr>
                ) : (
                  pageRows.map((r) => (
                    <tr
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelected(r)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(r);
                        }
                      }}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                    >
                      <td className="px-4 py-2 font-mono text-xs">{r.id.slice(0, 8)}</td>
                      <td className="px-4 py-2">{categoriaLabel(r.categoria)}</td>
                      <td className="px-4 py-2">{r.municipio || "—"}</td>
                      <td className="max-w-xs truncate px-4 py-2 text-zinc-700 dark:text-zinc-300">
                        {r.endereco || "—"}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(r.status)}`}
                        >
                          {statusLabel(r.status)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                        {r.iaValida == null
                          ? "—"
                          : r.iaValida
                            ? `${r.iaScore ?? "—"}%`
                            : "inválida"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400">
                        {formatDateTimeBr(r.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filtered.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-zinc-500">
                Página {safePage} de {totalPages} · {PAGE_SIZE} por página
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
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

function DetailDrawer({
  denuncia,
  onClose,
}: {
  denuncia: Denuncia;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto border-l border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="font-mono text-xs text-zinc-500">{denuncia.id}</p>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {categoriaLabel(denuncia.categoria)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Fechar
          </button>
        </div>

        <span
          className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(denuncia.status)}`}
        >
          {statusLabel(denuncia.status)}
        </span>

        <dl className="mt-6 space-y-4 text-sm">
          <Field label="Município" value={denuncia.municipio || "—"} />
          <Field label="Bairro" value={denuncia.bairro || "—"} />
          <Field label="Endereço" value={denuncia.endereco || "—"} />
          <Field
            label="Coordenadas"
            value={`${denuncia.lat.toFixed(5)}, ${denuncia.lng.toFixed(5)}`}
          />
          <Field
            label="Validação IA"
            value={
              denuncia.iaValida == null
                ? "Aguardando"
                : denuncia.iaValida
                  ? `Válida (${denuncia.iaScore}%)`
                  : `Inválida (${denuncia.iaScore}%)`
            }
          />
          <Field label="Criada em" value={formatDateTimeBr(denuncia.createdAt)} />
          <Field
            label="Atualizada em"
            value={formatDateTimeBr(denuncia.atualizadoEm ?? denuncia.createdAt)}
          />
          {denuncia.observacao && <Field label="Observação" value={denuncia.observacao} />}
          {denuncia.fotoUrl && (
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Foto
              </dt>
              <dd className="mt-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={denuncia.fotoUrl}
                  alt="Foto da ocorrência"
                  className="max-h-64 w-full rounded-xl object-cover"
                />
              </dd>
            </div>
          )}
        </dl>
      </aside>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-0.5 text-zinc-800 dark:text-zinc-100">{value}</dd>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
