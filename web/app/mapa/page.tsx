"use client";

import { useAuthWeb } from "@/lib/contexts/AuthWebContext";
import { useTheme } from "@/lib/contexts/ThemeContext";
import { MapSkeleton, PageAuthSkeleton } from "../components/ui/skeleton";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const MapaClient = dynamic(() => import("./MapaClient"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

export default function MapaPage() {
  const { ready, profile } = useAuthWeb();
  const { isDark } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (ready && !profile?.nome) router.replace("/");
  }, [ready, profile?.nome, router]);

  if (!ready || !profile?.nome) {
    return <PageAuthSkeleton />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <header className="shrink-0">
        <h1 className="font-display text-lg font-bold tracking-tight sm:text-xl">
          Mapa de ocorrências
        </h1>
        <p className="text-xs text-[var(--muted)] sm:text-sm">
          Densidade geográfica das denúncias (Firestore).
        </p>
      </header>
      <div className="relative min-h-[560px] flex-1 overflow-hidden rounded-2xl border border-[var(--border)]">
        <MapaClient isDark={isDark} />
      </div>
    </div>
  );
}
