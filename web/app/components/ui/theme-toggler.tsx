"use client";

import { useTheme } from "@/lib/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { MdiIcon, mdiMoonWaningCrescent, mdiWhiteBalanceSunny } from "./mdi-icon";
import { motion } from "framer-motion";

export function ThemeToggler({ className }: { className?: string }) {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--accent-soft)]",
        className,
      )}
      title={isDark ? "Usar tema claro" : "Usar tema escuro"}
      aria-label={isDark ? "Usar tema claro" : "Usar tema escuro"}
    >
      <motion.span
        key={isDark ? "sun" : "moon"}
        initial={{ y: 12, opacity: 0, rotate: -30 }}
        animate={{ y: 0, opacity: 1, rotate: 0 }}
        exit={{ y: -12, opacity: 0, rotate: 30 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        {isDark ? (
          <MdiIcon path={mdiWhiteBalanceSunny} className="h-4 w-4 text-amber-400" />
        ) : (
          <MdiIcon path={mdiMoonWaningCrescent} className="h-4 w-4 text-rastro-600" />
        )}
      </motion.span>
    </button>
  );
}
