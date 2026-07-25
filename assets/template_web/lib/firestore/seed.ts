import { doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SEED_ECOPONTOS = [
  { id: "ec1", nome: "Ecoponto Vila Nova Cachoeirinha", subprefeitura: "Sub CV (Casa Verde / Limão / Cachoeirinha)" },
  { id: "ec2", nome: "Ecoponto Vila Santa Maria", subprefeitura: "Sub CV (Casa Verde / Limão / Cachoeirinha)" },
  { id: "ec3", nome: "Ecoponto Jardim Antártica", subprefeitura: "Sub CV (Casa Verde / Limão / Cachoeirinha)" },
  { id: "ec4", nome: "Ecoponto Parque Peruche", subprefeitura: "Sub CV (Casa Verde / Limão / Cachoeirinha)" },
  { id: "ec5", nome: "Ecoponto São Leandro", subprefeitura: "Sub CV (Casa Verde / Limão / Cachoeirinha)" },
  { id: "ec6", nome: "Ecoponto Anselmo Machado", subprefeitura: "Sub JT (Jaçanã/ Tremembé)" },
  { id: "ec7", nome: "Ecoponto Silvio Bittencourt", subprefeitura: "Sub JT (Jaçanã/ Tremembé)" },
  { id: "ec8", nome: "Ecoponto Vila Sabrina", subprefeitura: "Sub MG (Vila Maria/ Vila Guilherme)" },
  { id: "ec9", nome: "Ecoponto Vila Guilherme", subprefeitura: "Sub MG (Vila Maria/ Vila Guilherme)" },
  { id: "ec10", nome: "Ecoponto Vila Maria", subprefeitura: "Sub MG (Vila Maria/ Vila Guilherme)" },
  { id: "ec11", nome: "Ecoponto Santana", subprefeitura: "Sub ST (Santana/ Tucuruvi)" },
  { id: "ec12", nome: "Ecoponto Tucuruvi", subprefeitura: "Sub ST (Santana/ Tucuruvi)" },
];

const SEED_REGISTROS = [
  { ecopontoId: "ec1", ecoponto: "Ecoponto Vila Nova Cachoeirinha", data: "2025-02-20", hora: "09:15", tipo: "Entrada" as const, material: "Entulho", quantidade: "2,5 m³", municipe: "João Silva", observacao: "2 sacos grandes" },
  { ecopontoId: "ec1", ecoponto: "Ecoponto Vila Nova Cachoeirinha", data: "2025-02-20", hora: "10:30", tipo: "Saída" as const, material: "Entulho", quantidade: "30 m³", municipe: "—", observacao: "Caçamba 30m³ — Placa ABC-1234" },
  { ecopontoId: "ec2", ecoponto: "Ecoponto Vila Santa Maria", data: "2025-02-20", hora: "08:00", tipo: "Entrada" as const, material: "Madeira", quantidade: "1,2 m³", municipe: "Maria Santos", observacao: "Móveis antigos" },
  { ecopontoId: "ec2", ecoponto: "Ecoponto Vila Santa Maria", data: "2025-02-19", hora: "14:45", tipo: "Entrada" as const, material: "PEV", quantidade: "45 kg", municipe: "Pedro Costa", observacao: "Recicláveis diversos" },
  { ecopontoId: "ec3", ecoponto: "Ecoponto Jardim Antártica", data: "2025-02-19", hora: "16:20", tipo: "Saída" as const, material: "Gesso", quantidade: "13 m³", municipe: "—", observacao: "Caçamba 13m³ — Placa DEF-5678" },
];

const SEED_USUARIOS = [
  { id: "u1", nome: "Admin Silva", email: "admin@ecoponto.gov.br", role: "admin" as const, ecoponto: "—" },
  { id: "u2", nome: "João Santos", email: "joao@ecoponto.gov.br", role: "user" as const, ecoponto: "Ecoponto Vila Nova Cachoeirinha" },
  { id: "u3", nome: "Maria Costa", email: "maria@ecoponto.gov.br", role: "user" as const, ecoponto: "Ecoponto Vila Santa Maria" },
  { id: "u4", nome: "Pedro Oliveira", email: "pedro@ecoponto.gov.br", role: "user" as const, ecoponto: "Ecoponto Jardim Antártica" },
];

export async function seedFirestore() {
  for (const e of SEED_ECOPONTOS) {
    await setDoc(doc(db, "ecopontos", e.id), { nome: e.nome, subprefeitura: e.subprefeitura, ativo: true });
  }
  for (let i = 0; i < SEED_REGISTROS.length; i++) {
    await setDoc(doc(db, "registros", `reg${i + 1}`), {
      ...SEED_REGISTROS[i],
      createdAt: new Date().toISOString(),
    });
  }
  for (const u of SEED_USUARIOS) {
    const { id, ...rest } = u;
    await setDoc(doc(db, "usuarios", id), rest);
  }
  return { ecopontos: SEED_ECOPONTOS.length, registros: SEED_REGISTROS.length, usuarios: SEED_USUARIOS.length };
}
