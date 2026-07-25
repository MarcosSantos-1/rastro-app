"use client";

import { useState } from "react";
import { useUser } from "@/lib/contexts/UserContext";

export default function ConfiguracoesPage() {
  const { role, setRole } = useUser();
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMsg, setSeedMsg] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeedLoading(true);
    setSeedMsg(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setSeedMsg(`Criados: ${json.ecopontos} ecopontos, ${json.registros} registros, ${json.usuarios} usuários.`);
      } else {
        setSeedMsg(`Erro: ${json.error}`);
      }
    } catch (e) {
      setSeedMsg("Erro ao executar seed.");
    } finally {
      setSeedLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 lg:text-3xl">
          Configurações
        </h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-300">
          Ajustes do sistema
        </p>
      </header>

      <article className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Modo de demonstração
        </h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Altere o tipo de usuário para testar as permissões. Como admin, você verá o link
          &quot;Cadastro de usuários&quot; no menu.
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Tipo atual:
          </span>
          <div className="flex rounded-lg border border-zinc-300 dark:border-zinc-600 p-1">
            <button
              onClick={() => setRole("user")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                role === "user"
                  ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-600 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Usuário
            </button>
            <button
              onClick={() => setRole("admin")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                role === "admin"
                  ? "bg-purple-600 text-white"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              Administrador
            </button>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-zinc-200/60 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Dados iniciais (Firebase)
        </h2>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          Popule o Firestore com ecopontos, registros e usuários de exemplo. Útil na primeira
          configuração ou para resetar dados de teste.
        </p>
        <button
          onClick={handleSeed}
          disabled={seedLoading}
          className="rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {seedLoading ? "Executando..." : "Popular dados iniciais"}
        </button>
        {seedMsg && (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{seedMsg}</p>
        )}
      </article>
    </div>
  );
}
