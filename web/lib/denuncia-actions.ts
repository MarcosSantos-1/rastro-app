import {
  DENUNCIAS_COLLECTION,
  denunciaFotoUrls,
  type Denuncia,
  type DenunciaStatus,
} from "@/lib/denuncias";
import { db, storage } from "@/lib/firebase";
import { deleteR2FotoViaApi, isR2FotoUrl } from "@/lib/rastro-api";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";

function storagePathFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encodedPath>?...
    const marker = "/o/";
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const encoded = u.pathname.slice(idx + marker.length);
    return decodeURIComponent(encoded);
  } catch {
    return null;
  }
}

async function deleteFirebaseStorageUrl(url: string): Promise<void> {
  const path = storagePathFromUrl(url);
  if (!path) return;
  try {
    await deleteObject(ref(storage, path));
  } catch (err) {
    console.warn("Falha ao apagar foto no Storage:", url, err);
  }
}

async function deleteStorageUrl(url: string): Promise<void> {
  if (isR2FotoUrl(url)) {
    try {
      await deleteR2FotoViaApi(url);
    } catch (err) {
      console.warn("Falha ao apagar foto no R2:", url, err);
    }
    return;
  }
  await deleteFirebaseStorageUrl(url);
}

export async function updateDenunciaStatus(
  id: string,
  status: DenunciaStatus,
): Promise<void> {
  await updateDoc(doc(db, DENUNCIAS_COLLECTION, id), {
    status,
    atualizadoEm: new Date().toISOString(),
  });
}

export async function deleteDenunciaCompleta(denuncia: Denuncia): Promise<void> {
  const urls = denunciaFotoUrls(denuncia);
  await Promise.all(urls.map((u) => deleteStorageUrl(u)));
  await deleteDoc(doc(db, DENUNCIAS_COLLECTION, denuncia.id));
}

/**
 * Remove uma foto. Se for a última, exclui o registro inteiro.
 * Retorna `deleted` se a ocorrência sumiu.
 */
export async function deleteDenunciaFoto(
  denuncia: Denuncia,
  fotoUrl: string,
): Promise<{ deleted: boolean; remaining: string[] }> {
  const urls = denunciaFotoUrls(denuncia);
  const remaining = urls.filter((u) => u !== fotoUrl);

  await deleteStorageUrl(fotoUrl);

  if (remaining.length === 0) {
    await deleteDoc(doc(db, DENUNCIAS_COLLECTION, denuncia.id));
    return { deleted: true, remaining: [] };
  }

  await updateDoc(doc(db, DENUNCIAS_COLLECTION, denuncia.id), {
    fotoUrls: remaining,
    fotoUrl: remaining[0],
    atualizadoEm: new Date().toISOString(),
  });

  return { deleted: false, remaining };
}
