import { NextResponse } from "next/server";
import { computeDay, logExerciseFavorite } from "@/lib/data";
import { isValidDate, serverToday } from "@/lib/date";
import { favoriteLogBodySchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = favoriteLogBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const date = isValidDate(parsed.data.date) ? parsed.data.date : serverToday();
  const found = await logExerciseFavorite(n, date);
  if (!found) {
    return NextResponse.json({ error: "Favorite not found" }, { status: 404 });
  }
  return NextResponse.json({ day: await computeDay(date) });
}
