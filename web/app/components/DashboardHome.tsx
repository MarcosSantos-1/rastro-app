"use client";

import {
  CATEGORIA_LABEL,
  type DenunciaCategoria,
  type DenunciaStatus,
} from "@/lib/denuncias";
import { useDenuncias } from "@/lib/hooks/useDenuncias";
import Link from "next/link";
import { useMemo } from "react";

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
            className="stroke-zinc-200 dark:stroke-zinc-700"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15.9155"
            fill="none"
            className="stroke-green-600 dark:stroke-green-400"
            strokeWidth="3"
            strokeDasharray={`${p}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold tabular-nums text-green-600 dark:text-green-400">
            {p}%
          </span>
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</span>
        </div>
      </div>
      <div className="max-w-sm text-center sm:text-left">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
          Encaminhamento às ouvidorias
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>
      </div>
    </div>
  );
}

const CAT_ORDER: DenunciaCategoria[] = [
  "descarte_irregular",
  "conteiner_cheio",
  "contaminacao_reciclavel",
];

const CAT_STYLE: Record<DenunciaCategoria, { bar: string; text: string }> = {
  descarte_irregular: { bar: "bg-red-600", text: "text-white" },
  conteiner_cheio: { bar: "bg-amber-500", text: "text-zinc-900" },
  contaminacao_reciclavel: { bar: "bg-sky-600", text: "text-white" },
};

export function DashboardHome() {
  const { items, loading, error } = useDenuncias(true);

  const stats = useMemo(() => {
    const countByStatus = (status: DenunciaStatus) =>
      items.filter((d) => d.status === status).length;

    const total = items.length;
    const pendentes = countByStatus("pendente") + countByStatus("em_analise");
    const roteadas = countByStatus("roteada");
    const validadas = countByStatus("validada") + roteadas;
    const descartadas = countByStatus("descartada");
    const pctRoteadas = total ? Math.round((roteadas / total) * 1000) / 10 : 0;

    const porCategoria: Record<DenunciaCategoria, number> = {
      descarte_irregular: 0,
      conteiner_cheio: 0,
      contaminacao_reciclavel: 0,
    };
    const porMunicipio = new Map<string, number>();
    for (const d of items) {
      porCategoria[d.categoria] += 1;
      const m = d.municipio?.trim() || "Sem município";
      porMunicipio.set(m, (porMunicipio.get(m) ?? 0) + 1);
    }

    return {
      total,
      pendentes,
      roteadas,
      validadas,
      descartadas,
      pctRoteadas,
      porCategoria,
      porMunicipio: [...porMunicipio.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [items]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 lg:text-4xl">
          Visão geral
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Painel de denúncias ambientais e gestão de resíduos urbanos.
          {loading ? " Carregando…" : " Dados em tempo real."}
        </p>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">Erro: {error}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          title="Ocorrências"
          value={loading ? "…" : String(stats.total)}
          hint="Total de denúncias"
        />
        <Kpi
          title="Na fila"
          value={loading ? "…" : String(stats.pendentes)}
          hint="Pendentes + em análise"
        />
        <Kpi
          title="Validadas / roteadas"
          value={loading ? "…" : String(stats.validadas)}
          hint={`${stats.roteadas} já encaminhadas à ouvidoria`}
        />
        <Kpi
          title="Descartadas"
          value={loading ? "…" : String(stats.descartadas)}
          hint="Rejeitadas (IA ou curadoria)"
        />
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Taxa de roteamento
        </p>
        <DonutStatus
          pct={stats.pctRoteadas}
          label="roteadas"
          hint="Percentual de denúncias já geocodificadas e enviadas por e-mail estruturado ao órgão municipal responsável."
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">
          Por categoria
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {CAT_ORDER.map((c) => {
            const n = stats.porCategoria[c];
            const pct =
              stats.total > 0 ? Math.round((n / stats.total) * 1000) / 10 : 0;
            const st = CAT_STYLE[c];
            return (
              <div
                key={c}
                className={`flex min-h-[110px] flex-col justify-between rounded-2xl p-4 ${st.bar} ${st.text}`}
              >
                <p className="text-xs font-semibold leading-snug opacity-95">
                  {CATEGORIA_LABEL[c]}
                </p>
                <p className="mt-2 text-3xl font-bold tabular-nums">{loading ? "…" : n}</p>
                <p className="mt-1 text-[11px] opacity-90">{pct}% do total</p>
              </div>
            );
          })}
        </div>
      </div>

      {stats.porMunicipio.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="mb-4 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Densidade por município
          </p>
          <ul className="space-y-3">
            {stats.porMunicipio.map(([nome, n]) => {
              const pct =
                stats.total > 0 ? Math.round((n / stats.total) * 100) : 0;
              return (
                <li key={nome}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium text-zinc-800 dark:text-zinc-100">{nome}</span>
                    <span className="tabular-nums text-zinc-500">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-green-600 dark:bg-green-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-3 rounded-2xl border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
        <p className="w-full text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Ações rápidas
        </p>
        <Link
          href="/painel"
          className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-500"
        >
          Ver ocorrências
        </Link>
        <Link
          href="/mapa"
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Abrir mapa
        </Link>
        <Link
          href="/relatorios"
          className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          Relatórios
        </Link>
      </div>
    </div>
  );
}

function Kpi({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums text-green-600 dark:text-green-400">
        {value}
      </p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}
