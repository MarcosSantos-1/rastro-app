import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth } from "@/lib/firebase";

type AuthState = {
  user: User | null;
  ready: boolean;
  /** Garante sessão anônima (necessária para Firestore/Storage). */
  ensureAnonymous: () => Promise<User>;
};

const Ctx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  const ensureAnonymous = useCallback(async () => {
    if (auth.currentUser) return auth.currentUser;
    const cred = await signInAnonymously(auth);
    return cred.user;
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!auth.currentUser) {
      void ensureAnonymous().catch(() => {
        /* splash / mapa podem tentar de novo */
      });
    }
  }, [ready, ensureAnonymous]);

  const value = useMemo(
    () => ({
      user,
      ready,
      ensureAnonymous,
    }),
    [user, ready, ensureAnonymous],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth outside AuthProvider");
  return v;
}
