"use client";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  // Guard temporário: sem auth ainda. Apenas renderiza as rotas.
  // Lógica de proteção será adicionada com o backend.
  return <>{children}</>;
}
