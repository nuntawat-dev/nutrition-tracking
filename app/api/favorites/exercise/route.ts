import { NextResponse } from "next/server";
import { addExerciseFavorite, getExerciseFavorites } from "@/lib/data";
import { exerciseFavoriteCreateSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getExerciseFavorites());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = exerciseFavoriteCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid favorite" },
      { status: 400 },
    );
  }
  return NextResponse.json(await addExerciseFavorite(parsed.data));
}
