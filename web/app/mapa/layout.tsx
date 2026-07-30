import { Navbar } from "../components/Navbar";
import { GridBackground } from "../components/ui/grid-background";

/** Shell em altura de viewport: mapa preenche o restante sem scroll na página. */
export default function MapaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden text-[var(--foreground)]">
      <GridBackground />
      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <Navbar />
        <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col overflow-hidden px-3 py-2 sm:px-4">
          {children}
        </main>
      </div>
    </div>
  );
}
