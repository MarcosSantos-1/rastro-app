import type { Registro } from "@/lib/firestore/types";

function parseQuantidade(q: string): number {
  const match = q.replace(",", ".").match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

export function aggregateByEcoponto(registros: Registro[]) {
  const map = new Map<string, { entradas: number; saidas: number }>();
  for (const r of registros) {
    const prev = map.get(r.ecoponto) ?? { entradas: 0, saidas: 0 };
    const val = parseQuantidade(r.quantidade);
    if (r.tipo === "Entrada") prev.entradas += val;
    else prev.saidas += val;
    map.set(r.ecoponto, prev);
  }
  return Array.from(map.entries()).map(([nome, v]) => ({
    nome,
    entradas: Math.round(v.entradas * 10) / 10,
    saidas: Math.round(v.saidas * 10) / 10,
    saldo: Math.round((v.entradas - v.saidas) * 10) / 10,
  }));
}

export function aggregateByMaterial(registros: Registro[]) {
  const map = new Map<string, number>();
  for (const r of registros) {
    const prev = map.get(r.material) ?? 0;
    map.set(r.material, prev + parseQuantidade(r.quantidade));
  }
  const colors: Record<string, string> = {
    Entulho: "#6366f1",
    Madeira: "#8b5cf6",
    Gesso: "#a855f7",
    PEV: "#22c55e",
  };
  return Array.from(map.entries()).map(([nome, quantidade]) => ({
    nome,
    quantidade: Math.round(quantidade),
    cor: colors[nome] ?? "#6b7280",
  }));
}

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function aggregateByDia(registros: Registro[], diasAtras = 7) {
  const map = new Map<string, { entradas: number; saidas: number }>();
  const hoje = new Date();
  for (let i = 0; i < diasAtras; i++) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { entradas: 0, saidas: 0 });
  }
  for (const r of registros) {
    const prev = map.get(r.data);
    if (!prev) continue;
    const val = parseQuantidade(r.quantidade);
    if (r.tipo === "Entrada") prev.entradas += val;
    else prev.saidas += val;
    map.set(r.data, prev);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([data, v]) => {
      const d = new Date(data + "T12:00:00");
      return {
        dia: DIAS[d.getDay()],
        entradas: Math.round(v.entradas * 10) / 10,
        saidas: Math.round(v.saidas * 10) / 10,
      };
    });
}
