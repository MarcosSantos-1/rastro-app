"use client";

import {
  BaseTiles,
  IconFix,
  MapLayerMenu,
  type MapBaseLayerId,
} from "@/app/components/map/MapLeafletCommons";
import { MarkerClusterGroup } from "@/app/components/map/MarkerClusterGroup";
import { categoriaMapIcon } from "@/app/components/map/ocorrencia-markers";
import {
  categoriaLabel,
  statusLabel,
  type Denuncia,
} from "@/lib/denuncias";
import { formatDateTimeBr } from "@/lib/format";
import { useDenuncias } from "@/lib/hooks/useDenuncias";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";

type Props = {
  isDark: boolean;
};

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(t);
  }, [map]);
  return null;
}

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
    <div className="relative h-full min-h-0 w-full flex-1 overflow-hidden">
      <div className="absolute left-14 top-3 z-[1000] flex max-w-[calc(100%-7rem)] flex-wrap gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-elevated)]/95 p-2 shadow-sm backdrop-blur-sm">
        {(
          [
            ["ALL", "Todas"],
            ["descarte_irregular", "Descarte"],
            ["conteiner_cheio", "Contêiner"],
            ["contaminacao_reciclavel", "Reciclável"],
            ["entulho_obra", "Entulho"],
            ["residuo_verde", "Verde"],
            ["outros", "Outros"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFiltroCat(key)}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
              filtroCat === key
                ? "bg-rastro-600 text-white"
                : "bg-[var(--accent-soft)] text-[var(--foreground)] hover:opacity-90"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="self-center px-1 text-[11px] tabular-nums text-[var(--muted)]">
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
        className="h-full min-h-[560px] w-full"
        scrollWheelZoom
      >
        <IconFix />
        <InvalidateSize />
        <BaseTiles layer={layer} />
        <MarkerClusterGroup chunkedLoading>
          {pontos.map((d) => (
            <Marker
              key={d.id}
              position={[d.lat, d.lng]}
              icon={categoriaMapIcon(d.categoria)}
            >
              <Popup>
                <div className="min-w-[200px] space-y-1 text-sm">
                  <p className="font-semibold">{categoriaLabel(d.categoria)}</p>
                  <p className="text-xs text-zinc-600">{statusLabel(d.status)}</p>
                  <p className="text-xs">{d.municipio || "—"}</p>
                  <p className="text-xs">{d.endereco || "—"}</p>
                  <p className="text-[11px] text-zinc-500">{formatDateTimeBr(d.createdAt)}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
