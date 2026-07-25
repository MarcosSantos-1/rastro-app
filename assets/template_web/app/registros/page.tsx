"use client";

import { useState, useMemo } from "react";
import { useRegistros } from "@/lib/hooks/useFirestore";

function formatDataBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function RegistrosPage() {
  const { data: registros, loading, error, refetch } = useRegistros();
  const [busca, setBusca] = useState("");
  const [dataInicio, setDataInicio] = useState("2025-02-01");
  const [dataFim, setDataFim] = useState("2025-02-28");
  const [ecoponto, setEcoponto] = useState("");
  const [material, setMaterial] = useState("");
  const [tipo, setTipo] = useState("");

  const fichasFiltradas = useMemo(() => {
    return registros.filter((f) => {
      const matchBusca =
        !busca ||
        f.ecoponto.toLowerCase().includes(busca.toLowerCase()) ||
        f.material.toLowerCase().includes(busca.toLowerCase()) ||
        f.municipe.toLowerCase().includes(busca.toLowerCase()) ||
        f.observacao.toLowerCase().includes(busca.toLowerCase());

      const matchData =
        (!dataInicio || f.data >= dataInicio) &&
        (!dataFim || f.data <= dataFim);

      const matchEcoponto = !ecoponto || f.ecoponto === ecoponto;
      const matchMaterial =
        !material || f.material.toLowerCase() === material.toLowerCase();
      const matchTipo = !tipo || f.tipo === tipo;

      return matchBusca && matchData && matchEcoponto && matchMaterial && matchTipo;
    });
  }, [registros, busca, dataInicio, dataFim, ecoponto, material, tipo]);

  const ecopontosUnicos = useMemo(
    () => [...new Set(registros.map((r) => r.ecoponto))].sort(),
    [registros]
  );
  const materiaisUnicos = useMemo(
    () => [...new Set(registros.map((r) => r.material))].sort(),
    [registros]
  );

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
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Fichas dos Ecopontos
          </h1>
        </header>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
          <p className="font-medium text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 lg:text-3xl">
            Fichas dos Ecopontos
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-300">
            Registros de entradas e saídas por ecoponto (Firebase)
          </p>
        </div>
      </header>

      <article className="rounded-2xl border border-zinc-200/60 bg-white/80 p-4 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80">
        <h2 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Filtros de pesquisa
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Buscar
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Ecoponto, material, munícipe..."
                className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-4 text-sm text-zinc-900 placeholder-zinc-400 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Data inicial
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Data final
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Ecoponto
            </label>
            <select
              value={ecoponto}
              onChange={(e) => setEcoponto(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              <option value="">Todos</option>
              {ecopontosUnicos.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Material
            </label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              <option value="">Todos</option>
              {materiaisUnicos.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white py-2 px-3 text-sm text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              <option value="">Todos</option>
              <option value="Entrada">Entrada</option>
              <option value="Saída">Saída</option>
            </select>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-zinc-200/60 bg-white/80 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-600 dark:bg-zinc-900/50">
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                  Data / Hora
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                  Ecoponto
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                  Material
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                  Quantidade
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                  Munícipe / Obs.
                </th>
              </tr>
            </thead>
            <tbody>
              {fichasFiltradas.map((ficha) => (
                <tr
                  key={ficha.id}
                  className="border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-700/30"
                >
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">
                    {formatDataBR(ficha.data)} {ficha.hora}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {ficha.ecoponto}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        ficha.tipo === "Entrada"
                          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/40 dark:text-green-300"
                          : "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                      }
                    >
                      {ficha.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                    {ficha.material}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-zinc-900 dark:text-zinc-100">
                    {ficha.quantidade}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {ficha.municipe !== "—" ? ficha.municipe : ficha.observacao}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-zinc-200 bg-zinc-50/50 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900/30 dark:text-zinc-400">
          Exibindo {fichasFiltradas.length} de {registros.length} registros
        </div>
      </article>
    </div>
  );
}
