"use client";

import { MdiIcon, mdiRecycle } from "@/app/components/ui/mdi-icon";
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
  { id: "esri_labels", label: "Satélite + ruas" },
];

const ESRI_IMAGERY =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
/** Traçado de vias (Esri) — complementa o satélite. */
const ESRI_TRANSPORT =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}";
/**
 * Labels OSM via Carto (inclui nomes de ruas). O overlay Esri Boundaries_and_Places
 * só traz países/estados/POIs — por isso usamos Carto dark_only_labels no satélite.
 */
const CARTO_DARK_LABELS =
  "https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png";
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
          key="esri-roads"
          attribution={ATTR_ESRI}
          url={ESRI_TRANSPORT}
          maxZoom={19}
          opacity={0.85}
          pane="overlayPane"
        />
        <TileLayer
          key="carto-street-labels"
          attribution={ATTR_CARTO}
          url={CARTO_DARK_LABELS}
          maxZoom={20}
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

/** Menu de camadas (canto inferior direito) com satélite + ecopontos. */
export function MapLayerMenu({
  layer,
  onChange,
  showEcopontos,
  onToggleEcopontos,
}: {
  layer: MapBaseLayerId;
  onChange: (id: MapBaseLayerId) => void;
  showEcopontos: boolean;
  onToggleEcopontos: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-3 right-3 z-[1000] flex flex-col items-end gap-2">
      {open && (
        <div className="min-w-[180px] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]/95 py-1 shadow-lg backdrop-blur-sm">
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
                  ? "bg-rastro-600 text-white"
                  : "text-[var(--foreground)] hover:bg-[var(--accent-soft)]"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={onToggleEcopontos}
        className={`flex h-10 w-10 items-center justify-center rounded-full border shadow-md backdrop-blur-sm ${
          showEcopontos
            ? "border-[#2563eb]/40 bg-[#2563eb] text-white"
            : "border-[var(--border)] bg-[var(--surface-elevated)]/95 text-[var(--foreground)] hover:bg-[var(--accent-soft)]"
        }`}
        title={showEcopontos ? "Ocultar ecopontos" : "Mostrar ecopontos"}
        aria-label={showEcopontos ? "Ocultar ecopontos" : "Mostrar ecopontos"}
        aria-pressed={showEcopontos}
      >
        <MdiIcon path={mdiRecycle} className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-elevated)]/95 text-[var(--foreground)] shadow-md hover:bg-[var(--accent-soft)]"
        title="Camadas do mapa"
        aria-label="Camadas do mapa"
        aria-expanded={open}
      >
        <span className="text-lg leading-none" aria-hidden>
          🛰️
        </span>
      </button>
    </div>
  );
}

