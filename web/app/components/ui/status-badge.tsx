"use client";

import {
  isStatusEmAnalise,
  statusBadgeClass,
  statusLabel,
  statusMarkClass,
  type DenunciaStatus,
} from "@/lib/denuncias";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: DenunciaStatus;
  className?: string;
}) {
  const analyzing = isStatusEmAnalise(status);
  const discarded = status === "descartada";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-data text-[10px] uppercase tracking-[0.16em]",
        statusBadgeClass(status),
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "inline-block h-1.5 w-1.5 rotate-45",
          discarded
            ? "border border-current bg-transparent"
            : statusMarkClass(status),
          analyzing && "animate-pulse",
        )}
      />
      {statusLabel(status)}
    </span>
  );
}
