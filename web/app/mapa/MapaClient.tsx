"use client";

import {
  BaseTiles,
  IconFix,
  MapLayerMenu,
  type MapBaseLayerId,
} from "@/app/components/map/MapLeafletCommons";
import {
  categoriaLabel,
  categoriaMarkerColor,
  statusLabel,
  type Denuncia,
} from "@/lib/denuncias";
import { formatDateTimeBr } from "@/lib/format";
import { useDenuncias } from "@/lib/hooks/useDenuncias";
import { CircleMarker, MapContainer, Popup } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";

type Props = {
  isDark: boolean;
};

export default function MapaClient({ isDark }: Props) {
  const { items, loading, error } = useDenuncias(true);
  const [filtroCat, setFiltroCat] = useState<"ALL" | Denuncia["categoria"]>("ALL");
  const [layer, setLayer] = useState<MapBaseLayerId>(isDark ? "dark_matter" : "light");

  useEffect(() => {
    setLayer((prev) => {
      if (prev === "esri" || prev === "esri_labels") return prev;
      return isDark ? "dark_matter" : "light";
    });
  }, [isDark]);

  const pontos = useMemo(() => {
    if (filtroCat === "ALL") return items;
    return items.filter((d) => d.categoria === filtroCat);
  }, [items, filtroCat]);

  const center = useMemo((): [number, number] => {
    if (!pontos.length) return [-23.5, -46.8];
    const lat = pontos.reduce((s, p) => s + p.lat, 0) / pontos.length;
    const lng = pontos.reduce((s, p) => s + p.lng, 0) / pontos.length;
    return [lat, lng];
  }, [pontos]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
      {/* left-14 evita sobreposição com os controles de zoom do Leaflet */}
      <div className="absolute left-14 top-3 z-[1000] flex max-w-[calc(100%-7rem)] flex-wrap gap-1.5 rounded-xl border border-zinc-200 bg-white/95 p-2 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/95">
        {(
          [
            ["ALL", "Todas"],
            ["descarte_irregular", "Descarte"],
            ["conteiner_cheio", "Contêiner"],
            ["contaminacao_reciclavel", "Reciclável"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFiltroCat(key)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
              filtroCat === key
                ? "bg-green-600 text-white"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="self-center px-1 text-[11px] tabular-nums text-zinc-500">
          {loading ? "…" : pontos.length}
        </span>
      </div>

      <MapLayerMenu layer={layer} onChange={setLayer} />

      {error && (
        <div className="absolute bottom-16 left-3 right-16 z-[1000] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/80 dark:text-red-200">
          {error}
        </div>
      )}

      <MapContainer
        center={center}
        zoom={8}
        className="h-full min-h-[420px] w-full flex-1"
        scrollWheelZoom
      >
        <IconFix />
        <BaseTiles layer={layer} />
        {pontos.map((d) => (
          <CircleMarker
            key={d.id}
            center={[d.lat, d.lng]}
            radius={8}
            pathOptions={{
              color: categoriaMarkerColor(d.categoria),
              fillColor: categoriaMarkerColor(d.categoria),
              fillOpacity: 0.85,
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-[200px] space-y-1 text-sm">
                <p className="font-semibold">{categoriaLabel(d.categoria)}</p>
                <p className="text-xs text-zinc-600">{statusLabel(d.status)}</p>
                <p className="text-xs">
                  {[d.municipio, d.bairro].filter(Boolean).join(" · ") || "—"}
                </p>
                <p className="text-xs">{d.endereco || "—"}</p>
                <p className="text-[11px] text-zinc-500">{formatDateTimeBr(d.createdAt)}</p>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
