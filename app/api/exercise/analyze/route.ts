import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { addExerciseEntry, computeDay, getProfile } from "@/lib/data";
import { isValidDate, serverToday } from "@/lib/date";
import { exerciseJsonSchema, exerciseResult } from "@/lib/schemas";
import { exerciseSystem, exerciseUser } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    date?: string;
    text?: string;
  };

  const date = isValidDate(body.date) ? body.date : serverToday();
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return NextResponse.json(
      { error: "Describe the exercise (type, when, and calories if you know them)." },
      { status: 400 },
    );
  }

  try {
    const profile = await getProfile();
    const raw = await generateJSON({
      system: exerciseSystem,
      content: exerciseUser(text, profile.weightKg),
      schema: exerciseJsonSchema as unknown as Record<string, unknown>,
      maxTokens: 512,
    });
    const ex = exerciseResult.parse(raw);

    await addExerciseEntry({
      date,
      type: ex.type,
      whenText: ex.whenText || null,
      caloriesBurned: Math.max(0, ex.caloriesBurned),
      note: ex.note || null,
    });

    const day = await computeDay(date);
    return NextResponse.json({ day });
  } catch (err) {
    console.error("exercise/analyze failed:", err);
    return NextResponse.json(
      { error: "Could not log the exercise. Please try again." },
      { status: 502 },
    );
  }
}
