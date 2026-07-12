import { NextResponse } from "next/server";
import { computeDay } from "@/lib/data";
import { isValidDate, serverToday } from "@/lib/date";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const date = isValidDate(dateParam) ? dateParam : serverToday();
  return NextResponse.json(await computeDay(date));
}
