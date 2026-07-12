"use client";

import type { DayState } from "@/lib/types";
import { cn } from "./ui";

function MacroBar({
  label,
  consumed,
  target,
  color,
}: {
  label: string;
  consumed: number;
  target: number;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  const over = target > 0 && consumed > target;
  const left = Math.round((target - consumed) * 10) / 10;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium text-slate-600 dark:text-slate-300">
          {label}
        </span>
        <span className="tabular-nums text-slate-500 dark:text-slate-400">
          {Math.round(consumed)} / {Math.round(target)} g
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/50 dark:bg-white/10">
        <div
          className={cn("h-full rounded-full transition-all duration-500")}
          style={{ width: `${pct}%`, backgroundColor: over ? "#f43f5e" : color }}
        />
      </div>
      <div className="mt-0.5 text-right text-[11px] tabular-nums text-slate-400">
        {over ? `${Math.abs(left)} g over` : `${left} g left`}
      </div>
    </div>
  );
}

export function RemainingRing({ day }: { day: DayState }) {
  const budget =
    day.targets.kcal + (day.profile.addExerciseBack ? day.exerciseBurned : 0);
  const consumed = day.consumed.kcal;
  const frac = budget > 0 ? consumed / budget : 0;
  const over = budget > 0 && consumed > budget;

  const R = 52;
  const C = 2 * Math.PI * R;
  const dash = Math.min(1, Math.max(0, frac)) * C;

  return (
    <div className="grid gap-6 sm:grid-cols-[auto,1fr] sm:items-center">
      <div className="mx-auto">
        <div className="relative h-36 w-36">
          <svg
            viewBox="0 0 120 120"
            className="h-36 w-36 -rotate-90"
            aria-hidden
          >
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth="12"
              className="stroke-white/60 dark:stroke-white/10"
            />
            <circle
              cx="60"
              cy="60"
              r={R}
              fill="none"
              strokeWidth="12"
              strokeLinecap="round"
              stroke={over ? "#f43f5e" : "#f59e0b"}
              strokeDasharray={`${dash} ${C}`}
              style={{ transition: "stroke-dasharray 600ms ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className={cn(
                "text-2xl font-semibold tabular-nums",
                over ? "text-rose-500" : "text-slate-800 dark:text-slate-100",
              )}
            >
              {Math.round(day.remaining.kcal)}
            </span>
            <span className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {over ? "kcal over" : "kcal left"}
            </span>
          </div>
        </div>
        <div className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          {Math.round(consumed)} / {Math.round(budget)} kcal
          {day.profile.addExerciseBack && day.exerciseBurned > 0 && (
            <span className="text-emerald-500"> (+{day.exerciseBurned} exercise)</span>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <MacroBar
          label="Protein"
          consumed={day.consumed.protein}
          target={day.targets.protein}
          color="#f43f5e"
        />
        <MacroBar
          label="Carbs"
          consumed={day.consumed.carb}
          target={day.targets.carb}
          color="#38bdf8"
        />
        <MacroBar
          label="Fat"
          consumed={day.consumed.fat}
          target={day.targets.fat}
          color="#a78bfa"
        />
      </div>
    </div>
  );
}
