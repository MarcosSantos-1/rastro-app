'use client'

import Image from 'next/image'
import { Plus, MapPin, Layers, Locate, User, Bell, Menu } from 'lucide-react'
import { StatusBar } from '@/components/phone-frame'

type Pin = {
  top: string
  left: string
  status: 'novo' | 'andamento' | 'resolvido'
}

const pins: Pin[] = [
  { top: '28%', left: '30%', status: 'novo' },
  { top: '42%', left: '62%', status: 'andamento' },
  { top: '58%', left: '38%', status: 'resolvido' },
  { top: '35%', left: '78%', status: 'novo' },
]

const statusColor: Record<Pin['status'], string> = {
  novo: 'bg-destructive',
  andamento: 'bg-chart-3',
  resolvido: 'bg-primary',
}

export function MapHomeScreen({ onNewReport }: { onNewReport: () => void }) {
  return (
    <div className="relative h-full bg-accent/30">
      {/* Map background */}
      <Image
        src="/map-bg.png"
        alt="Mapa da cidade com as ocorrências registradas"
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0 bg-foreground/5" />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 z-20">
        <StatusBar />
        <div className="flex items-center justify-between px-5 pt-2">
          <button className="flex size-11 items-center justify-center rounded-full bg-card shadow-md">
            <Menu className="size-5 text-foreground" />
          </button>
          <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 shadow-md">
            <Image
              src="/rastro-logo.png"
              alt="Logo do Rastro"
              width={22}
              height={22}
              className="rounded"
            />
            <span className="text-base font-extrabold text-primary">
              Rastro
            </span>
          </div>
          <button className="relative flex size-11 items-center justify-center rounded-full bg-card shadow-md">
            <Bell className="size-5 text-foreground" />
            <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-destructive" />
          </button>
        </div>
      </div>

      {/* Pins */}
      {pins.map((pin, i) => (
        <div
          key={i}
          className="absolute z-10 -translate-x-1/2 -translate-y-full"
          style={{ top: pin.top, left: pin.left }}
        >
          <div className="flex flex-col items-center">
            <div
              className={`flex size-9 items-center justify-center rounded-full border-2 border-card shadow-lg ${statusColor[pin.status]}`}
            >
              <MapPin className="size-4 text-primary-foreground" />
            </div>
            <div
              className={`-mt-1 size-2 rotate-45 ${statusColor[pin.status]}`}
            />
          </div>
        </div>
      ))}

      {/* Side controls */}
      <div className="absolute right-5 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
        <button className="flex size-11 items-center justify-center rounded-full bg-card shadow-md">
          <Layers className="size-5 text-foreground" />
        </button>
        <button className="flex size-11 items-center justify-center rounded-full bg-card shadow-md">
          <Locate className="size-5 text-primary" />
        </button>
      </div>

      {/* Bottom sheet */}
      <div className="absolute inset-x-0 bottom-0 z-20 rounded-t-[2rem] bg-card px-5 pb-6 pt-4 shadow-[0_-8px_30px_rgba(0,0,0,0.1)]">
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />

        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Ocorrências por perto</p>
            <p className="text-lg font-extrabold text-foreground">
              12 registros ativos
            </p>
          </div>
          <div className="flex flex-col items-end gap-1 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full bg-destructive" /> Novo
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full bg-chart-3" /> Em andamento
            </span>
          </div>
        </div>

        <button
          onClick={onNewReport}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-base font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-[0.98]"
        >
          <Plus className="size-5" />
          Novo registro
        </button>

        {/* Fake tab bar */}
        <div className="mt-5 flex items-center justify-around border-t border-border pt-3 text-muted-foreground">
          <div className="flex flex-col items-center gap-0.5 text-primary">
            <MapPin className="size-5" />
            <span className="text-[11px] font-bold">Mapa</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Layers className="size-5" />
            <span className="text-[11px] font-semibold">Meus registros</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <User className="size-5" />
            <span className="text-[11px] font-semibold">Perfil</span>
          </div>
        </div>
      </div>
    </div>
  )
}
