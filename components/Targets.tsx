"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Activity, Goal, Profile, Sex } from "@/lib/types";
import { Banner, Button, Field, GlassCard, Label, Segmented, Toggle } from "./ui";

const ACTIVITY_OPTS: { value: Activity; label: string }[] = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very active" },
];

function toStr(n: number | null): string {
  return n === null || n === undefined ? "" : String(n);
}
function toNum(s: string): number | null {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function Targets({
  profile,
  onChanged,
}: {
  profile: Profile;
  onChanged: (p: Profile) => void;
}) {
  const [tdee, setTdee] = useState(toStr(profile.tdee));
  const [goal, setGoal] = useState<Goal>(profile.goal);
  const [weight, setWeight] = useState(toStr(profile.weightKg));
  const [height, setHeight] = useState(toStr(profile.heightCm));
  const [age, setAge] = useState(toStr(profile.age));
  const [sex, setSex] = useState<Sex | "">(profile.sex ?? "");
  const [activity, setActivity] = useState<Activity>(profile.activity);
  const [preferences, setPreferences] = useState(profile.preferences);

  const [protein, setProtein] = useState(toStr(profile.proteinG));
  const [carb, setCarb] = useState(toStr(profile.carbG));
  const [fat, setFat] = useState(toStr(profile.fatG));

  const [computing, setComputing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reseed the form whenever the persisted profile changes (after a save/compute).
  useEffect(() => {
    setTdee(toStr(profile.tdee));
    setGoal(profile.goal);
    setWeight(toStr(profile.weightKg));
    setHeight(toStr(profile.heightCm));
    setAge(toStr(profile.age));
    setSex(profile.sex ?? "");
    setActivity(profile.activity);
    setPreferences(profile.preferences);
    setProtein(toStr(profile.proteinG));
    setCarb(toStr(profile.carbG));
    setFat(toStr(profile.fatG));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.updatedAt]);

  const p = toNum(protein) ?? 0;
  const c = toNum(carb) ?? 0;
  const f = toNum(fat) ?? 0;
  const derivedCalories = Math.round(p * 4 + c * 4 + f * 9);

  async function compute() {
    setError(null);
    setComputing(true);
    try {
      const res = await api<{ profile: Profile }>("/api/targets/compute", {
        method: "POST",
        body: JSON.stringify({
          tdee: toNum(tdee),
          goal,
          weightKg: toNum(weight),
          heightCm: toNum(height),
          age: toNum(age),
          sex: sex || null,
          activity,
          preferences,
        }),
      });
      onChanged(res.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setComputing(false);
    }
  }

  async function saveMacros() {
    setError(null);
    setSaving(true);
    try {
      const updated = await api<Profile>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({
          proteinG: p,
          carbG: c,
          fatG: f,
          targetCalories: derivedCalories,
        }),
      });
      onChanged(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleExerciseBack(v: boolean) {
    try {
      const updated = await api<Profile>("/api/profile", {
        method: "PUT",
        body: JSON.stringify({ addExerciseBack: v }),
      });
      onChanged(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <GlassCard>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-semibold">Profile &amp; targets</h2>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Section 1
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="TDEE (maintenance kcal)">
          <input
            className="glass-input"
            inputMode="numeric"
            placeholder="e.g. 2400"
            value={tdee}
            onChange={(e) => setTdee(e.target.value)}
          />
        </Field>
        <div>
          <Label>Goal</Label>
          <Segmented
            value={goal}
            onChange={setGoal}
            options={[
              { value: "cut", label: "Cut" },
              { value: "maintain", label: "Maintain" },
              { value: "bulk", label: "Bulk" },
            ]}
          />
        </div>
        <Field label="Weight (kg)">
          <input
            className="glass-input"
            inputMode="decimal"
            placeholder="e.g. 72"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
          />
        </Field>
        <Field label="Height (cm)">
          <input
            className="glass-input"
            inputMode="numeric"
            placeholder="e.g. 175"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </Field>
        <Field label="Age">
          <input
            className="glass-input"
            inputMode="numeric"
            placeholder="e.g. 30"
            value={age}
            onChange={(e) => setAge(e.target.value)}
          />
        </Field>
        <div>
          <Label>Sex</Label>
          <Segmented
            value={sex || "male"}
            onChange={(v) => setSex(v)}
            options={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
          />
        </div>
        <div className="sm:col-span-2">
          <Label>Activity level</Label>
          <Segmented value={activity} onChange={setActivity} options={ACTIVITY_OPTS} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Dietary preferences / notes">
            <textarea
              className="glass-input min-h-[64px] resize-y"
              placeholder="e.g. vegetarian, no dairy, prefer high protein"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="mt-4">
        <Button onClick={compute} loading={computing}>
          ✨ Calculate targets with AI
        </Button>
      </div>

      {profile.rationale && (
        <p className="mt-3 rounded-xl bg-white/40 px-3 py-2 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
          {profile.rationale}
        </p>
      )}

      {/* Editable macro targets */}
      <div className="mt-5 border-t border-white/40 pt-5 dark:border-white/10">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold">Daily targets (editable)</h3>
          <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">
            = <span className="font-semibold text-cal">{derivedCalories}</span> kcal
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Protein (g)">
            <input
              className="glass-input"
              inputMode="numeric"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
            />
          </Field>
          <Field label="Carbs (g)">
            <input
              className="glass-input"
              inputMode="numeric"
              value={carb}
              onChange={(e) => setCarb(e.target.value)}
            />
          </Field>
          <Field label="Fat (g)">
            <input
              className="glass-input"
              inputMode="numeric"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Toggle
            checked={profile.addExerciseBack}
            onChange={toggleExerciseBack}
            label="Add exercise calories back to budget"
          />
          <Button variant="ghost" onClick={saveMacros} loading={saving}>
            Save targets
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-3">
          <Banner kind="error">{error}</Banner>
        </div>
      )}
    </GlassCard>
  );
}
