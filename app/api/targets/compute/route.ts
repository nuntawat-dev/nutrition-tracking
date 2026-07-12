import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { updateProfile } from "@/lib/data";
import { targetsJsonSchema, targetsResult } from "@/lib/schemas";
import { targetsSystem, targetsUser } from "@/lib/prompts";
import type { Activity, Goal, Sex } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const GOALS: Goal[] = ["cut", "maintain", "bulk"];
const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const tdee = numOrNull(body.tdee);
  if (tdee === null || tdee <= 0) {
    return NextResponse.json(
      { error: "Please enter your TDEE (a positive number) first." },
      { status: 400 },
    );
  }
  const goal = (GOALS.includes(body.goal as Goal) ? body.goal : "maintain") as Goal;
  const weightKg = numOrNull(body.weightKg);
  const heightCm = numOrNull(body.heightCm);
  const age = numOrNull(body.age);
  const sex = (body.sex as Sex | null) ?? null;
  const activity = (body.activity as Activity) ?? "moderate";
  const preferences = String(body.preferences ?? "");

  // Persist the inputs the user just entered.
  await updateProfile({ tdee, goal, weightKg, heightCm, age, sex, activity, preferences });

  try {
    const raw = await generateJSON({
      system: targetsSystem,
      content: targetsUser({ tdee, goal, weightKg, heightCm, age, sex, activity, preferences }),
      schema: targetsJsonSchema as unknown as Record<string, unknown>,
      maxTokens: 1024,
    });
    const t = targetsResult.parse(raw);
    const profile = await updateProfile({
      targetCalories: Math.round(t.targetCalories),
      proteinG: Math.round(t.proteinG),
      carbG: Math.round(t.carbG),
      fatG: Math.round(t.fatG),
      rationale: t.rationale,
    });
    return NextResponse.json({ profile });
  } catch (err) {
    console.error("targets/compute failed:", err);
    return NextResponse.json(
      { error: "Could not compute targets. Please try again." },
      { status: 502 },
    );
  }
}
