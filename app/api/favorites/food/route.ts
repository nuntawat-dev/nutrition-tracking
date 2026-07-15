import { NextResponse } from "next/server";
import { addFoodFavorite, getFoodFavorites } from "@/lib/data";
import { foodFavoriteCreateSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getFoodFavorites());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = foodFavoriteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid favorite" },
      { status: 400 },
    );
  }
  return NextResponse.json(await addFoodFavorite(parsed.data));
}
