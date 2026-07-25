"use client";

import { db } from "@/lib/firebase";
import {
  DENUNCIAS_COLLECTION,
  parseDenunciaDoc,
  type Denuncia,
} from "@/lib/denuncias";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";

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
          const parsed = parseDenunciaDoc(d.id, d.data() as Record<string, unknown>);
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
