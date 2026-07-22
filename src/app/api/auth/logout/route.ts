import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { destroySessionByToken, SESSION_COOKIE, clearSessionCookie } from "../../../../lib/session";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await destroySessionByToken(token);
  }
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
