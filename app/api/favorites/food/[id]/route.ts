import { NextResponse } from "next/server";
import { deleteFoodFavorite } from "@/lib/data";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const n = Number(id);
  if (!Number.isInteger(n)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  await deleteFoodFavorite(n);
  return NextResponse.json({ ok: true });
}
