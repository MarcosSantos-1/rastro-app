export interface Ecoponto {
  id: string;
  nome: string;
  subprefeitura?: string;
  ativo?: boolean;
}

export interface Registro {
  id: string;
  ecopontoId: string;
  ecoponto: string;
  data: string; // YYYY-MM-DD
  hora: string;
  tipo: "Entrada" | "Saída";
  material: string;
  quantidade: string;
  municipe: string;
  observacao: string;
  createdAt?: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "user";
  ecopontoId?: string;
  ecoponto?: string;
}
