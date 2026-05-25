"use client";

import { useState } from "react";
import Image from "next/image";
import { Lock, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { state } = useAuth();

  if (state.status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
      </div>
    );
  }

  if (state.status === "unlocked") return <>{children}</>;

  return <LockScreen needsSetup={state.status === "needs-setup"} />;
}

function LockScreen({ needsSetup }: { needsSetup: boolean }) {
  const { setup, unlock, reset } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (needsSetup) {
      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirm) {
        setError("Passwords don't match.");
        return;
      }
      setBusy(true);
      try {
        await setup(password);
      } catch {
        setError("Setup failed. Please try again.");
      } finally {
        setBusy(false);
      }
    } else {
      setBusy(true);
      try {
        const ok = await unlock(password);
        if (!ok) setError("Incorrect password.");
      } finally {
        setBusy(false);
      }
    }
  }

  async function handleReset() {
    if (!confirm) {
      const yes = window.confirm(
        "This will erase ALL your imported chats and reset your password. Continue?"
      );
      if (!yes) return;
    }
    await reset();
    setPassword("");
    setConfirm("");
    setError(null);
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100 p-4 dark:from-gray-900 dark:to-gray-950">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center">
          <Image
            src="/logo.png"
            alt="MyWhatsAppFeed"
            width={180}
            height={48}
            className="mb-2 h-12 w-auto"
            priority
          />
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-50">
            <Lock size={18} />
            <h2 className="text-base font-semibold">
              {needsSetup ? "Set a password" : "Unlock your feed"}
            </h2>
          </div>

          <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">
            {needsSetup
              ? "Your chats are encrypted on this device with this password. Don't lose it — there is no recovery."
              : "Enter your password to decrypt your local chat database."}
          </p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                Password
              </span>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  autoComplete={needsSetup ? "new-password" : "current-password"}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {needsSetup && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Confirm password
                </span>
                <input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
              </label>
            )}

            {error && (
              <div className="flex items-start gap-1.5 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/50 dark:text-red-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !password || (needsSetup && !confirm)}
              className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? "Working…" : needsSetup ? "Create password" : "Unlock"}
            </button>
          </form>

          {!needsSetup && (
            <button
              onClick={handleReset}
              type="button"
              className="mt-4 w-full text-center text-xs text-gray-500 hover:text-red-600 dark:hover:text-red-400"
            >
              Forgot password? Reset all data
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-xs text-gray-500">
          Data stays on your device. Nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
