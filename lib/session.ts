import type { SessionOptions } from "iron-session";
import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  loggedIn?: boolean;
}

export function sessionOptions(): SessionOptions {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set and at least 32 characters long.",
    );
  }
  return {
    password,
    cookieName: "ntapp_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

/** Route-handler / server-component session (reads the Next cookie store). */
export async function getSession(): Promise<IronSession<SessionData>> {
  const store = await cookies();
  return getIronSession<SessionData>(store, sessionOptions());
}
