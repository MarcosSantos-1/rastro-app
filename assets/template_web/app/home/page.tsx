"use client";

import { useRegistros, useEcopontos } from "@/lib/hooks/useFirestore";
import { aggregateByEcoponto, aggregateByMaterial, aggregateByDia } from "@/lib/utils/aggregate";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function HomePage() {
  const { data: registros, loading, error, refetch } = useRegistros();
  const { data: ecopontos } = useEcopontos();

  const porEcoponto = aggregateByEcoponto(registros);
  const porMaterial = aggregateByMaterial(registros);
  const porDia = aggregateByDia(registros);

  const parseQ = (q: string) => {
    const m = (q || "0").replace(",", ".").match(/[\d.]+/);
    return m ? parseFloat(m[0]) : 0;
  };
  const totalEntradas = registros
    .filter((r) => r.tipo === "Entrada")
    .reduce((s, r) => s + parseQ(r.quantidade), 0);
  const totalSaidas = registros
    .filter((r) => r.tipo === "Saída")
    .reduce((s, r) => s + parseQ(r.quantidade), 0);
  const saldo = Math.round((totalEntradas - totalSaidas) * 10) / 10;

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-zinc-600 dark:text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
        <p className="font-medium text-red-800 dark:text-red-200">{error}</p>
        <p className="mt-1 text-sm text-red-700 dark:text-red-300">
          Verifique a conexão com o Firebase e as regras do Firestore.
        </p>
        <button
          onClick={() => refetch()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 lg:text-3xl">
          Visão geral dos Ecopontos
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          Dados do Firebase — {registros.length} registros
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de entradas (m³)"
          value={totalEntradas.toFixed(1)}
          subtitle="Todos os registros"
          icon="📥"
        />
        <StatCard
          title="Total de saídas (m³)"
          value={totalSaidas.toFixed(1)}
          subtitle="Todos os registros"
          icon="📤"
        />
        <StatCard
          title="Saldo estimado (m³)"
          value={saldo.toFixed(1)}
          subtitle="Acumulado"
          icon="🧮"
        />
        <StatCard
          title="Ecopontos ativos"
          value={String(ecopontos.filter((e) => e.ativo !== false).length)}
          subtitle="Em operação"
          icon="♻️"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Entradas x Saídas por dia
          </h2>
          <div className="h-64 min-h-64 w-full">
            {porDia.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                <BarChart data={porDia}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-600" />
                  <XAxis dataKey="dia" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="entradas" fill="#6366f1" name="Entradas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" fill="#8b5cf6" name="Saídas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                Sem dados para exibir
              </div>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Materiais por tipo
          </h2>
          <div className="h-64 min-h-64 w-full">
            {porMaterial.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                <PieChart>
                  <Pie
                    data={porMaterial}
                    dataKey="quantidade"
                    nameKey="nome"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {porMaterial.map((entry, index) => (
                      <Cell key={index} fill={entry.cor} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                Sem dados para exibir
              </div>
            )}
          </div>
        </article>
      </section>

      <section>
        <article className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Por ecoponto
          </h2>
          <div className="overflow-x-auto">
            {porEcoponto.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-600">
                    <th className="pb-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                      Ecoponto
                    </th>
                    <th className="pb-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      Entradas (m³)
                    </th>
                    <th className="pb-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      Saídas (m³)
                    </th>
                    <th className="pb-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                      Saldo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {porEcoponto.map((row) => (
                    <tr
                      key={row.nome}
                      className="border-b border-zinc-100 dark:border-zinc-700/50"
                    >
                      <td className="py-3 text-zinc-900 dark:text-zinc-100">{row.nome}</td>
                      <td className="py-3 text-right text-zinc-600 dark:text-zinc-300">
                        {row.entradas}
                      </td>
                      <td className="py-3 text-right text-zinc-600 dark:text-zinc-300">
                        {row.saidas}
                      </td>
                      <td className="py-3 text-right font-medium text-indigo-600 dark:text-indigo-400">
                        {row.saldo} m³
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-500">
                Nenhum registro encontrado
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
}) {
  return (
    <article className="rounded-xl border border-zinc-200/60 bg-white/80 p-4 shadow-lg backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-100">{value}</p>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
        </div>
        <span className="text-2xl">{icon}</span>
      </div>
    </article>
  );
}
