'use client'

import { useState } from 'react'
import {
  ArrowLeft,
  Camera,
  MapPin,
  Check,
  Sparkles,
  Trash2,
  Sofa,
  Leaf,
  HardHat,
  CircleHelp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StatusBar } from '@/components/phone-frame'

const categories = [
  { id: 'domestico', label: 'Lixo doméstico', icon: Trash2 },
  { id: 'moveis', label: 'Móveis / volumosos', icon: Sofa },
  { id: 'entulho', label: 'Entulho / obra', icon: HardHat },
  { id: 'verde', label: 'Resíduo verde', icon: Leaf },
  { id: 'outro', label: 'Outro', icon: CircleHelp },
]

export function NewReportScreen({
  onBack,
  onSubmit,
}: {
  onBack: () => void
  onSubmit: () => void
}) {
  const [hasPhoto, setHasPhoto] = useState(false)
  const [category, setCategory] = useState<string | null>(null)
  const [description, setDescription] = useState('')

  return (
    <div className="flex h-full flex-col bg-card">
      <StatusBar />

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3">
        <button
          onClick={onBack}
          className="flex size-10 items-center justify-center rounded-full bg-accent/60"
        >
          <ArrowLeft className="size-5 text-foreground" />
        </button>
        <h1 className="text-lg font-extrabold text-foreground">
          Nova ocorrência
        </h1>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 pb-4">
        {/* Photo */}
        <button
          onClick={() => setHasPhoto((v) => !v)}
          className={`flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed transition-colors ${
            hasPhoto
              ? 'border-primary bg-primary/5'
              : 'border-border bg-accent/40'
          }`}
        >
          {hasPhoto ? (
            <>
              <div className="flex size-14 items-center justify-center rounded-full bg-primary">
                <Check className="size-7 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-primary">
                Foto adicionada
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3" /> IA analisando o resíduo…
              </span>
            </>
          ) : (
            <>
              <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                <Camera className="size-7 text-primary" />
              </div>
              <span className="text-sm font-bold text-foreground">
                Tirar foto do descarte
              </span>
              <span className="text-xs text-muted-foreground">
                Toque para abrir a câmera
              </span>
            </>
          )}
        </button>

        {/* Location */}
        <div className="flex items-center gap-3 rounded-2xl bg-accent/40 p-4">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="size-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-foreground">
              Localização capturada
            </p>
            <p className="text-xs text-muted-foreground">
              Rua das Palmeiras, 240 — Centro
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
            GPS
          </span>
        </div>

        {/* Category */}
        <div>
          <p className="mb-2 text-sm font-bold text-foreground">
            Tipo de resíduo
          </p>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const Icon = cat.icon
              const active = category === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Description */}
        <div>
          <p className="mb-2 text-sm font-bold text-foreground">
            Descrição{' '}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Ex.: sacos de lixo acumulados na calçada há alguns dias."
            className="w-full resize-none rounded-2xl border border-border bg-accent/30 p-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="border-t border-border bg-card px-5 pb-8 pt-4">
        <Button
          onClick={onSubmit}
          disabled={!hasPhoto}
          className="h-14 w-full rounded-full text-base font-bold disabled:opacity-40"
          size="lg"
        >
          Enviar ocorrência
        </Button>
        {!hasPhoto && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Adicione uma foto para enviar o registro
          </p>
        )}
      </div>
    </div>
  )
}
