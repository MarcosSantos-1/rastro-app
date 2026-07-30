"use client";

import { useAuthWeb } from "@/lib/contexts/AuthWebContext";
import { AppShell } from "../components/AppShell";
import { InteractiveHoverButton } from "../components/ui/interactive-hover-button";
import { RelatoriosSkeleton, PageAuthSkeleton } from "../components/ui/skeleton";
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
import { Download } from "lucide-react";
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
      entulho_obra: 0,
      residuo_verde: 0,
      outros: 0,
    };
    const porMunicipio = new Map<string, number>();
    for (const d of items) {
      const st = d.status === "pendente" ? "em_analise" : d.status;
      porStatus[st] += 1;
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
    return <PageAuthSkeleton />;
  }

  return (
    <AppShell>
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
          Relatórios
        </h1>
        <p className="mt-1 text-[var(--muted)]">
          Resumo operacional e exportação das ocorrências do Firestore.
        </p>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <RelatoriosSkeleton />
      ) : (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <section className="rounded-2xl border border-[var(--border)] surface-card p-5">
              <h2 className="text-sm font-semibold text-[var(--muted)]">Por status</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(
                  ["em_analise", "validada", "roteada", "descartada"] as DenunciaStatus[]
                ).map((s) => (
                  <li key={s} className="flex justify-between">
                    <span>{STATUS_LABEL[s]}</span>
                    <span className="tabular-nums font-semibold">{resumo.porStatus[s]}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-[var(--border)] surface-card p-5">
              <h2 className="text-sm font-semibold text-[var(--muted)]">Por categoria</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(Object.keys(CATEGORIA_LABEL) as DenunciaCategoria[]).map((c) => (
                  <li key={c} className="flex justify-between">
                    <span>{CATEGORIA_LABEL[c]}</span>
                    <span className="tabular-nums font-semibold">{resumo.porCat[c]}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-[var(--border)] surface-card p-5 sm:col-span-2 lg:col-span-1">
              <h2 className="text-sm font-semibold text-[var(--muted)]">Por município</h2>
              {resumo.porMunicipio.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--muted)]">Sem dados.</p>
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
            <InteractiveHoverButton
              onClick={downloadXlsx}
              disabled={items.length === 0}
              className="disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Exportar planilha (.xlsx)
            </InteractiveHoverButton>
            <span className="text-sm text-[var(--muted)]">
              {items.length} ocorrências · arquivo{" "}
              <span className="font-mono text-xs">rastro-ocorrencias-….xlsx</span>
            </span>
          </div>
        </>
      )}
    </AppShell>
  );
}
