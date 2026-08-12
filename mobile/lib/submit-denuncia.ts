import {
  addDoc,
  collection,
  deleteDoc,
  getDocs,
  limit,
  query,
  updateDoc,
} from "firebase/firestore";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Image } from "react-native";
import type { DenunciaCategoria, DenunciaDoc } from "@/lib/denuncias";
import { DENUNCIAS_COLLECTION, isDenunciaAtiva, parseDenunciaDoc } from "@/lib/denuncias";
import { distanceMeters, withTimeout } from "@/lib/geo";
import { auth, db } from "@/lib/firebase";
import { uploadFotoViaApi } from "@/lib/rastro-api";

const MAX_EDGE = 800;
const JPEG_QUALITY = 0.6;
export const ANTI_DUPE_RADIUS_M = 100;
export const MAP_RADIUS_M = 400;
/** Debug: desliga bloqueio de denúncia próxima no registro. Remover antes do hard. */
export const SKIP_ANTI_DUPE_CHECK = true;

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
  // No iOS/Expo Go o WebChannel às vezes nunca resolve — não deixar o mapa pendurado.
  const snap = await withTimeout(
    getDocs(query(collection(db, DENUNCIAS_COLLECTION), limit(500))),
    8_000,
    "Firestore",
  );
  const out = [];
  for (const docSnap of snap.docs) {
    const d = parseDenunciaDoc(docSnap.id, docSnap.data() as Record<string, unknown>);
    // Só pós-IA no mapa: descartadas (arquivadas) e em análise não aparecem.
    if (!d || d.status === "descartada" || d.status === "em_analise") continue;
    if (d.iaValida === false) continue;
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
    status: "em_analise",
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
      const blob = await compressImage(input.photoUris[i]);
      const uploaded = await uploadFotoViaApi({
        denunciaId: docRef.id,
        index: i,
        blob,
      });
      if (!uploaded.fotoUrl) throw new Error("Upload sem URL de foto");
      urls.push(uploaded.fotoUrl);
    }

    // Só campos de foto — triagem IA é escrita pelo Worker em background.
    await updateDoc(docRef, {
      fotoUrl: urls[0],
      fotoUrls: urls,
      atualizadoEm: new Date().toISOString(),
    });
  } catch (err) {
    console.warn("upload fotos", err);
    // Evita órfão sem foto no portal (e retries que disparam Gemini de novo).
    try {
      await deleteDoc(docRef);
    } catch (delErr) {
      console.warn("cleanup draft", delErr);
    }
    throw err;
  }

  return { id: docRef.id };
}
