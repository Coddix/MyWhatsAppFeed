"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  checkVerifyToken,
  createVerifyToken,
  deriveKey,
  generateSalt,
} from "@/lib/crypto";

type AuthState =
  | { status: "loading" }
  | { status: "needs-setup" }
  | { status: "locked" }
  | { status: "unlocked"; key: CryptoKey };

type AuthContextValue = {
  state: AuthState;
  setup: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<boolean>;
  lock: () => void;
  reset: () => Promise<void>;
};

const STORAGE_KEYS = {
  salt: "mwf:salt",
  verify: "mwf:verify",
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const salt = localStorage.getItem(STORAGE_KEYS.salt);
    const verify = localStorage.getItem(STORAGE_KEYS.verify);
    setState(salt && verify ? { status: "locked" } : { status: "needs-setup" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      async setup(password) {
        const salt = generateSalt();
        const key = await deriveKey(password, salt);
        const verify = await createVerifyToken(key);
        localStorage.setItem(STORAGE_KEYS.salt, salt);
        localStorage.setItem(STORAGE_KEYS.verify, verify);
        setState({ status: "unlocked", key });
      },
      async unlock(password) {
        const salt = localStorage.getItem(STORAGE_KEYS.salt);
        const verify = localStorage.getItem(STORAGE_KEYS.verify);
        if (!salt || !verify) return false;
        const key = await deriveKey(password, salt);
        const ok = await checkVerifyToken(key, verify);
        if (ok) setState({ status: "unlocked", key });
        return ok;
      },
      lock() {
        setState({ status: "locked" });
      },
      async reset() {
        localStorage.removeItem(STORAGE_KEYS.salt);
        localStorage.removeItem(STORAGE_KEYS.verify);
        const { db } = await import("@/lib/db-client");
        await db.delete();
        setState({ status: "needs-setup" });
      },
    }),
    [state]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useEncryptionKey(): CryptoKey {
  const { state } = useAuth();
  if (state.status !== "unlocked") {
    throw new Error("Cannot access encryption key while locked");
  }
  return state.key;
}
