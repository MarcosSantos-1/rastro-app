"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type CommonProps = {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
};

type AsButton = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined;
  };

type AsLink = CommonProps & {
  href: string;
};

export function InteractiveHoverButton(props: AsButton | AsLink) {
  const { children, className, variant = "primary" } = props;

  const styles = cn(
    "group relative inline-flex h-11 items-center justify-center overflow-hidden rounded-xl px-5 text-sm font-semibold transition-all duration-300",
    variant === "primary" &&
      "bg-rastro-600 text-white shadow-sm hover:bg-rastro-700 dark:bg-rastro-500 dark:hover:bg-rastro-400 dark:text-zinc-950",
    variant === "secondary" &&
      "border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] hover:bg-[var(--accent-soft)]",
    variant === "danger" &&
      "bg-red-600/90 text-white hover:bg-red-600",
    className,
  );

  const inner = (
    <>
      <span className="inline-flex items-center gap-2 transition-all duration-300 group-hover:translate-x-[-0.5rem] group-hover:opacity-0">
        {children}
      </span>
      <span className="absolute inset-0 z-10 flex items-center justify-center gap-1.5 translate-x-4 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
        {children}
        <ArrowRight className="h-4 w-4" />
      </span>
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-0 scale-x-0 transition-transform duration-300 group-hover:scale-x-100 origin-left",
          variant === "primary" && "bg-rastro-700/40 dark:bg-rastro-600/30",
          variant === "secondary" && "bg-[var(--accent-soft)]",
          variant === "danger" && "bg-red-700/40",
        )}
      />
    </>
  );

  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={styles}>
        {inner}
      </Link>
    );
  }

  const { href: _h, type = "button", ...buttonProps } = props as AsButton;
  return (
    <button type={type} {...buttonProps} className={styles}>
      {inner}
    </button>
  );
}
