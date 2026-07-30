"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "./skeleton";
import { useState } from "react";

export function ImagePixelLoader({
  src,
  alt,
  className,
  loadingLabel = "Carregando imagens…",
}: {
  src: string;
  alt: string;
  className?: string;
  loadingLabel?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative min-h-40 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/40",
        className,
      )}
    >
      {!loaded && !failed && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 p-3">
          <Skeleton className="absolute inset-0 rounded-none" />
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                linear-gradient(45deg, var(--border) 25%, transparent 25%),
                linear-gradient(-45deg, var(--border) 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, var(--border) 75%),
                linear-gradient(-45deg, transparent 75%, var(--border) 75%)
              `,
              backgroundSize: "12px 12px",
              animation: "pixel-drift 1.2s steps(4) infinite",
            }}
          />
          <p className="relative z-10 rounded-lg bg-[var(--surface-elevated)]/80 px-2.5 py-1 text-xs font-medium text-[var(--muted)] backdrop-blur-sm">
            {loadingLabel}
          </p>
        </div>
      )}
      {failed ? (
        <div className="flex h-40 items-center justify-center text-xs text-[var(--muted)]">
          Não foi possível carregar a imagem
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "max-h-56 w-full object-cover transition-all duration-500",
            loaded ? "scale-100 opacity-100 blur-0" : "h-40 scale-[1.02] opacity-0 blur-sm",
          )}
        />
      )}
    </div>
  );
}
