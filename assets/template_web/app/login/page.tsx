"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-50 via-zinc-100 to-zinc-200 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-700 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-zinc-200/60 bg-white/80 p-8 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-600 shadow-lg">
            <span className="text-2xl">♻️</span>
          </div>
          <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Entrar
          </h1>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-300">
            Acesse com suas credenciais de colaborador.
          </p>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              router.push("/home");
            }}
          >
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>
            <div>
              <label htmlFor="senha" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                placeholder="••••••••"
                className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-3 font-semibold text-white shadow-lg transition-colors hover:bg-indigo-700"
            >
              Entrar
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
            Cadastro de usuários é feito pelo administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
