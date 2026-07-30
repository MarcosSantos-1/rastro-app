"use client";

import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

export function GooeySearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative max-w-xl", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-[2px] rounded-2xl opacity-70 blur-[1px]"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--accent) 35%, transparent), transparent 45%, color-mix(in oklab, var(--accent-muted) 25%, transparent))",
        }}
      />
      <div className="relative flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-elevated)] px-3 shadow-sm backdrop-blur-sm transition-shadow focus-within:border-rastro-500 focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--accent)_16%,transparent)]">
        <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-11 w-full bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
        />
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded-lg p-1 text-[var(--muted)] hover:bg-[var(--accent-soft)] hover:text-[var(--foreground)]"
            aria-label="Limpar busca"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
