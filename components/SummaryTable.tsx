"use client";

import { useState } from "react";
import { api } from "@/lib/client";
import type { DayState, ExerciseEntry, FoodItem } from "@/lib/types";
import { Button, GlassCard, cn } from "./ui";

const n1 = (v: number) => (Math.round(v * 10) / 10).toString();

type Editing = { kind: "food-item" | "exercise"; id: number } | null;

export function SummaryTable({
  day,
  date,
  onDay,
  onFavoritesChanged,
}: {
  day: DayState;
  date: string;
  onDay: (day: DayState) => void;
  onFavoritesChanged: () => void;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  // ids that were just saved as a favorite, for the brief ✓ feedback
  const [starred, setStarred] = useState<Set<string>>(new Set());

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

  function startEditFood(it: FoodItem) {
    setEditError(null);
    setEditing({ kind: "food-item", id: it.id });
    setDraft({
      name: it.name,
      amountG: it.amountG != null ? String(Math.round(it.amountG)) : "",
      kcal: String(Math.round(it.kcal)),
      proteinG: n1(it.proteinG),
      carbG: n1(it.carbG),
      fatG: n1(it.fatG),
    });
  }

  function startEditExercise(ex: ExerciseEntry) {
    setEditError(null);
    setEditing({ kind: "exercise", id: ex.id });
    setDraft({
      type: ex.type,
      whenText: ex.whenText ?? "",
      caloriesBurned: String(Math.round(ex.caloriesBurned)),
      note: ex.note ?? "",
    });
  }

  function cancelEdit() {
    setEditing(null);
    setDraft({});
    setEditError(null);
  }

  const toNum = (s: string): number | undefined => {
    if (s.trim() === "") return undefined;
    const v = Number(s);
    return Number.isFinite(v) && v >= 0 ? v : undefined;
  };

  async function saveFoodItem(id: number) {
    const kcal = toNum(draft.kcal);
    const proteinG = toNum(draft.proteinG);
    const carbG = toNum(draft.carbG);
    const fatG = toNum(draft.fatG);
    const name = draft.name?.trim();
    if (!name || kcal == null || proteinG == null || carbG == null || fatG == null) {
      setEditError("Name and non-negative numbers are required (amount may be blank).");
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const res = await api<{ day: DayState }>(`/api/food/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          date,
          name,
          amountG: draft.amountG.trim() === "" ? null : toNum(draft.amountG) ?? null,
          kcal,
          proteinG,
          carbG,
          fatG,
        }),
      });
      onDay(res.day);
      cancelEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function saveExercise(id: number) {
    const caloriesBurned = toNum(draft.caloriesBurned);
    const type = draft.type?.trim();
    if (!type || caloriesBurned == null) {
      setEditError("Type and non-negative calories are required.");
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const res = await api<{ day: DayState }>(`/api/exercise/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          date,
          type,
          whenText: draft.whenText.trim() === "" ? null : draft.whenText.trim(),
          caloriesBurned,
          note: draft.note.trim() === "" ? null : draft.note.trim(),
        }),
      });
      onDay(res.day);
      cancelEdit();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function favoriteFood(it: FoodItem) {
    const key = `food-item-${it.id}`;
    setBusyId(key);
    try {
      await api("/api/favorites/food", {
        method: "POST",
        body: JSON.stringify({
          name: it.name,
          amountG: it.amountG,
          kcal: it.kcal,
          proteinG: it.proteinG,
          carbG: it.carbG,
          fatG: it.fatG,
        }),
      });
      onFavoritesChanged();
      flashStar(key);
    } catch {
      /* non-critical */
    } finally {
      setBusyId(null);
    }
  }

  async function favoriteExercise(ex: ExerciseEntry) {
    const key = `exercise-fav-${ex.id}`;
    setBusyId(key);
    try {
      await api("/api/favorites/exercise", {
        method: "POST",
        body: JSON.stringify({ type: ex.type, caloriesBurned: ex.caloriesBurned }),
      });
      onFavoritesChanged();
      flashStar(key);
    } catch {
      /* non-critical */
    } finally {
      setBusyId(null);
    }
  }

  function flashStar(key: string) {
    setStarred((s) => new Set(s).add(key));
    setTimeout(() => {
      setStarred((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
    }, 1500);
  }

  const hasFood = day.foodEntries.some((e) => e.items.length > 0);
  const over = day.remaining.kcal < 0;

  const numInput = (field: string, w = "w-16") => (
    <input
      type="number"
      inputMode="decimal"
      min={0}
      value={draft[field] ?? ""}
      onChange={(e) => setDraft((d) => ({ ...d, [field]: e.target.value }))}
      className={cn("glass-input px-1.5 py-1 text-right text-sm", w)}
    />
  );

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold">Summary</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">Section 3</span>
      </div>

      {editError && (
        <div className="mb-3 rounded-xl bg-rose-500/15 px-3 py-2 text-sm text-rose-700 dark:text-rose-300">
          {editError}
        </div>
      )}

      {/* The table scrolls within this card on narrow screens. */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <th className="pb-2 pr-2 font-medium">Item</th>
              <th className="pb-2 px-2 text-right font-medium">Amount</th>
              <th className="pb-2 px-2 text-right font-medium">Kcal</th>
              <th className="pb-2 px-2 text-right font-medium">P</th>
              <th className="pb-2 px-2 text-right font-medium">C</th>
              <th className="pb-2 px-2 text-right font-medium">F</th>
              <th className="pb-2 pl-2" />
              <th className="pb-2 pl-1" />
            </tr>
          </thead>
          <tbody>
            {!hasFood && (
              <tr>
                <td
                  colSpan={8}
                  className="py-6 text-center text-slate-400 dark:text-slate-500"
                >
                  No food logged yet — add a photo or description above.
                </td>
              </tr>
            )}

            {day.foodEntries.map((entry, ei) =>
              entry.items.map((it, idx) => {
                const isEditing =
                  editing?.kind === "food-item" && editing.id === it.id;
                return (
                  <tr
                    key={it.id}
                    className={cn(
                      "border-t border-white/30 dark:border-white/5",
                      ei % 2 === 1 && "bg-white/20 dark:bg-white/5",
                    )}
                  >
                    {isEditing ? (
                      <>
                        <td className="py-1.5 pr-2">
                          <input
                            value={draft.name ?? ""}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, name: e.target.value }))
                            }
                            className="glass-input w-full min-w-[8rem] px-1.5 py-1 text-sm"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {numInput("amountG")}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {numInput("kcal")}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {numInput("proteinG", "w-14")}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {numInput("carbG", "w-14")}
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          {numInput("fatG", "w-14")}
                        </td>
                        <td colSpan={2} className="py-1.5 pl-2">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              onClick={() => saveFoodItem(it.id)}
                              loading={saving}
                              className="px-2.5 py-1 text-xs"
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={cancelEdit}
                              disabled={saving}
                              className="px-2.5 py-1 text-xs"
                            >
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
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
                        <td className="py-2 pl-2 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              onClick={() => startEditFood(it)}
                              title="Edit this item"
                              className="rounded-lg px-1.5 py-1 text-slate-400 transition hover:bg-sky-500/15 hover:text-sky-500"
                            >
                              ✎
                            </button>
                            <button
                              type="button"
                              onClick={() => favoriteFood(it)}
                              disabled={busyId === `food-item-${it.id}`}
                              title="Save as favorite"
                              className="rounded-lg px-1.5 py-1 text-slate-400 transition hover:bg-amber-500/15 hover:text-amber-500 disabled:opacity-40"
                            >
                              {starred.has(`food-item-${it.id}`) ? "✓" : "☆"}
                            </button>
                          </div>
                        </td>
                        {idx === 0 && (
                          <td
                            rowSpan={entry.items.length}
                            className="pl-1 text-right align-middle"
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
                      </>
                    )}
                  </tr>
                );
              }),
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
              <td colSpan={2} />
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
              <td colSpan={2} />
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
            {day.exercise.map((ex) => {
              const isEditing =
                editing?.kind === "exercise" && editing.id === ex.id;
              if (isEditing) {
                return (
                  <li
                    key={ex.id}
                    className="rounded-xl bg-white/30 px-3 py-2 text-sm dark:bg-white/5"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        value={draft.type ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, type: e.target.value }))
                        }
                        placeholder="Type"
                        className="glass-input w-32 px-1.5 py-1 text-sm"
                      />
                      <input
                        value={draft.whenText ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({ ...d, whenText: e.target.value }))
                        }
                        placeholder="When (optional)"
                        className="glass-input w-32 px-1.5 py-1 text-sm"
                      />
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        value={draft.caloriesBurned ?? ""}
                        onChange={(e) =>
                          setDraft((d) => ({
                            ...d,
                            caloriesBurned: e.target.value,
                          }))
                        }
                        placeholder="kcal"
                        className="glass-input w-20 px-1.5 py-1 text-right text-sm"
                      />
                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          onClick={() => saveExercise(ex.id)}
                          loading={saving}
                          className="px-2.5 py-1 text-xs"
                        >
                          Save
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={cancelEdit}
                          disabled={saving}
                          className="px-2.5 py-1 text-xs"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              }
              return (
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
                    onClick={() => startEditExercise(ex)}
                    title="Edit"
                    className="rounded-lg px-1.5 text-slate-400 transition hover:text-sky-500"
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => favoriteExercise(ex)}
                    disabled={busyId === `exercise-fav-${ex.id}`}
                    title="Save as favorite"
                    className="rounded-lg px-1.5 text-slate-400 transition hover:text-amber-500 disabled:opacity-40"
                  >
                    {starred.has(`exercise-fav-${ex.id}`) ? "✓" : "☆"}
                  </button>
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
              );
            })}
          </ul>
        )}
      </div>
    </GlassCard>
  );
}
