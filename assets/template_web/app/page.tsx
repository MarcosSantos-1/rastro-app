"use client";

import Link from "next/link";

const operationalFlow = [
  "Cadastro e autenticação do colaborador por ecoponto, localização ou credencial.",
  "Registro de entrada com dados do munícipe, material e estimativa padronizada.",
  "Classificação automática por tipo de caçamba para separar madeira, entulho, gesso e recicláveis.",
  "Registro de saída com foto do veículo, placa e capacidade para auditoria.",
  "Cálculo do saldo estimado em m3 por ecoponto, mesmo quando a retirada ocorre em outro dia.",
];

const materialGuides = [
  { name: "Entulho", unit: "Saco / m3", destination: "Caçamba de entulho" },
  { name: "Madeira e mobília", unit: "Volume / m3", destination: "Caçamba de madeira" },
  { name: "Gesso", unit: "Saco / m3", destination: "Caçamba de gesso" },
  { name: "Recicláveis (PEV)", unit: "Saco / kg", destination: "Baia PEV" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-700 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        <header className="mb-8 lg:mb-12">
        

          <div className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80 lg:p-10">
            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 shadow-lg">
              <span className="text-2xl">♻️</span>
            </div>
            <h1 className="mb-3 text-3xl font-bold text-zinc-900 dark:text-zinc-100 lg:text-5xl">
              Plataforma de Gestão de Ecopontos
            </h1>
            <p className="max-w-3xl text-zinc-600 dark:text-zinc-300 lg:text-lg">
              Registro padronizado de entrada e saída de materiais com controle de saldo, fotos
              para auditoria e relatórios por data, local e tipo de resíduo.
            </p>

            <div className="mt-7">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-colors hover:bg-indigo-700"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Entrar
              </Link>
            </div>
          </div>
        </header>

        <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FeatureCard title="Portal Web" icon="📊" description="Relatórios e planilhas por ecoponto, período, material e peso estimado." />
          <FeatureCard title="App Mobile" icon="📱" description="Coleta rápida no pátio, com padronização de unidades e classificação." />
          <FeatureCard title="Auditoria Visual" icon="📸" description="Fotos do material e do veículo para validar entrada e retirada." />
          <FeatureCard title="Saldo em m3" icon="🧮" description="Controle contínuo do volume acumulado por ecoponto e por caçamba." />
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Fluxo operacional</h2>
            <ol className="space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
              {operationalFlow.map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </article>

          <article className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">Padronização de materiais</h2>
            <div className="space-y-3">
              {materialGuides.map((guide) => (
                <div
                  key={guide.name}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-600 dark:bg-zinc-700"
                >
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{guide.name}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Unidade base: {guide.unit}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">Destino: {guide.destination}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80 xl:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              Próxima etapa: modelo de dados inicial
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700/70">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Coleções Firebase</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  `ecopontos`, `colaboradores`, `entradas`, `saidas`, `veiculos`, `auditoriaFotos`.
                </p>
              </div>
              <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700/70">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Filtros de relatório</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  Data inicial/final, ecoponto, tipo de material, faixa de volume/peso e status.
                </p>
              </div>
              <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700/70">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Métricas-chave</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  Entrada total m3, saída total m3, saldo estimado e divergência por período.
                </p>
              </div>
              <div className="rounded-lg bg-zinc-100 p-4 dark:bg-zinc-700/70">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Evidências</p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
                  Foto da carga, placa do veículo e observação do colaborador por operação.
                </p>
              </div>
            </div>
          </article>

          <article className="rounded-2xl border border-indigo-200/70 bg-indigo-50/90 p-6 shadow-xl dark:border-indigo-800/70 dark:bg-indigo-950/40">
            <h2 className="mb-4 text-xl font-semibold text-indigo-900 dark:text-indigo-200">Roadmap rápido</h2>
            <ul className="space-y-3 text-sm text-indigo-900/90 dark:text-indigo-200/90">
              <li>Semana 1: autenticação de colaborador e cadastro de ecopontos.</li>
              <li>Semana 2: registro de entradas com conversão para m3.</li>
              <li>Semana 3: registro de saídas com foto/placa e saldo diário.</li>
              <li>Semana 4: relatórios e exportação CSV/XLSX no portal web.</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  icon,
  description,
}: {
  title: string;
  icon: string;
  description: string;
}) {
  return (
    <article className="rounded-xl border border-zinc-200/60 bg-white/80 p-4 shadow-lg backdrop-blur-sm transition-transform duration-200 hover:-translate-y-0.5 dark:border-zinc-700/60 dark:bg-zinc-800/80">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-lg dark:bg-zinc-700">
        {icon}
      </div>
      <h3 className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">{description}</p>
    </article>
  );
}
