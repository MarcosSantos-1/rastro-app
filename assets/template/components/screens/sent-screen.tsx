'use client'

import Image from 'next/image'
import { Copy, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBar } from '@/components/phone-frame'

export function SentScreen({
  onNewReport,
  onHome,
}: {
  onNewReport: () => void
  onHome: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-accent/40">
      <StatusBar />

      <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
        <div className="relative aspect-square w-full max-w-[240px]">
          <Image
            src="/onboarding/success.png"
            alt="Mascote comemorando o envio da ocorrência"
            fill
            className="object-contain"
            priority
          />
        </div>

        <h1 className="mt-2 text-balance text-2xl font-extrabold text-foreground">
          Ocorrência enviada!
        </h1>
        <p className="mt-2 max-w-[300px] text-pretty text-sm leading-relaxed text-muted-foreground">
          Recebemos seu registro e encaminhamos para o órgão responsável.
          Obrigado por cuidar da sua cidade!
        </p>

        {/* Protocol */}
        <div className="mt-6 flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="text-left">
            <p className="text-xs text-muted-foreground">Protocolo</p>
            <p className="text-base font-extrabold text-foreground">
              #RST-2026-08421
            </p>
          </div>
          <button className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <Copy className="size-4 text-primary" />
          </button>
        </div>

        <div className="mt-3 flex w-full items-center gap-2 rounded-2xl bg-primary/10 p-3 text-left">
          <MapPin className="size-4 shrink-0 text-primary" />
          <p className="text-xs font-medium text-primary">
            Acompanhe o status pelo seu histórico de registros.
          </p>
        </div>
      </div>

      <div className="space-y-3 px-7 pb-8">
        <Button
          onClick={onNewReport}
          className="h-14 w-full rounded-full text-base font-bold"
          size="lg"
        >
          Registrar outra ocorrência
        </Button>
        <button
          onClick={onHome}
          className="h-12 w-full rounded-full text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          Voltar ao mapa
        </button>
      </div>
    </div>
  )
}
