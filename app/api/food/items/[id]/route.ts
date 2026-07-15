import { NextResponse } from "next/server";
import { computeDay, updateFoodItem } from "@/lib/data";
import { isValidDate, serverToday } from "@/lib/date";
import { foodItemPatchSchema } from "@/lib/schemas";

export const runtime = "nodejs";

// [id] here is food_items.id — unlike /api/food/[id], where it is the entry id.
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { date: rawDate, ...rest } = body;
  const parsed = foodItemPatchSchema.safeParse(rest);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid patch" },
      { status: 400 },
    );
  }

  const date = isValidDate(rawDate) ? rawDate : serverToday();
  await updateFoodItem(n, parsed.data);
  return NextResponse.json({ day: await computeDay(date) });
}
