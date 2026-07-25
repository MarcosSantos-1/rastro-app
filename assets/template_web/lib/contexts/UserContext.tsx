"use client";

import { createContext, useContext, useEffect, useState } from "react";

type UserRole = "admin" | "user";

interface UserContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isAdmin: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = "ecopontos_user_role";

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>("user");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as UserRole | null;
    if (saved === "admin" || saved === "user") setRoleState(saved);
  }, []);

  const setRole = (r: UserRole) => {
    setRoleState(r);
    localStorage.setItem(STORAGE_KEY, r);
  };

  return (
    <UserContext.Provider
      value={{
        role,
        setRole,
        isAdmin: role === "admin",
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (ctx === undefined) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
