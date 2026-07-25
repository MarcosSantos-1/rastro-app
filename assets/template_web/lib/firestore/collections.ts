import {
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Ecoponto, Registro, Usuario } from "./types";

const ECOPONTOS = "ecopontos";
const REGISTROS = "registros";
const USUARIOS = "usuarios";

// --- Ecopontos
export const ecopontosCol = () => collection(db, ECOPONTOS);

export async function getEcopontos(): Promise<Ecoponto[]> {
  const snap = await getDocs(ecopontosCol());
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Ecoponto));
}

// --- Registros
export const registrosCol = () => collection(db, REGISTROS);

export async function getRegistros(): Promise<Registro[]> {
  const q = query(registrosCol(), orderBy("data", "desc"), limit(500));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Registro));
}

export async function getRegistrosByDateRange(
  dataInicio: string,
  dataFim: string
): Promise<Registro[]> {
  const all = await getRegistros();
  return all.filter((r) => r.data >= dataInicio && r.data <= dataFim);
}

export async function addRegistro(data: Omit<Registro, "id">): Promise<string> {
  const ref = await addDoc(registrosCol(), {
    ...data,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

// --- Usuários
export const usuariosCol = () => collection(db, USUARIOS);

export async function getUsuarios(): Promise<Usuario[]> {
  const snap = await getDocs(usuariosCol());
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Usuario));
}
