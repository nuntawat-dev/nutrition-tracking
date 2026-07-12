"use client";

import { useState } from "react";
import { api, localTimeLabel } from "@/lib/client";
import { Banner, Button, GlassCard } from "./ui";

interface Suggestion {
  meal: string;
  description: string;
  estKcal: number;
  proteinG: number;
  carbG: number;
  fatG: number;
  why: string;
}

export function Suggestions({ date }: { date: string }) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function suggest() {
    setError(null);
    setLoading(true);
    try {
      const res = await api<{ suggestions: Suggestion[] }>("/api/suggest", {
        method: "POST",
        body: JSON.stringify({ date, localTime: localTimeLabel() }),
      });
      setItems(res.suggestions);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GlassCard>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Next meal</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Suggestion
          </span>
        </div>
        <Button onClick={suggest} loading={loading}>
          ✨ Suggest next meal
        </Button>
      </div>

      {error && <Banner kind="error">{error}</Banner>}

      {items.length === 0 && !error && (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Get 1–3 meal ideas sized to the macros you have left today.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s, i) => (
          <div
            key={i}
            className="animate-rise-in rounded-2xl border border-white/40 bg-white/40 p-4 dark:border-white/10 dark:bg-white/5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="mb-1 font-semibold text-slate-800 dark:text-slate-100">
              {s.meal}
            </div>
            <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">
              {s.description}
            </p>
            <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
              <span className="chip bg-cal/15 text-amber-700 dark:text-amber-300">
                {Math.round(s.estKcal)} kcal
              </span>
              <span className="chip bg-protein/15 text-rose-600 dark:text-rose-300">
                P {Math.round(s.proteinG)}
              </span>
              <span className="chip bg-carb/15 text-sky-600 dark:text-sky-300">
                C {Math.round(s.carbG)}
              </span>
              <span className="chip bg-fat/15 text-violet-600 dark:text-violet-300">
                F {Math.round(s.fatG)}
              </span>
            </div>
            <p className="text-xs italic text-slate-500 dark:text-slate-400">
              {s.why}
            </p>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
