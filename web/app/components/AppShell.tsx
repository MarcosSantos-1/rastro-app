"use client";

import { Navbar } from "./Navbar";
import { GridBackground } from "./ui/grid-background";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col text-[var(--foreground)]">
      <GridBackground />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
