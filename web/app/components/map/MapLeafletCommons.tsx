"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import { TileLayer, useMap } from "react-leaflet";

export function IconFix() {
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    });
  }, []);
  return null;
}

export type MapBaseLayerId = "light" | "dark_matter" | "esri" | "esri_labels";

export const MAP_BASE_LAYERS: {
  id: MapBaseLayerId;
  label: string;
}[] = [
  { id: "light", label: "Mapa claro" },
  { id: "dark_matter", label: "Dark Matter" },
  { id: "esri", label: "Satélite" },
  { id: "esri_labels", label: "Satélite + nomes" },
];

const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const ESRI_LABELS =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const CARTO_LIGHT = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const CARTO_DARK = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

const ATTR_CARTO =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/attributions">CARTO</a>';
const ATTR_ESRI =
  "Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community";

/** Compat: escolhe Carto claro/escuro conforme o tema. */
export function ThemeTiles({ dark }: { dark: boolean }) {
  return <BaseTiles layer={dark ? "dark_matter" : "light"} />;
}

export function BaseTiles({ layer }: { layer: MapBaseLayerId }) {
  const map = useMap();
  useEffect(() => {
    map.invalidateSize();
  }, [layer, map]);

  if (layer === "esri") {
    return (
      <TileLayer key="esri" attribution={ATTR_ESRI} url={ESRI_IMAGERY} maxZoom={19} />
    );
  }

  if (layer === "esri_labels") {
    return (
      <>
        <TileLayer key="esri-base" attribution={ATTR_ESRI} url={ESRI_IMAGERY} maxZoom={19} />
        <TileLayer
          key="esri-labels"
          attribution={ATTR_ESRI}
          url={ESRI_LABELS}
          maxZoom={19}
          pane="overlayPane"
        />
      </>
    );
  }

  if (layer === "dark_matter") {
    return (
      <TileLayer key="dark_matter" attribution={ATTR_CARTO} url={CARTO_DARK} maxZoom={20} />
    );
  }

  return <TileLayer key="light" attribution={ATTR_CARTO} url={CARTO_LIGHT} maxZoom={20} />;
}

/** Menu de camadas (canto inferior direito) com ícone de satélite. */
export function MapLayerMenu({
  layer,
  onChange,
}: {
  layer: MapBaseLayerId;
  onChange: (id: MapBaseLayerId) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-3 right-3 z-[1000]">
      {open && (
        <div className="mb-2 min-w-[180px] overflow-hidden rounded-xl border border-zinc-200 bg-white/95 py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900/95">
          {MAP_BASE_LAYERS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                onChange(l.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-semibold ${
                layer === l.id
                  ? "bg-green-600 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white/95 text-zinc-700 shadow-md hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-zinc-200 dark:hover:bg-zinc-800"
        title="Camadas do mapa"
        aria-label="Camadas do mapa"
        aria-expanded={open}
      >
        <SatelliteIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

function SatelliteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 9l-2 2m0 0l-6-6 2-2m4 8l2 2M5 15l2-2m0 0l6 6-2 2m-4-8l-2-2"
      />
      <circle cx="12" cy="12" r="2.5" strokeWidth={2} />
      <path
        strokeLinecap="round"
        strokeWidth={2}
        d="M4 12h2M18 12h2M12 4v2M12 18v2"
      />
    </svg>
  );
}
