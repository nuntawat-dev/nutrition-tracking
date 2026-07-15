import { NextResponse } from "next/server";
import { getTrends } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = Number(url.searchParams.get("days")) || 7;
  const days = raw >= 30 ? 30 : 7; // only 7 and 30 are supported views
  return NextResponse.json(await getTrends(days));
}
