"use client";

import {
  CATEGORIA_LABEL,
  type DenunciaCategoria,
  type DenunciaStatus,
} from "@/lib/denuncias";
import { useDenuncias } from "@/lib/hooks/useDenuncias";
import { useMemo } from "react";
import { InteractiveHoverButton } from "./ui/interactive-hover-button";
import { DashboardSkeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

function DonutStatus({
  pct,
  label,
  hint,
}: {
  pct: number;
  label: string;
  hint: string;
}) {
  const p = Math.min(100, Math.max(0, pct));
  return (
    <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-8">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            className="stroke-[var(--border)]"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            className="stroke-rastro-600 dark:stroke-rastro-400"
            strokeWidth="3"
            strokeDasharray={`${p}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-display text-3xl font-bold tabular-nums text-rastro-600 dark:text-rastro-400">
            {p}%
          </span>
          <span className="text-xs font-medium text-[var(--muted)]">{label}</span>
        </div>
      </div>
      <div className="max-w-sm text-center sm:text-left">
        <p className="text-sm font-semibold text-[var(--foreground)]">
          Encaminhamento às ouvidorias
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
      </div>
    </div>
  );
}

const CAT_ORDER: DenunciaCategoria[] = [
  "descarte_irregular",
  "conteiner_cheio",
  "contaminacao_reciclavel",
  "entulho_obra",
  "residuo_verde",
  "outros",
];

const CAT_STYLE: Record<DenunciaCategoria, string> = {
  descarte_irregular: "from-red-700/90 to-red-800/80",
  conteiner_cheio: "from-amber-600/90 to-amber-700/80",
  contaminacao_reciclavel: "from-sky-700/90 to-sky-800/80",
  entulho_obra: "from-yellow-800/90 to-yellow-900/80",
  residuo_verde: "from-rastro-600/90 to-rastro-800/80",
  outros: "from-zinc-600/90 to-zinc-700/80",
};

export function DashboardHome() {
  const { items, loading, error } = useDenuncias(true);

  const stats = useMemo(() => {
    const countByStatus = (status: DenunciaStatus) =>
      items.filter((d) => d.status === status).length;

    const total = items.length;
    const emAnalise = countByStatus("pendente") + countByStatus("em_analise");
    const roteadas = countByStatus("roteada");
    const validadas = countByStatus("validada") + roteadas;
    const descartadas = countByStatus("descartada");
    const pctRoteadas = total ? Math.round((roteadas / total) * 1000) / 10 : 0;

    const porCategoria: Record<DenunciaCategoria, number> = {
      descarte_irregular: 0,
      conteiner_cheio: 0,
      contaminacao_reciclavel: 0,
      entulho_obra: 0,
      residuo_verde: 0,
      outros: 0,
    };
    const porMunicipio = new Map<string, number>();
    for (const d of items) {
      porCategoria[d.categoria] += 1;
      const m = d.municipio?.trim() || "Sem município";
      porMunicipio.set(m, (porMunicipio.get(m) ?? 0) + 1);
    }

    return {
      total,
      emAnalise,
      roteadas,
      validadas,
      descartadas,
      pctRoteadas,
      porCategoria,
      porMunicipio: [...porMunicipio.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [items]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--foreground)] lg:text-4xl">
          Visão geral
        </h1>
        <p className="mt-2 text-[var(--muted)]">
          Painel de denúncias ambientais e gestão de resíduos urbanos. Dados em tempo real.
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">Erro: {error}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi title="Ocorrências" value={String(stats.total)} hint="Total de denúncias" />
        <Kpi
          title="Em análise"
          value={String(stats.emAnalise)}
          hint="Aguardando ou em triagem da IA"
        />
        <Kpi
          title="Validadas / roteadas"
          value={String(stats.validadas)}
          hint={`${stats.roteadas} já encaminhadas à ouvidoria`}
        />
        <Kpi
          title="Descartadas"
          value={String(stats.descartadas)}
          hint="Rejeitadas (IA ou curadoria)"
        />
      </div>

      <div className="rounded-2xl border border-[var(--border)] surface-card p-6">
        <p className="mb-4 text-sm font-medium text-[var(--muted)]">Taxa de roteamento</p>
        <DonutStatus
          pct={stats.pctRoteadas}
          label="roteadas"
          hint="Percentual de denúncias já geocodificadas e enviadas por e-mail estruturado ao órgão municipal responsável."
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-[var(--muted)]">Por categoria</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {CAT_ORDER.map((c) => {
            const n = stats.porCategoria[c];
            const pct =
              stats.total > 0 ? Math.round((n / stats.total) * 1000) / 10 : 0;
            return (
              <div
                key={c}
                className={cn(
                  "flex min-h-[110px] flex-col justify-between rounded-2xl bg-gradient-to-br p-4 text-white shadow-sm",
                  CAT_STYLE[c],
                )}
              >
                <p className="text-xs font-semibold leading-snug opacity-95">
                  {CATEGORIA_LABEL[c]}
                </p>
                <p className="mt-2 font-display text-3xl font-bold tabular-nums">{n}</p>
                <p className="mt-1 text-[11px] opacity-90">{pct}% do total</p>
              </div>
            );
          })}
        </div>
      </div>

      {stats.porMunicipio.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] surface-card p-6">
          <p className="mb-4 text-sm font-medium text-[var(--muted)]">
            Densidade por município
          </p>
          <ul className="space-y-3">
            {stats.porMunicipio.map(([nome, n]) => {
              const pct =
                stats.total > 0 ? Math.round((n / stats.total) * 100) : 0;
              return (
                <li key={nome}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-[var(--foreground)]">{nome}</span>
                    <span className="tabular-nums text-[var(--muted)]">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--border)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rastro-600 to-rastro-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--accent-soft)]/30 p-6">
        <p className="w-full text-sm font-medium text-[var(--muted)]">Ações rápidas</p>
        <InteractiveHoverButton href="/painel">Ver ocorrências</InteractiveHoverButton>
        <InteractiveHoverButton href="/mapa" variant="secondary">
          Abrir mapa
        </InteractiveHoverButton>
        <InteractiveHoverButton href="/relatorios" variant="secondary">
          Relatórios
        </InteractiveHoverButton>
      </div>
    </div>
  );
}

function Kpi({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] surface-card p-6">
      <p className="text-sm font-medium text-[var(--muted)]">{title}</p>
      <p className="mt-2 font-display text-3xl font-bold tabular-nums text-rastro-600 dark:text-rastro-400">
        {value}
      </p>
      <p className="mt-1 text-xs text-[var(--muted)]">{hint}</p>
    </div>
  );
}
