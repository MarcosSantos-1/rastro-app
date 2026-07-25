"use client";

import { useUser } from "@/lib/contexts/UserContext";
import { useUsuarios } from "@/lib/hooks/useFirestore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CadastroUsuariosPage() {
  const { isAdmin } = useUser();
  const { data: usuarios, loading, error } = useUsuarios();
  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) router.replace("/home");
  }, [isAdmin, router]);

  if (!isAdmin) return null;

  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-zinc-600 dark:text-zinc-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 lg:text-3xl">
            Cadastro de usuários
          </h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-300">
            Gerencie colaboradores e administradores (Firebase)
          </p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo usuário
        </button>
      </header>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <article className="rounded-2xl border border-zinc-200/60 bg-white/80 shadow-xl backdrop-blur-sm dark:border-zinc-700/60 dark:bg-zinc-800/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/80 dark:border-zinc-600 dark:bg-zinc-900/50">
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                  Nome
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                  E-mail
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left font-semibold text-zinc-900 dark:text-zinc-100">
                  Ecoponto
                </th>
                <th className="px-4 py-3 text-right font-semibold text-zinc-900 dark:text-zinc-100">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-zinc-100 dark:border-zinc-700/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-700/30"
                >
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">
                    {u.nome}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.role === "admin"
                          ? "rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                          : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-600 dark:text-zinc-300"
                      }
                    >
                      {u.role === "admin" ? "Admin" : "Usuário"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {u.ecoponto ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {usuarios.length === 0 && (
          <p className="py-12 text-center text-sm text-zinc-500">
            Nenhum usuário cadastrado. Execute o seed para popular dados iniciais.
          </p>
        )}
      </article>
    </div>
  );
}
