"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuthWeb } from "@/lib/contexts/AuthWebContext";
import { ThemeToggler } from "./ui/theme-toggler";
import { cn } from "@/lib/utils";
import { ClipboardList, FileBarChart2, Home, Map } from "lucide-react";

const LINKS = [
  { href: "/", label: "Início", Icon: Home },
  { href: "/painel", label: "Ocorrências", Icon: ClipboardList },
  { href: "/mapa", label: "Mapa", Icon: Map },
  { href: "/relatorios", label: "Relatórios", Icon: FileBarChart2 },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { profile } = useAuthWeb();
  const showNav = !!profile?.nome;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--surface)_82%,transparent)] backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2">
          <Image
            src="/rastro-logo.png"
            alt="Rastro"
            width={48}
            height={48}
            className="h-11 w-11 rounded-xl object-contain sm:h-12 sm:w-12"
            priority
          />
          <span className="font-display text-2xl font-bold tracking-tight text-green-500 sm:text-3xl dark:text-green-400">
            Portal Rastro
          </span>
        </Link>
        <ul className="flex items-center gap-1 text-sm font-semibold sm:gap-2">
          {showNav &&
            LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className={cn(
                      "flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 transition-colors sm:gap-2",
                      active
                        ? "bg-[var(--accent-soft)] text-rastro-700 dark:text-rastro-300"
                        : "text-[var(--muted)] hover:bg-[var(--accent-soft)]/60 hover:text-[var(--foreground)]",
                    )}
                  >
                    <l.Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    <span className="hidden sm:inline">{l.label}</span>
                  </Link>
                </li>
              );
            })}
          <li>
            <ThemeToggler />
          </li>
        </ul>
      </nav>
    </header>
  );
}
