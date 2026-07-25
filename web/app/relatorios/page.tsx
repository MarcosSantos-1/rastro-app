"use client";

import { useAuthWeb } from "@/lib/contexts/AuthWebContext";
import { AppShell } from "../components/AppShell";
import { splitDateTimeExport } from "@/lib/format";
import {
  CATEGORIA_LABEL,
  STATUS_LABEL,
  categoriaLabel,
  statusLabel,
  type DenunciaCategoria,
  type DenunciaStatus,
} from "@/lib/denuncias";
import { useDenuncias } from "@/lib/hooks/useDenuncias";
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import * as XLSX from "xlsx";

export default function RelatoriosPage() {
  const { ready, profile } = useAuthWeb();
  const router = useRouter();
  const { items, loading, error } = useDenuncias(!!ready && !!profile?.nome);

  useEffect(() => {
    if (ready && !profile?.nome) router.replace("/");
  }, [ready, profile?.nome, router]);

  const resumo = useMemo(() => {
    const porStatus: Record<DenunciaStatus, number> = {
      pendente: 0,
      em_analise: 0,
      validada: 0,
      roteada: 0,
      descartada: 0,
    };
    const porCat: Record<DenunciaCategoria, number> = {
      descarte_irregular: 0,
      conteiner_cheio: 0,
      contaminacao_reciclavel: 0,
    };
    const porMunicipio = new Map<string, number>();
    for (const d of items) {
      porStatus[d.status] += 1;
      porCat[d.categoria] += 1;
      const m = d.municipio?.trim() || "Sem município";
      porMunicipio.set(m, (porMunicipio.get(m) ?? 0) + 1);
    }
    return { porStatus, porCat, porMunicipio: [...porMunicipio.entries()].sort() };
  }, [items]);

  const downloadXlsx = () => {
    const data = items.map((r) => {
      const { data: dataStr, hora: horaStr } = splitDateTimeExport(r.createdAt);
      return {
        id: r.id,
        categoria: categoriaLabel(r.categoria),
        status: statusLabel(r.status),
        municipio: r.municipio ?? "",
        bairro: r.bairro ?? "",
        endereco: r.endereco ?? "",
        latitude: r.lat,
        longitude: r.lng,
        ia_valida: r.iaValida == null ? "" : r.iaValida ? "sim" : "nao",
        ia_score: r.iaScore ?? "",
        data: dataStr,
        hora: horaStr,
        observacao: r.observacao ?? "",
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ocorrencias");
    XLSX.writeFile(wb, `rastro-ocorrencias-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (!ready || !profile?.nome) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="text-2xl font-bold lg:text-3xl">Relatórios</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Resumo operacional e exportação das ocorrências do Firestore.
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-green-500 border-t-transparent" />
          Carregando…
        </div>
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-semibold text-zinc-500">Por status</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(Object.keys(STATUS_LABEL) as DenunciaStatus[]).map((s) => (
                  <li key={s} className="flex justify-between">
                    <span>{STATUS_LABEL[s]}</span>
                    <span className="tabular-nums font-semibold">{resumo.porStatus[s]}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="text-sm font-semibold text-zinc-500">Por categoria</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(Object.keys(CATEGORIA_LABEL) as DenunciaCategoria[]).map((c) => (
                  <li key={c} className="flex justify-between">
                    <span>{CATEGORIA_LABEL[c]}</span>
                    <span className="tabular-nums font-semibold">{resumo.porCat[c]}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900 sm:col-span-2 lg:col-span-1">
              <h2 className="text-sm font-semibold text-zinc-500">Por município</h2>
              {resumo.porMunicipio.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500">Sem dados.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {resumo.porMunicipio.map(([nome, n]) => (
                    <li key={nome} className="flex justify-between">
                      <span>{nome}</span>
                      <span className="tabular-nums font-semibold">{n}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={downloadXlsx}
              disabled={items.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 font-semibold text-white hover:bg-green-500 disabled:opacity-50"
            >
              <svg
                className="h-5 w-5 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Exportar planilha (.xlsx)
            </button>
            <span className="text-sm text-zinc-500">
              {items.length} ocorrências · arquivo{" "}
              <span className="font-mono text-xs">rastro-ocorrencias-….xlsx</span>
            </span>
          </div>
        </>
      )}
    </AppShell>
  );
}
