'use client'

import { useState } from 'react'
import { PhoneFrame } from '@/components/phone-frame'
import { OnboardingScreen } from '@/components/screens/onboarding-screen'
import { MapHomeScreen } from '@/components/screens/map-home-screen'
import { NewReportScreen } from '@/components/screens/new-report-screen'
import { SentScreen } from '@/components/screens/sent-screen'

type Screen = 'onboarding' | 'home' | 'new' | 'sent'

const flow: { id: Screen; label: string }[] = [
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'home', label: 'Mapa' },
  { id: 'new', label: 'Novo registro' },
  { id: 'sent', label: 'Enviado' },
]

export default function Page() {
  const [screen, setScreen] = useState<Screen>('onboarding')

  return (
    <main className="min-h-screen bg-gradient-to-b from-accent/40 to-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 px-4 py-10">
        <header className="text-center">
          <h1 className="text-balance text-3xl font-extrabold text-foreground">
            Protótipo Rastro
          </h1>
          <p className="mt-1 text-pretty text-sm text-muted-foreground">
            Navegue pelo fluxo do munícipe. Use os botões do app ou pule entre
            as telas abaixo.
          </p>
        </header>

        {/* Screen switcher */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {flow.map((s) => (
            <button
              key={s.id}
              onClick={() => setScreen(s.id)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                screen === s.id
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                  : 'bg-card text-muted-foreground shadow-sm hover:text-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <PhoneFrame>
          {screen === 'onboarding' && (
            <OnboardingScreen onFinish={() => setScreen('home')} />
          )}
          {screen === 'home' && (
            <MapHomeScreen onNewReport={() => setScreen('new')} />
          )}
          {screen === 'new' && (
            <NewReportScreen
              onBack={() => setScreen('home')}
              onSubmit={() => setScreen('sent')}
            />
          )}
          {screen === 'sent' && (
            <SentScreen
              onNewReport={() => setScreen('new')}
              onHome={() => setScreen('home')}
            />
          )}
        </PhoneFrame>
      </div>
    </main>
  )
}
