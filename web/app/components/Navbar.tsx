"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthWeb } from "@/lib/contexts/AuthWebContext";
import { BrandMark } from "./BrandMark";
import { ThemeToggler } from "./ui/theme-toggler";
import {
  MdiIcon,
  mdiClipboardText,
  mdiFileChart,
  mdiHome,
  mdiMap,
} from "./ui/mdi-icon";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Início", icon: mdiHome },
  { href: "/painel", label: "Ocorrências", icon: mdiClipboardText },
  { href: "/mapa", label: "Mapa", icon: mdiMap },
  { href: "/relatorios", label: "Relatórios", icon: mdiFileChart },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { profile } = useAuthWeb();
  const showNav = !!profile?.nome;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border)] bg-[color-mix(in_oklab,var(--background)_72%,transparent)] backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="group flex items-center gap-2.5">
          <BrandMark priority />
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
                      "flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors sm:gap-2",
                      active
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "text-[var(--muted)] hover:bg-[var(--accent-soft)]/60 hover:text-[var(--foreground)]",
                    )}
                  >
                    <MdiIcon path={l.icon} className="h-4 w-4 opacity-90" />
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
