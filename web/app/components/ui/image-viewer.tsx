"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

function filenameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    const last = path.split("/").pop();
    if (last) return decodeURIComponent(last.split("?")[0]) || "rastro-foto.jpg";
  } catch {
    /* ignore */
  }
  return "rastro-foto.jpg";
}

async function downloadImage(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("fetch failed");
    const blob = await res.blob();
    const obj = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = obj;
    a.download = filenameFromUrl(url);
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(obj);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

export function ImageViewer({
  images,
  index,
  open,
  onClose,
  onIndexChange,
}: {
  images: string[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (next: number) => void;
}) {
  const [busy, setBusy] = useState(false);
  const src = images[index];
  const hasMany = images.length > 1;

  const go = useCallback(
    (delta: number) => {
      if (!hasMany) return;
      const next = (index + delta + images.length) % images.length;
      onIndexChange(next);
    },
    [hasMany, images.length, index, onIndexChange],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopPropagation();
        go(-1);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        e.stopPropagation();
        go(1);
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [open, onClose, go]);

  const onDownload = async () => {
    if (!src) return;
    setBusy(true);
    try {
      await downloadImage(src);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && src ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Fechar visualizador"
            className="absolute inset-0 bg-[rgba(4,16,10,0.92)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Visualizador de foto"
            className="rastro-viewer-motion relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col items-center"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex w-full items-center justify-end gap-2">
              <button
                type="button"
                onClick={onDownload}
                disabled={busy}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/18 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Baixar
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md hover:bg-white/18"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="relative flex w-full items-center justify-center">
              {hasMany ? (
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="absolute left-1 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md hover:bg-white/18 sm:left-0"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`Foto ${index + 1} de ${images.length}`}
                className="max-h-[80vh] max-w-full rounded-xl object-contain shadow-[var(--shadow-card)]"
              />
              {hasMany ? (
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="absolute right-1 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur-md hover:bg-white/18 sm:right-0"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : null}
            </div>
            {hasMany ? (
              <p className="mt-3 font-data text-xs text-white/70">
                {index + 1} / {images.length}
              </p>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
