"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthWeb } from "@/lib/contexts/AuthWebContext";
import { useTheme } from "@/lib/contexts/ThemeContext";

function IconHome({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function IconOcorrencias({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}

function IconMapa({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
      />
    </svg>
  );
}

function IconRelatorios({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 17v-2m3 2v-4m3 4V9m3 8V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2z"
      />
    </svg>
  );
}

const LINKS = [
  { href: "/", label: "Início", Icon: IconHome },
  { href: "/painel", label: "Ocorrências", Icon: IconOcorrencias },
  { href: "/mapa", label: "Mapa", Icon: IconMapa },
  { href: "/relatorios", label: "Relatórios", Icon: IconRelatorios },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const { isDark, toggleTheme } = useTheme();
  const { profile } = useAuthWeb();
  const authed = !!profile?.nome;
  const showNav = authed;

  return (
    <header className="w-full border-b border-zinc-200 bg-white dark:border-white/10 dark:bg-zinc-900">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-2xl font-bold tracking-tight text-green-500 sm:text-3xl dark:text-green-400"
        >
          <span>Portal Rastro</span>
        </Link>
        <ul className="flex items-center gap-2 text-sm font-semibold sm:gap-4">
          {showNav &&
            LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 sm:gap-2 ${
                    pathname === l.href
                      ? "text-green-600 dark:text-green-300"
                      : "text-zinc-700 dark:text-zinc-200"
                  }`}
                >
                  <l.Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                  <span>{l.label}</span>
                </Link>
              </li>
            ))}
          <li>
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg px-2.5 py-1.5 text-lg leading-none text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              title={isDark ? "Usar tema claro" : "Usar tema escuro"}
              aria-label={isDark ? "Usar tema claro" : "Usar tema escuro"}
            >
              <span aria-hidden>{isDark ? "☀️" : "🌙"}</span>
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
