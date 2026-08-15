"use client";

import { cn } from "@/lib/utils";

const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/></filter><rect width='140' height='140' filter='url(%23n)' opacity='.045'/></svg>\")";

export function GridBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div
        className="absolute inset-0 dark:hidden"
        style={{
          background: "linear-gradient(178deg, #fbfcfb 0%, #eff4f1 46%, #e2ebe5 100%)",
        }}
      />
      <div
        className="absolute inset-0 hidden dark:block"
        style={{
          background: "linear-gradient(178deg, #0b1a12 0%, #07130d 55%, #04100a 100%)",
        }}
      />
      <div
        className="absolute inset-[-20%] dark:hidden"
        style={{
          background: `
            repeating-linear-gradient(58deg, transparent 0 34px, rgba(18,58,38,.055) 34px 35px),
            repeating-linear-gradient(58deg, transparent 0 138px, rgba(18,58,38,.085) 138px 140px),
            repeating-linear-gradient(148deg, transparent 0 42px, rgba(18,58,38,.045) 42px 43px),
            repeating-linear-gradient(148deg, transparent 0 176px, rgba(18,58,38,.075) 176px 178px)
          `,
          maskImage: "radial-gradient(ellipse 90% 60% at 50% 0%, #000 10%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 60% at 50% 0%, #000 10%, transparent 78%)",
        }}
      />
      <div
        className="absolute inset-[-20%] hidden dark:block"
        style={{
          background: `
            repeating-linear-gradient(58deg, transparent 0 34px, rgba(63,191,124,.07) 34px 35px),
            repeating-linear-gradient(58deg, transparent 0 138px, rgba(63,191,124,.11) 138px 140px),
            repeating-linear-gradient(148deg, transparent 0 42px, rgba(63,191,124,.06) 42px 43px),
            repeating-linear-gradient(148deg, transparent 0 176px, rgba(63,191,124,.10) 176px 178px)
          `,
          maskImage: "radial-gradient(ellipse 90% 60% at 50% 0%, #000 10%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 90% 60% at 50% 0%, #000 10%, transparent 78%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-55"
        style={{ backgroundImage: GRAIN }}
      />
    </div>
  );
}
