"use client";

import {
  BaseTiles,
  IconFix,
  MapLayerMenu,
  type MapBaseLayerId,
} from "@/app/components/map/MapLeafletCommons";
import { MarkerClusterGroup } from "@/app/components/map/MarkerClusterGroup";
import {
  categoriaMapIcon,
  ecopontoMapIcon,
} from "@/app/components/map/ocorrencia-markers";
import { ImageViewer } from "@/app/components/ui/image-viewer";
import {
  CATEGORIA_MDI,
  MdiIcon,
  mdiCalendar,
  mdiMapMarker,
  mdiRecycle,
} from "@/app/components/ui/mdi-icon";
import { StatusBadge } from "@/app/components/ui/status-badge";
import {
  categoriaLabel,
  denunciaFotoUrls,
  type Denuncia,
} from "@/lib/denuncias";
import { formatDateTimeBr } from "@/lib/format";
import { useDenuncias } from "@/lib/hooks/useDenuncias";
import { X } from "lucide-react";
import { MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useMemo, useState } from "react";
import ecopontosData from "@/lib/data/ecopontos-sp.json";

type Props = {
  isDark: boolean;
};

type Ecoponto = {
  id: string;
  nome: string;
  endereco: string;
  distrito: string;
  lat: number;
  lng: number;
};

type Selection =
  | { kind: "ocorrencia"; denuncia: Denuncia }
  | { kind: "ecoponto"; eco: Ecoponto };

const ECOPONTOS = ecopontosData as Ecoponto[];

function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 80);
    return () => window.clearTimeout(t);
  }, [map]);
  return null;
}

function MapClickClear({ onClear }: { onClear: () => void }) {
  useMapEvents({
    click: () => onClear(),
  });
  return null;
}

