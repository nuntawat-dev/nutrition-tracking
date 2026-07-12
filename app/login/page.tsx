"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import { Banner, Button } from "@/components/ui";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "login", password }),
      });
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm animate-rise-in rounded-3xl p-6 glass"
      >
        <div className="mb-1 flex items-center gap-2 text-xl font-semibold">
          <span className="text-2xl">🥗</span> Nutrition
        </div>
        <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
          Enter your password to continue.
        </p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="glass-input mb-3"
        />

        {error && (
          <div className="mb-3">
            <Banner kind="error">{error}</Banner>
          </div>
        )}

        <Button type="submit" loading={loading} className="w-full">
          Log in
        </Button>
      </form>
    </main>
  );
}
