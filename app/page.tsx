"use client";

import { useCallback, useEffect, useState } from "react";
import { Logger } from "@/components/Logger";
import { RemainingRing } from "@/components/RemainingRing";
import { SummaryTable } from "@/components/SummaryTable";
import { Suggestions } from "@/components/Suggestions";
import { Targets } from "@/components/Targets";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TrendsCard } from "@/components/Trends";
import { WeightCard } from "@/components/WeightCard";
import { GlassCard } from "@/components/ui";
import {
  api,
  friendlyDate,
  localToday,
  shiftDate,
} from "@/lib/client";
import type { DayState, ExerciseFavorite, FoodFavorite } from "@/lib/types";

export default function Home() {
  const [date, setDate] = useState<string>(localToday());
  const [day, setDay] = useState<DayState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [foodFavorites, setFoodFavorites] = useState<FoodFavorite[]>([]);
  const [exerciseFavorites, setExerciseFavorites] = useState<
    ExerciseFavorite[]
  >([]);

  const load = useCallback(async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<DayState>(`/api/day?date=${encodeURIComponent(d)}`);
      setDay(res);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load.";
      if (msg.toLowerCase().includes("unauthorized")) {
        window.location.href = "/login";
        return;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const [food, exercise] = await Promise.all([
        api<FoodFavorite[]>("/api/favorites/food"),
        api<ExerciseFavorite[]>("/api/favorites/exercise"),
      ]);
      setFoodFavorites(food);
      setExerciseFavorites(exercise);
    } catch {
      /* favorites are non-critical; leave lists as-is */
    }
  }, []);

  useEffect(() => {
    load(date);
  }, [date, load]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  async function logout() {
    try {
      await api("/api/auth", {
        method: "POST",
        body: JSON.stringify({ action: "logout" }),
      });
    } finally {
      window.location.href = "/login";
    }
  }

  const isToday = date === localToday();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <header className="mb-5 flex flex-wrap items-center gap-3 rounded-3xl px-4 py-3 glass">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="text-xl">🥗</span> Nutrition
        </div>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setDate(shiftDate(date, -1))}
            className="btn btn-ghost px-2.5"
            aria-label="Previous day"
          >
            ‹
          </button>
          <div className="relative">
            <input
              type="date"
              value={date}
              max={localToday()}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="glass-input w-[8.5rem] cursor-pointer text-center"
            />
          </div>
          <button
            type="button"
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={isToday}
            className="btn btn-ghost px-2.5 disabled:opacity-30"
            aria-label="Next day"
          >
            ›
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(localToday())}
              className="btn btn-ghost"
            >
              Today
            </button>
          )}
        </div>

        <ThemeToggle />
        <button type="button" onClick={logout} className="btn btn-ghost">
          Log out
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-xl bg-rose-500/15 px-4 py-3 text-sm text-rose-700 dark:text-rose-300">
          {error}
        </div>
      )}

      {/* Overview */}
      <div className="mb-5">
        <GlassCard>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-base font-semibold">{friendlyDate(date)}</h2>
            {day && day.profile.targetCalories ? (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Target {Math.round(day.targets.kcal)} kcal · P{" "}
                {Math.round(day.targets.protein)} / C {Math.round(day.targets.carb)} /
                F {Math.round(day.targets.fat)}
              </span>
            ) : (
              <span className="text-xs text-slate-400">
                Set targets below ↓
              </span>
            )}
          </div>
          {day ? (
            <RemainingRing day={day} />
          ) : (
            <div className="h-36 animate-pulse rounded-2xl bg-white/30 dark:bg-white/5" />
          )}
        </GlassCard>
      </div>

      {/* Sections */}
      {day && (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Targets profile={day.profile} onChanged={() => load(date)} />
            <Logger
              date={date}
              onDay={setDay}
              foodFavorites={foodFavorites}
              exerciseFavorites={exerciseFavorites}
              onFavoritesChanged={loadFavorites}
            />
          </div>
          <SummaryTable
            day={day}
            date={date}
            onDay={setDay}
            onFavoritesChanged={loadFavorites}
          />
          <Suggestions date={date} />
          <div className="grid gap-5 lg:grid-cols-2">
            <WeightCard onProfileChanged={() => load(date)} />
            <TrendsCard onProfileChanged={() => load(date)} />
          </div>
        </div>
      )}

      {loading && !day && (
        <div className="space-y-5">
          <div className="h-64 animate-pulse rounded-3xl glass" />
          <div className="h-64 animate-pulse rounded-3xl glass" />
        </div>
      )}

      <footer className="mt-8 text-center text-xs text-slate-400 dark:text-slate-500">
        Estimates are AI-generated and approximate.
      </footer>
    </main>
  );
}
