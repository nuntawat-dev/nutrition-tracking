import { NextResponse } from "next/server";
import { getProfile, updateProfile, type ProfilePatch } from "@/lib/data";
import type { Activity, Goal, Sex } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getProfile());
}

const GOALS: Goal[] = ["cut", "maintain", "bulk"];
const SEXES: Sex[] = ["male", "female"];
const ACTIVITIES: Activity[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
  "very_active",
];

const numOrNull = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function PUT(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const patch: ProfilePatch = {};

  if ("tdee" in body) patch.tdee = numOrNull(body.tdee);
  if ("weightKg" in body) patch.weightKg = numOrNull(body.weightKg);
  if ("heightCm" in body) patch.heightCm = numOrNull(body.heightCm);
  if ("age" in body) patch.age = numOrNull(body.age);
  if ("targetCalories" in body) patch.targetCalories = numOrNull(body.targetCalories);
  if ("proteinG" in body) patch.proteinG = numOrNull(body.proteinG);
  if ("carbG" in body) patch.carbG = numOrNull(body.carbG);
  if ("fatG" in body) patch.fatG = numOrNull(body.fatG);
  if ("preferences" in body) patch.preferences = String(body.preferences ?? "");
  if ("addExerciseBack" in body) patch.addExerciseBack = Boolean(body.addExerciseBack);
  if ("goal" in body && GOALS.includes(body.goal as Goal)) patch.goal = body.goal as Goal;
  if ("sex" in body && SEXES.includes(body.sex as Sex)) patch.sex = body.sex as Sex;
  if ("activity" in body && ACTIVITIES.includes(body.activity as Activity)) {
    patch.activity = body.activity as Activity;
  }

  const profile = await updateProfile(patch);
  return NextResponse.json(profile);
}
