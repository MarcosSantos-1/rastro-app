import { addDoc, collection, getDocs, limit, query, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Image } from "react-native";
import type { DenunciaCategoria, DenunciaDoc } from "@/lib/denuncias";
import { DENUNCIAS_COLLECTION, isDenunciaAtiva, parseDenunciaDoc } from "@/lib/denuncias";
import { distanceMeters } from "@/lib/geo";
import { auth, db, storage } from "@/lib/firebase";

const MAX_EDGE = 800;
const JPEG_QUALITY = 0.6;
export const ANTI_DUPE_RADIUS_M = 100;
export const MAP_RADIUS_M = 100;

export type SubmitDenunciaInput = {
  categoria: DenunciaCategoria;
  observacao?: string;
  lat: number;
  lng: number;
  endereco?: string;
  bairro?: string;
  municipio?: string;
  /** Local URIs das fotos (1–2). */
  photoUris: string[];
};

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      reject,
    );
  });
}

async function compressImage(uri: string): Promise<Blob> {
  let actions: { resize: { width?: number; height?: number } }[] = [];
  try {
    const { width, height } = await getImageSize(uri);
    if (width >= height && width > MAX_EDGE) {
      actions = [{ resize: { width: MAX_EDGE } }];
    } else if (height > MAX_EDGE) {
      actions = [{ resize: { height: MAX_EDGE } }];
    }
  } catch {
    actions = [{ resize: { width: MAX_EDGE } }];
  }
  const result = await manipulateAsync(uri, actions, {
    compress: JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });
  const res = await fetch(result.uri);
  return res.blob();
}

async function uploadFoto(uid: string, denunciaId: string, index: number, uri: string): Promise<string> {
  const blob = await compressImage(uri);
  const path = `denuncias/${uid}/${denunciaId}_${index}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, blob, { contentType: "image/jpeg" });
  return getDownloadURL(storageRef);
}

/** Verifica se já existe denúncia ativa a ≤ 100 m. */
export async function findNearbyActiveDenuncia(
  lat: number,
  lng: number,
  radiusM = ANTI_DUPE_RADIUS_M,
): Promise<{ id: string; distanceM: number } | null> {
  const snap = await getDocs(query(collection(db, DENUNCIAS_COLLECTION), limit(400)));
  let best: { id: string; distanceM: number } | null = null;
  for (const docSnap of snap.docs) {
    const d = parseDenunciaDoc(docSnap.id, docSnap.data() as Record<string, unknown>);
    if (!d || !isDenunciaAtiva(d.status)) continue;
    const dist = distanceMeters(lat, lng, d.lat, d.lng);
    if (dist <= radiusM && (!best || dist < best.distanceM)) {
      best = { id: d.id, distanceM: dist };
    }
  }
  return best;
}

export async function listDenunciasNear(
  lat: number,
  lng: number,
  radiusM = MAP_RADIUS_M,
) {
  const snap = await getDocs(query(collection(db, DENUNCIAS_COLLECTION), limit(500)));
  const out = [];
  for (const docSnap of snap.docs) {
    const d = parseDenunciaDoc(docSnap.id, docSnap.data() as Record<string, unknown>);
    if (!d || d.status === "descartada") continue;
    const dist = distanceMeters(lat, lng, d.lat, d.lng);
    if (dist <= radiusM) out.push({ ...d, distanceM: dist });
  }
  return out;
}

export async function submitDenuncia(input: SubmitDenunciaInput): Promise<{ id: string }> {
  const user = auth.currentUser;
  if (!user) throw new Error("Usuário não autenticado");
  if (!input.photoUris.length) throw new Error("Adicione pelo menos uma foto");
  if (input.photoUris.length > 2) throw new Error("Máximo de 2 fotos");

  const createdAt = new Date().toISOString();
  const draft: DenunciaDoc = {
    categoria: input.categoria,
    status: "pendente",
    lat: input.lat,
    lng: input.lng,
    createdAt,
    atualizadoEm: createdAt,
    cidadaoAnonimo: true,
    userId: user.uid,
    ...(input.endereco ? { endereco: input.endereco } : {}),
    ...(input.bairro ? { bairro: input.bairro } : {}),
    ...(input.municipio ? { municipio: input.municipio } : {}),
    ...(input.observacao?.trim() ? { observacao: input.observacao.trim() } : {}),
  };

  const col = collection(db, DENUNCIAS_COLLECTION);
  const docRef = await addDoc(col, draft);

  try {
    const urls: string[] = [];
    for (let i = 0; i < input.photoUris.length; i++) {
      const url = await uploadFoto(user.uid, docRef.id, i, input.photoUris[i]);
      urls.push(url);
    }
    await updateDoc(docRef, {
      fotoUrl: urls[0],
      fotoUrls: urls,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("upload fotos", err);
    throw err;
  }

  return { id: docRef.id };
}
