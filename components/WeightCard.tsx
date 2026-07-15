"use client";

import { useCallback, useEffect, useState } from "react";
import { api, localToday } from "@/lib/client";
import type { WeightEntry } from "@/lib/types";
import { Banner, Button, GlassCard } from "./ui";

const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

/** Simple SVG line chart of weight entries (ascending by date). */
function TrendLine({ entries }: { entries: WeightEntry[] }) {
  if (entries.length < 2) return null;

  const W = 600;
  const H = 140;
  const PAD = { top: 14, right: 42, bottom: 8, left: 6 };

  const ws = entries.map((e) => e.weightKg);
  const min = Math.min(...ws);
  const max = Math.max(...ws);
  const span = Math.max(max - min, 0.5); // avoid a flat line filling the chart
  const lo = min - span * 0.15;
  const hi = max + span * 0.15;

  const x = (i: number) =>
    PAD.left + (i / (entries.length - 1)) * (W - PAD.left - PAD.right);
  const y = (w: number) =>
    PAD.top + (1 - (w - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);

  const points = entries.map((e, i) => `${x(i)},${y(e.weightKg)}`).join(" ");
  const last = entries[entries.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-32 w-full"
      preserveAspectRatio="none"
      aria-hidden
    >
      {/* area fill under the line */}
      <polygon
        points={`${PAD.left},${H - PAD.bottom} ${points} ${x(entries.length - 1)},${H - PAD.bottom}`}
        fill="url(#weight-fill)"
        opacity="0.25"
      />
      <defs>
        <linearGradient id="weight-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke="#38bdf8"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
      {entries.map((e, i) => (
        <circle
          key={e.id}
          cx={x(i)}
          cy={y(e.weightKg)}
          r="3"
          fill="#38bdf8"
          vectorEffect="non-scaling-stroke"
        >
          <title>{`${e.date}: ${n1(e.weightKg)} kg`}</title>
        </circle>
      ))}
      {/* latest value label */}
      <text
        x={x(entries.length - 1) + 6}
        y={y(last.weightKg) + 4}
        fontSize="12"
        className="fill-slate-500 dark:fill-slate-400"
      >
        {n1(last.weightKg)}
      </text>
    </svg>
  );
}

export function WeightCard({
  onProfileChanged,
}: {
  onProfileChanged: () => void;
}) {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setEntries(await api<WeightEntry[]>("/api/weight?days=90"));
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    const w = Number(value);
    if (!Number.isFinite(w) || w <= 0) {
      setError("Enter your weight in kg.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await api<WeightEntry>("/api/weight", {
        method: "POST",
        body: JSON.stringify({ date: localToday(), weightKg: w }),
      });
      setValue("");
      await load();
      onProfileChanged(); // profile.weightKg synced server-side
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not log weight.");
    } finally {
      setLoading(false);
    }
  }

  const last = entries[entries.length - 1];
  const todayLogged = last?.date === localToday();

  // Delta vs the closest entry ≥7 days before the latest one.
  let delta7: number | null = null;
  if (entries.length >= 2 && last) {
    const lastMs = new Date(last.date).getTime();
    const before = [...entries]
      .reverse()
      .find((e) => lastMs - new Date(e.date).getTime() >= 6.5 * 86400000);
    if (before) delta7 = Math.round((last.weightKg - before.weightKg) * 10) / 10;
  }

  return (
    <GlassCard>
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-lg font-semibold">Weight</h2>
        {last && (
          <span className="ml-auto text-sm tabular-nums text-slate-500 dark:text-slate-400">
            {n1(last.weightKg)} kg
            {delta7 != null && (
              <span
                className={
                  delta7 > 0
                    ? "ml-2 text-amber-500"
                    : delta7 < 0
                      ? "ml-2 text-emerald-500"
                      : "ml-2"
                }
              >
                {delta7 > 0 ? "+" : ""}
                {n1(delta7)} kg / wk
              </span>
            )}
          </span>
        )}
      </div>

      <TrendLine entries={entries} />

      {entries.length < 2 && (
        <p className="mb-2 text-sm text-slate-400 dark:text-slate-500">
          Log your weight regularly to see the trend here.
        </p>
      )}

      <div className="mt-2 flex items-center gap-2">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={last ? `${n1(last.weightKg)}` : "e.g. 72.5"}
          className="glass-input w-28 px-3 py-1.5 text-sm"
        />
        <span className="text-sm text-slate-500 dark:text-slate-400">kg</span>
        <Button onClick={submit} loading={loading} className="ml-auto px-3 py-1.5 text-sm">
          {todayLogged ? "Update today" : "Log today"}
        </Button>
      </div>

      {error && (
        <div className="mt-2">
          <Banner kind="error">{error}</Banner>
        </div>
      )}
    </GlassCard>
  );
}
