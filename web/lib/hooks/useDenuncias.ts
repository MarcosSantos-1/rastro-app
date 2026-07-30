"use client";

import { db } from "@/lib/firebase";
import {
  DENUNCIAS_COLLECTION,
  isStatusEmAnalise,
  parseDenunciaDoc,
  statusAposTriagemIa,
  type Denuncia,
} from "@/lib/denuncias";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

/** Evita updateDoc em loop no mesmo id enquanto o snapshot atualiza. */
const repairingIds = new Set<string>();

function repairStatusIfNeeded(id: string, raw: Record<string, unknown>) {
  const status = typeof raw.status === "string" ? raw.status : "";
  const iaValida = typeof raw.iaValida === "boolean" ? raw.iaValida : null;
  if (iaValida == null) return;
  if (status !== "em_analise" && status !== "pendente") return;

  const next = statusAposTriagemIa(
    status as "em_analise" | "pendente",
    iaValida,
  );
  if (next === status || isStatusEmAnalise(next)) return;
  if (repairingIds.has(id)) return;

  repairingIds.add(id);
  void updateDoc(doc(db, DENUNCIAS_COLLECTION, id), {
    status: next,
    atualizadoEm: new Date().toISOString(),
  })
    .catch((err) => {
      console.warn("[useDenuncias] repair status", id, err);
    })
    .finally(() => {
      repairingIds.delete(id);
    });
}

export function useDenuncias(enabled: boolean) {
  const [items, setItems] = useState<Denuncia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, DENUNCIAS_COLLECTION),
      orderBy("createdAt", "desc"),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Denuncia[] = [];
        snap.forEach((d) => {
          const raw = d.data() as Record<string, unknown>;
          repairStatusIfNeeded(d.id, raw);
          const parsed = parseDenunciaDoc(d.id, raw);
          if (parsed) list.push(parsed);
        });
        setItems(list);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("[useDenuncias]", err);
        setError(err.message || String(err));
        setItems([]);
        setLoading(false);
      },
    );

    return unsub;
  }, [enabled]);

  return { items, loading, error };
}
