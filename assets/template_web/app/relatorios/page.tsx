"use client";

import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { useRegistros } from "@/lib/hooks/useFirestore";

function formatDataBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function RelatoriosPage() {
  const { data: registros, loading, error } = useRegistros();
  const [dataInicio, setDataInicio] = useState("2025-02-01");
  const [dataFim, setDataFim] = useState("2025-02-28");
  const [ecoponto, setEcoponto] = useState("");
  const [material, setMaterial] = useState("");

  const filtrados = useMemo(() => {
    return registros.filter((r) => {
      const matchData = r.data >= dataInicio && r.data <= dataFim;
      const matchEcoponto = !ecoponto || r.ecoponto === ecoponto;
      const matchMaterial = !material || r.material === material;
      return matchData && matchEcoponto && matchMaterial;
    });
  }, [registros, dataInicio, dataFim, ecoponto, material]);

  const dadosExport = useMemo(
    () =>
      filtrados.map((r) => ({
        data: formatDataBR(r.data),
        ecoponto: r.ecoponto,
        material: r.material,
        tipo: r.tipo,
        quantidade: r.quantidade,
        peso: r.material === "PEV" ? r.quantidade : "—",
      })),
    [filtrados]
  );

  const handleExportXLSX = () => {
    const ws = XLSX.utils.json_to_sheet(dadosExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `relatorio-ecopontos-${dataInicio}_${dataFim}.xlsx`);
  };

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

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 lg:text-3xl">
          Relatórios
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          Filtre e exporte dados em planilha XLSX (Firebase)
        </p>
      </header>

      <article className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Filtros
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Data inicial
            </label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Data final
            </label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Ecoponto
            </label>
            <select
              value={ecoponto}
              onChange={(e) => setEcoponto(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              <option value="">Todos</option>
              {ecopontosUnicos.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Material
            </label>
            <select
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100"
            >
              <option value="">Todos</option>
              {materiaisUnicos.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={handleExportXLSX}
            disabled={filtrados.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-6 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Exportar XLSX
          </button>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {filtrados.length} registros para exportar
          </p>
        </div>
      </article>

      <article className="rounded-2xl border border-zinc-200/60 bg-white/80 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80 overflow-hidden">
        <div className="border-b border-zinc-200 bg-zinc-50/80 px-4 py-3 dark:border-zinc-600 dark:bg-zinc-900/50">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Prévia dos dados
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-600">
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">Data</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">Ecoponto</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">Material</th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">Tipo</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">Quantidade</th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">Peso</th>
              </tr>
            </thead>
            <tbody>
              {dadosExport.map((row, i) => (
                <tr key={i} className="border-b border-zinc-100 dark:border-zinc-700/50">
                  <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100">{row.data}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.ecoponto}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.material}</td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">{row.tipo}</td>
                  <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{row.quantidade}</td>
                  <td className="px-4 py-3 text-right text-zinc-700 dark:text-zinc-300">{row.peso}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtrados.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-500">
            Nenhum registro encontrado com os filtros selecionados
          </p>
        )}
      </article>
    </div>
  );
}
