"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import type { DayState } from "@/lib/types";
import { GlassCard, cn } from "./ui";

const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

export function SummaryTable({
  day,
  date,
  onDay,
}: {
  day: DayState;
  date: string;
  onDay: (day: DayState) => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function del(kind: "food" | "exercise", id: number) {
    const key = `${kind}-${id}`;
    setBusyId(key);
    try {
      await api(`/api/${kind}/${id}`, { method: "DELETE" });
      const fresh = await api<DayState>(
        `/api/day?date=${encodeURIComponent(date)}`,
      );
      onDay(fresh);
    } catch {
      /* ignore; leave row in place */
    } finally {
      setBusyId(null);
    }
  }

  const hasFood = day.foodEntries.some((e) => e.items.length > 0);
  const over = day.remaining.kcal < 0;

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold">Summary</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">Section 3</span>
      </div>

      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="pb-2 pr-2 font-medium">Item</th>
              <th className="pb-2 px-2 text-right font-medium">Amount</th>
              <th className="pb-2 px-2 text-right font-medium">Kcal</th>
              <th className="pb-2 px-2 text-right font-medium">P</th>
              <th className="pb-2 px-2 text-right font-medium">C</th>
              <th className="pb-2 px-2 text-right font-medium">F</th>
              <th className="pb-2 pl-2" />
            </tr>
          </thead>
          <tbody>
            {!hasFood && (
              <tr>
                <td
                  colSpan={7}
                  className="py-6 text-center text-slate-400 dark:text-slate-500"
                >
                  No food logged yet — add a photo or description above.
                </td>
              </tr>
            )}

            {day.foodEntries.map((entry, ei) =>
              entry.items.map((it, idx) => (
                <tr
                  key={it.id}
                  className={cn(
                    "border-t border-white/30 dark:border-white/5",
                    ei % 2 === 1 && "bg-white/20 dark:bg-white/5",
                  )}
                >
                  <td className="py-2 pr-2 font-medium text-slate-700 dark:text-slate-200">
                    {it.name}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-slate-500 dark:text-slate-400">
                    {it.amountG != null ? `${Math.round(it.amountG)} g` : "—"}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {Math.round(it.kcal)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-protein">
                    {n1(it.proteinG)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-carb">
                    {n1(it.carbG)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-fat">
                    {n1(it.fatG)}
                  </td>
                  {idx === 0 && (
                    <td
                      rowSpan={entry.items.length}
                      className="pl-2 text-right align-middle"
                    >
                      <button
                        type="button"
                        onClick={() => del("food", entry.id)}
                        disabled={busyId === `food-${entry.id}`}
                        title="Delete this log entry"
                        className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-rose-500/15 hover:text-rose-500 disabled:opacity-40"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              )),
            )}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-white/50 font-semibold dark:border-white/15">
              <td className="py-2 pr-2">Total consumed</td>
              <td />
              <td className="px-2 py-2 text-right tabular-nums">
                {Math.round(day.consumed.kcal)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums text-protein">
                {n1(day.consumed.protein)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums text-carb">
                {n1(day.consumed.carb)}
              </td>
              <td className="px-2 py-2 text-right tabular-nums text-fat">
                {n1(day.consumed.fat)}
              </td>
              <td />
            </tr>
            <tr className={cn("font-semibold", over && "text-rose-500")}>
              <td className="py-1 pr-2">
                {over ? "Over by" : "Remaining"}
              </td>
              <td />
              <td className="px-2 py-1 text-right tabular-nums">
                {Math.abs(Math.round(day.remaining.kcal))}
              </td>
              <td className="px-2 py-1 text-right tabular-nums">
                {n1(Math.abs(day.remaining.protein))}
              </td>
              <td className="px-2 py-1 text-right tabular-nums">
                {n1(Math.abs(day.remaining.carb))}
              </td>
              <td className="px-2 py-1 text-right tabular-nums">
                {n1(Math.abs(day.remaining.fat))}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Exercise */}
      <div className="mt-5 border-t border-white/40 pt-4 dark:border-white/10">
        <h3 className="mb-2 text-sm font-semibold">
          Exercise
          {day.exerciseBurned > 0 && (
            <span className="ml-2 font-normal text-emerald-500">
              −{day.exerciseBurned} kcal
            </span>
          )}
        </h3>
        {day.exercise.length === 0 ? (
          <p className="text-sm text-slate-400 dark:text-slate-500">
            No exercise logged.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {day.exercise.map((ex) => (
              <li
                key={ex.id}
                className="flex items-center gap-2 rounded-xl bg-white/30 px-3 py-2 text-sm dark:bg-white/5"
              >
                <span className="font-medium capitalize text-slate-700 dark:text-slate-200">
                  {ex.type}
                </span>
                {ex.whenText && (
                  <span className="text-slate-400">· {ex.whenText}</span>
                )}
                <span className="ml-auto tabular-nums text-emerald-600 dark:text-emerald-400">
                  {Math.round(ex.caloriesBurned)} kcal
                </span>
                <button
                  type="button"
                  onClick={() => del("exercise", ex.id)}
                  disabled={busyId === `exercise-${ex.id}`}
                  className="rounded-lg px-1.5 text-slate-400 transition hover:text-rose-500 disabled:opacity-40"
                  title="Delete"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}
