import type { ReactNode } from 'react'

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative mx-auto w-[390px] max-w-full">
      <div className="relative aspect-[390/844] w-full overflow-hidden rounded-[3rem] border-[10px] border-foreground/90 bg-card shadow-2xl">
        {/* Notch */}
        <div className="absolute left-1/2 top-0 z-30 h-7 w-40 -translate-x-1/2 rounded-b-2xl bg-foreground/90" />
        {/* Screen */}
        <div className="absolute inset-0 overflow-hidden">{children}</div>
      </div>
    </div>
  )
}

export function StatusBar({ dark = false }: { dark?: boolean }) {
  const color = dark ? 'text-primary-foreground' : 'text-foreground'
  return (
    <div
      className={`flex items-center justify-between px-7 pt-3 text-[13px] font-bold ${color}`}
    >
      <span>9:41</span>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px]">●●●</span>
        <span className="text-[11px]">Wi-Fi</span>
        <span className="text-[11px]">100%</span>
      </div>
    </div>
  )
}
