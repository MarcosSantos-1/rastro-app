"use client";

import type { DenunciaCategoria } from "@/lib/denuncias";
import { categoriaMarkerColor } from "@/lib/denuncias";
import L from "leaflet";

const ICON_SVG: Record<DenunciaCategoria, string> = {
  descarte_irregular:
    '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
  conteiner_cheio:
    '<path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.29 7 12 12l8.71-5M12 22V12"/>',
  contaminacao_reciclavel:
    '<path d="M7 19H4.54a1 1 0 0 1-.94-1.34l2.7-6.17"/><path d="M17 19h2.46a1 1 0 0 0 .94-1.34l-2.7-6.17"/><path d="M12 3v6"/><path d="m8 8 4-5 4 5"/><path d="M7 19v-3"/><path d="M17 19v-3"/>',
  entulho_obra:
    '<path d="M2 22h20"/><path d="M6 22V9l6-6 6 6v13"/><path d="M10 22v-4h4v4"/>',
  residuo_verde:
    '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  outros:
    '<circle cx="12" cy="12" r="8" stroke-dasharray="3 3"/><circle cx="12" cy="12" r="2"/>',
};

function svgIcon(paths: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

const iconCache = new Map<string, L.DivIcon>();

export function categoriaMapIcon(categoria: DenunciaCategoria): L.DivIcon {
  const cached = iconCache.get(categoria);
  if (cached) return cached;

  const color = categoriaMarkerColor(categoria);
  const icon = L.divIcon({
    className: "rastro-occ-marker",
    html: `<div style="
      width:32px;height:32px;border-radius:9999px;
      background:${color};
      border:2px solid rgba(255,255,255,0.92);
      box-shadow:0 2px 8px rgba(0,0,0,0.28);
      display:flex;align-items:center;justify-content:center;
    ">${svgIcon(ICON_SVG[categoria])}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

  iconCache.set(categoria, icon);
  return icon;
}

export function clusterDivIcon(count: number): L.DivIcon {
  const display = count > 99 ? "+99" : String(count);
  const size = count > 99 ? 46 : count > 20 ? 42 : count > 9 ? 38 : 34;
  return L.divIcon({
    className: "rastro-cluster-marker",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:linear-gradient(145deg,#3a6b4b,#2f5640);
      border:2px solid rgba(255,255,255,0.9);
      box-shadow:0 3px 12px rgba(0,0,0,0.3);
      color:#fff;font-weight:700;font-size:${count > 99 ? 12 : 13}px;
      display:flex;align-items:center;justify-content:center;
      font-family:var(--font-ibm-plex),system-ui,sans-serif;
    ">${display}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
