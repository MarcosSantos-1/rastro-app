"use client";

import {
  isStatusEmAnalise,
  statusBadgeClass,
  statusLabel,
  type DenunciaStatus,
} from "@/lib/denuncias";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function StatusBadge({
  status,
  className,
}: {
  status: DenunciaStatus;
  className?: string;
}) {
  const analyzing = isStatusEmAnalise(status);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        statusBadgeClass(status),
        className,
      )}
    >
      {analyzing ? (
        <Loader2 className="h-3 w-3 shrink-0 animate-spin" aria-hidden />
      ) : null}
      {statusLabel(status)}
    </span>
  );
}
