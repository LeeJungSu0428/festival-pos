import { NextRequest, NextResponse } from "next/server";
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "관리자";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || "슈퍼관리자";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password = body?.password;

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  let role: "admin" | "super" | null = null;
  if (password === SUPER_ADMIN_PASSWORD) role = "super";
  else if (password === ADMIN_PASSWORD) role = "admin";

  if (!role) {
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = await createSessionToken(role);
  const res = NextResponse.json({ ok: true, role });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
