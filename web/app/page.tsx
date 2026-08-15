"use client";

import { useAuthWeb } from "@/lib/contexts/AuthWebContext";
import { AppShell } from "./components/AppShell";
import { DashboardHome } from "./components/DashboardHome";
import { BrandMark } from "./components/BrandMark";
import { InteractiveHoverButton } from "./components/ui/interactive-hover-button";
import { LoginSkeleton } from "./components/ui/skeleton";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const { ready, profile, signInWithNome } = useAuthWeb();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = nome.trim();
    if (n.length < 2) return;
    setBusy(true);
    try {
      await signInWithNome(n);
      router.push("/");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) {
    return <LoginSkeleton />;
  }

  if (profile?.nome) {
    return (
      <>
        <AppShell>
          <DashboardHome />
        </AppShell>
        <p
          className="pointer-events-none fixed bottom-3 right-3 z-50 font-data text-[11px] text-[var(--muted)] select-none"
          aria-hidden
        >
          1.0.0
        </p>
      </>
    );
  }

  return (
    <>
      <AppShell>
        <div className="mx-auto max-w-md space-y-6">
          <div className="space-y-3">
            <BrandMark priority />
            <p className="text-sm text-[var(--muted)]">
              Painel de denúncias ambientais
            </p>
          </div>
          <form
            onSubmit={submit}
            className="space-y-4 rounded-2xl border border-[var(--border)] surface-card p-6"
          >
            <label className="block text-sm font-medium text-[var(--foreground)]">
              Nome do operador
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-[var(--foreground)] outline-none focus:border-rastro-500 focus:ring-2 focus:ring-rastro-500/20"
                placeholder="Nome completo"
                autoComplete="name"
              />
            </label>
            <InteractiveHoverButton
              type="submit"
              disabled={busy}
              className="w-full disabled:opacity-60"
            >
              {busy ? "Entrando…" : "Entrar"}
            </InteractiveHoverButton>
          </form>
        </div>
      </AppShell>
      <p
        className="pointer-events-none fixed bottom-3 right-3 z-50 font-data text-[11px] text-[var(--muted)] select-none"
        aria-hidden
      >
        1.0.0
      </p>
    </>
  );
}
