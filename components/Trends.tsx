"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Macros, WeightEntry } from "@/lib/types";
import { Banner, Button, GlassCard, Segmented, cn } from "./ui";

interface TrendDay {
  date: string;
  kcal: number;
  protein: number;
  carb: number;
  fat: number;
  burned: number;
  logged: boolean;
}

interface Trends {
  days: number;
  series: TrendDay[];
  targets: Macros;
  weights: WeightEntry[];
  stats: {
    loggedDays: number;
    avgKcal: number;
    avgProtein: number;
    avgCarb: number;
    avgFat: number;
    streak: number;
  };
}

interface CoachReview {
  observations: { title: string; detail: string }[];
  suggestion: string;
  targetAdjustment: {
    recommended: boolean;
    targetCalories: number;
    proteinG: number;
    carbG: number;
    fatG: number;
    rationale: string;
  };
}

/** Daily-kcal bar chart with the target drawn as a dashed line. */
function KcalBars({ trends }: { trends: Trends }) {
  const { series, targets } = trends;
  const W = 600;
  const H = 150;
  const PAD = { top: 10, bottom: 18, left: 6, right: 6 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(targets.kcal, ...series.map((d) => d.kcal), 1) * 1.08;
  const bw = innerW / series.length;
  const y = (v: number) => PAD.top + (1 - v / maxVal) * innerH;

  const targetY = targets.kcal > 0 ? y(targets.kcal) : null;
  const showEvery = series.length > 10 ? 5 : 1; // date labels: weekly-ish on 30d

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden>
      {series.map((d, i) => {
        const h = Math.max(0, PAD.top + innerH - y(d.kcal));
        const over = targets.kcal > 0 && d.kcal > targets.kcal;
        return (
          <g key={d.date}>
            <rect
              x={PAD.left + i * bw + bw * 0.15}
              y={y(d.kcal)}
              width={bw * 0.7}
              height={h}
              rx={Math.min(4, bw * 0.2)}
              className={cn(
                over
                  ? "fill-rose-400/80"
                  : d.logged
                    ? "fill-sky-400/80"
                    : "fill-slate-400/20",
              )}
            >
              <title>{`${d.date}: ${d.kcal} kcal${d.burned ? ` (−${d.burned} exercise)` : ""}`}</title>
            </rect>
            {i % showEvery === 0 && (
              <text
                x={PAD.left + i * bw + bw / 2}
                y={H - 4}
                fontSize="10"
                textAnchor="middle"
                className="fill-slate-400 dark:fill-slate-500"
              >
                {d.date.slice(8)}
              </text>
            )}
          </g>
        );
      })}
      {targetY != null && (
        <>
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={targetY}
            y2={targetY}
            strokeDasharray="6 4"
            strokeWidth="1.5"
            className="stroke-amber-500/80"
          />
          <text
            x={W - PAD.right}
            y={targetY - 4}
            fontSize="10"
            textAnchor="end"
            className="fill-amber-500"
          >
            target {Math.round(targets.kcal)}
          </text>
        </>
      )}
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/30 px-3 py-2 text-center dark:bg-white/5">
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </div>
    </div>
  );
}

export function TrendsCard({
  onProfileChanged,
}: {
  onProfileChanged: () => void;
}) {
  const [days, setDays] = useState<"7" | "30">("7");
  const [trends, setTrends] = useState<Trends | null>(null);
  const [review, setReview] = useState<CoachReview | null>(null);
  const [loadingReview, setLoadingReview] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: string) => {
    try {
      setTrends(await api<Trends>(`/api/trends?days=${d}`));
    } catch {
      /* non-critical */
    }
  }, []);

  useEffect(() => {
    load(days);
  }, [days, load]);

  async function runReview() {
    setLoadingReview(true);
    setError(null);
    setReview(null);
    setApplied(false);
    try {
      const res = await api<{ review: CoachReview }>("/api/coach", {
        method: "POST",
        body: JSON.stringify({ days: Number(days) }),
      });
      setReview(res.review);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Review failed.");
    } finally {
      setLoadingReview(false);
    }
  }

  async function applyTargets() {
    if (!review) return;
    const t = review.targetAdjustment;
    setApplying(true);
    setError(null);
    try {
      await api("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          targetCalories: Math.round(t.targetCalories),
          proteinG: Math.round(t.proteinG),
          carbG: Math.round(t.carbG),
          fatG: Math.round(t.fatG),
        }),
      });
      setApplied(true);
      onProfileChanged();
      load(days);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not apply targets.");
    } finally {
      setApplying(false);
    }
  }

  return (
    <GlassCard>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">Trends</h2>
        <div className="ml-auto w-36">
          <Segmented
            value={days}
            onChange={(v) => setDays(v)}
            options={[
              { value: "7", label: "7 days" },
              { value: "30", label: "30 days" },
            ]}
          />
        </div>
      </div>

      {!trends ? (
        <div className="h-40 animate-pulse rounded-2xl bg-white/30 dark:bg-white/5" />
      ) : trends.stats.loggedDays === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">
          Nothing logged in this period yet.
        </p>
      ) : (
        <>
          <KcalBars trends={trends} />
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            <Stat label="days logged" value={`${trends.stats.loggedDays}/${trends.days}`} />
            <Stat label="streak" value={`${trends.stats.streak}`} />
            <Stat label="avg kcal" value={`${Math.round(trends.stats.avgKcal)}`} />
            <Stat label="avg P" value={`${Math.round(trends.stats.avgProtein)} g`} />
            <Stat label="avg C" value={`${Math.round(trends.stats.avgCarb)} g`} />
            <Stat label="avg F" value={`${Math.round(trends.stats.avgFat)} g`} />
          </div>

          <div className="mt-4">
            <Button onClick={runReview} loading={loadingReview}>
              ✨ Review my {days} days
            </Button>
          </div>
        </>
      )}

      {review && (
        <div className="mt-4 space-y-2">
          {review.observations.map((o, i) => (
            <div
              key={i}
              className="rounded-xl bg-white/30 px-3 py-2 dark:bg-white/5"
            >
              <div className="text-sm font-semibold">{o.title}</div>
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {o.detail}
              </div>
            </div>
          ))}
          <div className="rounded-xl bg-sky-500/10 px-3 py-2 text-sm text-sky-800 dark:text-sky-200">
            <span className="font-semibold">This week:</span> {review.suggestion}
          </div>

          {review.targetAdjustment.recommended && (
            <div className="rounded-xl bg-amber-500/10 px-3 py-2.5 dark:bg-amber-500/15">
              <div className="text-sm font-semibold">
                Suggested new targets
              </div>
              <div className="mt-0.5 text-sm tabular-nums text-slate-600 dark:text-slate-300">
                {Math.round(review.targetAdjustment.targetCalories)} kcal · P{" "}
                {Math.round(review.targetAdjustment.proteinG)} / C{" "}
                {Math.round(review.targetAdjustment.carbG)} / F{" "}
                {Math.round(review.targetAdjustment.fatG)}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {review.targetAdjustment.rationale}
              </div>
              <div className="mt-2">
                {applied ? (
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    ✓ Applied
                  </span>
                ) : (
                  <Button
                    onClick={applyTargets}
                    loading={applying}
                    className="px-3 py-1.5 text-xs"
                  >
                    Apply new targets
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mt-3">
          <Banner kind="error">{error}</Banner>
        </div>
      )}
    </GlassCard>
  );
}
