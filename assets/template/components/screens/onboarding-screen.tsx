'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { StatusBar } from '@/components/phone-frame'

type Slide = {
  image: string
  alt: string
  title: string
  description: string
}

const slides: Slide[] = [
  {
    image: '/onboarding/welcome.png',
    alt: 'Mascote do Rastro acenando em boas-vindas',
    title: 'Bem-vindo ao Rastro',
    description:
      'O jeito mais simples de cuidar da sua cidade. Juntos deixamos as ruas mais limpas.',
  },
  {
    image: '/onboarding/photo.png',
    alt: 'Mascote fotografando um descarte irregular de lixo',
    title: 'Registre em segundos',
    description:
      'Encontrou lixo descartado no lugar errado? Tire uma foto e pronto: o registro começa aí.',
  },
  {
    image: '/onboarding/location.png',
    alt: 'Mascote apontando para um mapa com marcador de localização',
    title: 'Localização automática',
    description:
      'Capturamos o ponto exato por GPS para que a prefeitura saiba onde agir com precisão.',
  },
  {
    image: '/onboarding/ai.png',
    alt: 'Mascote analisando uma foto com lupa e inteligência artificial',
    title: 'Inteligência que ajuda',
    description:
      'Nossa IA identifica o tipo de resíduo e protege sua privacidade borrando rostos e placas.',
  },
  {
    image: '/onboarding/impact.png',
    alt: 'Mascote comemorando em uma rua limpa e arborizada',
    title: 'Sua cidade agradece',
    description:
      'Cada registro vira dado para decisões públicas melhores. Comece agora a fazer a diferença.',
  },
]

export function OnboardingScreen({ onFinish }: { onFinish: () => void }) {
  const [index, setIndex] = useState(0)
  const isLast = index === slides.length - 1
  const slide = slides[index]

  const next = () => (isLast ? onFinish() : setIndex((i) => i + 1))

  return (
    <div className="flex h-full flex-col bg-accent/40">
      <StatusBar />

      <div className="flex items-center justify-between px-6 pt-2">
        <div className="flex items-center gap-2">
          <Image
            src="/rastro-logo.png"
            alt="Logo do Rastro"
            width={28}
            height={28}
            className="rounded-md"
          />
          <span className="text-lg font-extrabold text-primary">Rastro</span>
        </div>
        <button
          onClick={onFinish}
          className="text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Pular
        </button>
      </div>

      {/* Illustration */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="relative aspect-square w-full max-w-[300px]">
          <Image
            src={slide.image || '/placeholder.svg'}
            alt={slide.alt}
            fill
            className="object-contain drop-shadow-sm"
            priority
          />
        </div>
      </div>

      {/* Card */}
      <div className="rounded-t-[2.5rem] bg-card px-7 pb-8 pt-7 shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <div className="mb-5 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-primary' : 'w-2 bg-primary/25'
              }`}
            />
          ))}
        </div>

        <h1 className="text-balance text-center text-2xl font-extrabold text-foreground">
          {slide.title}
        </h1>
        <p className="mx-auto mt-2 max-w-[300px] text-pretty text-center text-sm leading-relaxed text-muted-foreground">
          {slide.description}
        </p>

        <Button
          onClick={next}
          className="mt-6 h-14 w-full rounded-full text-base font-bold"
          size="lg"
        >
          {isLast ? 'Começar agora' : 'Próximo'}
        </Button>
      </div>
    </div>
  )
}
