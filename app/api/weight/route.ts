import { NextResponse } from "next/server";
import { getWeightEntries, logWeight } from "@/lib/data";
import { isValidDate, serverToday } from "@/lib/date";
import { weightLogSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const days = Math.min(
    Math.max(Number(url.searchParams.get("days")) || 90, 1),
    365,
  );
  return NextResponse.json(await getWeightEntries(days));
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = weightLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid weight" },
      { status: 400 },
    );
  }
  const date = isValidDate(parsed.data.date) ? parsed.data.date : serverToday();
  const entry = await logWeight(date, parsed.data.weightKg);
  return NextResponse.json(entry);
}
