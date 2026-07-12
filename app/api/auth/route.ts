import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    password?: string;
  };
  const session = await getSession();

  if (body.action === "logout") {
    session.destroy();
    return NextResponse.json({ ok: true });
  }

  const expected = process.env.APP_PASSWORD ?? "";
  if (!expected) {
    return NextResponse.json(
      { error: "APP_PASSWORD is not configured on the server." },
      { status: 500 },
    );
  }
  if (String(body.password ?? "") !== expected) {
    return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
  }

  session.loggedIn = true;
  await session.save();
  return NextResponse.json({ ok: true });
}
