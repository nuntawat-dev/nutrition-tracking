import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { computeDay } from "@/lib/data";
import { isValidDate, serverToday } from "@/lib/date";
import { suggestJsonSchema, suggestResult } from "@/lib/schemas";
import { suggestSystem, suggestUser } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    date?: string;
    localTime?: string;
  };
  const date = isValidDate(body.date) ? body.date : serverToday();
  const localTime = typeof body.localTime === "string" ? body.localTime : "unknown";

  try {
    const day = await computeDay(date);
    if (!day.profile.targetCalories) {
      return NextResponse.json(
        { error: "Set your daily targets first (Section 1)." },
        { status: 400 },
      );
    }

    const raw = await generateJSON({
      system: suggestSystem,
      content: suggestUser({
        remaining: day.remaining,
        targets: day.targets,
        consumed: day.consumed,
        preferences: day.profile.preferences,
        localTime,
      }),
      schema: suggestJsonSchema as unknown as Record<string, unknown>,
      maxTokens: 1536,
    });
    const parsed = suggestResult.parse(raw);
    return NextResponse.json({ suggestions: parsed.suggestions });
  } catch (err) {
    console.error("suggest failed:", err);
    return NextResponse.json(
      { error: "Could not generate a suggestion. Please try again." },
      { status: 502 },
    );
  }
}
