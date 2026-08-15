"use client";

import type { DenunciaCategoria } from "@/lib/denuncias";
import { categoriaMarkerColor } from "@/lib/denuncias";
import { CATEGORIA_MDI, mdiRecycle } from "@/app/components/ui/mdi-icon";
import L from "leaflet";

function svgIcon(path: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="#fff"><path d="${path}"/></svg>`;
}

const iconCache = new Map<string, L.DivIcon>();

function pinIcon(key: string, color: string, path: string): L.DivIcon {
  const cached = iconCache.get(key);
  if (cached) return cached;
  const icon = L.divIcon({
    className: "rastro-occ-marker",
    html: `<div style="
      width:32px;height:32px;border-radius:9999px;
      background:${color};
      border:2px solid rgba(255,255,255,0.92);
      box-shadow:0 2px 8px rgba(12,26,19,0.28);
      display:flex;align-items:center;justify-content:center;
    ">${svgIcon(path)}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
  iconCache.set(key, icon);
  return icon;
}

export function categoriaMapIcon(categoria: DenunciaCategoria): L.DivIcon {
  return pinIcon(`cat-${categoria}`, categoriaMarkerColor(categoria), CATEGORIA_MDI[categoria]);
}

export function ecopontoMapIcon(): L.DivIcon {
  return pinIcon("ecoponto", "#2563eb", mdiRecycle);
}

export function clusterDivIcon(count: number): L.DivIcon {
  const display = count > 99 ? "+99" : String(count);
  const size = count > 99 ? 46 : count > 20 ? 42 : count > 9 ? 38 : 34;
  return L.divIcon({
    className: "rastro-cluster-marker",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:9999px;
      background:linear-gradient(145deg,#28935D,#123A26);
      border:2px solid rgba(255,255,255,0.9);
      box-shadow:0 3px 12px rgba(12,26,19,0.3);
      color:#fff;font-weight:700;font-size:${count > 99 ? 12 : 13}px;
      display:flex;align-items:center;justify-content:center;
      font-family:var(--font-martian),ui-monospace,sans-serif;
    ">${display}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