export default function MapaClient({ isDark }: Props) {
  const { items, loading, error } = useDenuncias(true);
  const [filtroCat, setFiltroCat] = useState<"ALL" | Denuncia["categoria"]>("ALL");
  const [layer, setLayer] = useState<MapBaseLayerId>(isDark ? "dark_matter" : "light");
  const [showEcopontos, setShowEcopontos] = useState(true);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

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

  const fotos =
    selected?.kind === "ocorrencia" ? denunciaFotoUrls(selected.denuncia) : [];

  const clearSelection = () => {
    setSelected(null);
    setViewerIndex(null);
  };

  return (
    <div className="relative h-full min-h-0 w-full flex-1 overflow-hidden">
      <div className="absolute left-14 top-3 z-[1000] flex max-w-[calc(100%-7rem)] flex-wrap gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)]/95 p-2 shadow-[var(--shadow-sm)] backdrop-blur-sm">
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
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              filtroCat === key
                ? "bg-rastro-600 text-white shadow-[var(--shadow-cta)]"
                : "bg-[var(--accent-soft)] text-[var(--foreground)] hover:opacity-90"
            }`}
          >
            {label}
          </button>
        ))}
        <span className="font-data self-center px-1 text-[11px] text-[var(--muted)]">
          {loading ? "…" : pontos.length}
        </span>
      </div>

      <MapLayerMenu
        layer={layer}
        onChange={setLayer}
        showEcopontos={showEcopontos}
        onToggleEcopontos={() => setShowEcopontos((v) => !v)}
      />

      {error && (
        <div className="absolute bottom-16 left-3 right-16 z-[1000] rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/80 dark:text-red-200">
          {error}
        </div>
      )}

      {selected ? (
        <aside className="absolute bottom-3 left-3 z-[1100] w-[min(100%-5.5rem,380px)] overflow-hidden rounded-2xl border border-[var(--border)] surface-card">
          <div className="flex items-start justify-between gap-2 border-b border-[var(--border)] px-3 py-2.5">
            {selected.kind === "ocorrencia" ? (
              <StatusBadge status={selected.denuncia.status} />
            ) : (
              <span className="inline-flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.16em] text-[#2563eb]">
                <span className="inline-block h-1.5 w-1.5 rotate-45 bg-[#2563eb]" />
                Ecoponto
              </span>
            )}
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-full p-1.5 text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
              aria-label="Fechar detalhe"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selected.kind === "ocorrencia" && fotos.length > 0 ? (
            <div className="flex gap-2 overflow-x-auto px-3 pt-3 scrollbar-none">
              {fotos.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setViewerIndex(i)}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-xl"
                  aria-label="Abrir foto"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="space-y-3 px-3 py-3">
            <h2 className="font-display text-base font-black text-[var(--verde-esc)]">
              {selected.kind === "ecoponto"
                ? `Ecoponto ${selected.eco.nome}`
                : categoriaLabel(selected.denuncia.categoria)}
            </h2>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
                  <MdiIcon path={mdiMapMarker} className="h-4 w-4" />
                </span>
                <span>
                  <span className="font-eyebrow block text-[var(--muted)]">Localização</span>
                  <span className="text-sm text-[var(--foreground)]">
                    {selected.kind === "ecoponto"
                      ? selected.eco.endereco || selected.eco.distrito
                      : selected.denuncia.endereco ||
                        selected.denuncia.municipio ||
                        "—"}
                  </span>
                </span>
              </li>
              {selected.kind === "ocorrencia" ? (
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
                    <MdiIcon path={mdiCalendar} className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="font-eyebrow block text-[var(--muted)]">Registrado em</span>
                    <span className="font-data text-sm text-[var(--foreground)]">
                      {formatDateTimeBr(selected.denuncia.createdAt)}
                    </span>
                  </span>
                </li>
              ) : (
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2563eb] text-white">
                    <MdiIcon path={mdiRecycle} className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="font-eyebrow block text-[var(--muted)]">Distrito</span>
                    <span className="text-sm text-[var(--foreground)]">
                      {selected.eco.distrito || "—"}
                    </span>
                  </span>
                </li>
              )}
              {selected.kind === "ocorrencia" ? (
                <li className="flex items-start gap-2.5">
                  <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-white">
                    <MdiIcon
                      path={CATEGORIA_MDI[selected.denuncia.categoria]}
                      className="h-4 w-4"
                    />
                  </span>
                  <span>
                    <span className="font-eyebrow block text-[var(--muted)]">Categoria</span>
                    <span className="text-sm text-[var(--foreground)]">
                      {categoriaLabel(selected.denuncia.categoria)}
                    </span>
                  </span>
                </li>
              ) : null}
            </ul>
          </div>
        </aside>
      ) : null}

      <ImageViewer
        images={fotos}
        index={viewerIndex ?? 0}
        open={viewerIndex != null}
        onClose={() => setViewerIndex(null)}
        onIndexChange={setViewerIndex}
      />

      <MapContainer
        center={center}
        zoom={8}
        className="h-full min-h-[560px] w-full"
        scrollWheelZoom
      >
        <IconFix />
        <InvalidateSize />
        <MapClickClear onClear={clearSelection} />
        <BaseTiles layer={layer} />
        <MarkerClusterGroup chunkedLoading>
          {pontos.map((d) => (
            <Marker
              key={d.id}
              position={[d.lat, d.lng]}
              icon={categoriaMapIcon(d.categoria)}
              eventHandlers={{
                click: (e) => {
                  e.originalEvent.stopPropagation();
                  setSelected({ kind: "ocorrencia", denuncia: d });
                  setViewerIndex(null);
                },
              }}
            />
          ))}
          {showEcopontos
            ? ECOPONTOS.map((e) => (
                <Marker
                  key={`eco-${e.id}`}
                  position={[e.lat, e.lng]}
                  icon={ecopontoMapIcon()}
                  eventHandlers={{
                    click: (ev) => {
                      ev.originalEvent.stopPropagation();
                      setSelected({ kind: "ecoponto", eco: e });
                      setViewerIndex(null);
                    },
                  }}
                />
              ))
            : null}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
