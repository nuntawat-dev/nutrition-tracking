import { NextResponse } from "next/server";
import { generateJSON } from "@/lib/anthropic";
import { getProfile, getTrends } from "@/lib/data";
import { coachJsonSchema, coachResult } from "@/lib/schemas";
import { coachSystem, coachUser } from "@/lib/prompts";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const raw = Number(body.days) || 7;
  const days = raw >= 30 ? 30 : 7;

  const [trends, profile] = await Promise.all([getTrends(days), getProfile()]);

  if (trends.stats.loggedDays === 0) {
    return NextResponse.json(
      { error: "Nothing logged in this period yet — log a few days first." },
      { status: 400 },
    );
  }

  try {
    const raw = await generateJSON({
      system: coachSystem,
      content: coachUser({
        goal: profile.goal,
        preferences: profile.preferences,
        targets: trends.targets,
        stats: trends.stats,
        days: trends.days,
        series: trends.series,
        weights: trends.weights.map((w) => ({
          date: w.date,
          weightKg: w.weightKg,
        })),
      }),
      schema: coachJsonSchema as unknown as Record<string, unknown>,
      maxTokens: 4000,
    });
    const review = coachResult.parse(raw);
    return NextResponse.json({ review });
  } catch (err) {
    console.error("coach failed:", err);
    return NextResponse.json(
      { error: "Could not generate the review. Please try again." },
      { status: 502 },
    );
  }
}
