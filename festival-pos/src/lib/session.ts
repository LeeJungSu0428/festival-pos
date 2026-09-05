export type Role = "admin" | "super";

export const SESSION_COOKIE = "festival_session";

const MAX_AGE_MS = 1000 * 60 * 60 * 12; // 12시간
export const SESSION_MAX_AGE_SECONDS = MAX_AGE_MS / 1000;

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function getKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET || "change-this-secret-in-production";
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/**
 * 서명된 세션 토큰을 만든다. 형식: `${role}.${timestamp}.${hmac}`
 * 서버에 세션 상태를 저장하지 않고, 쿠키 값 자체를 검증하는 방식(stateless).
 */
export async function createSessionToken(role: Role): Promise<string> {
  const payload = `${role}.${Date.now()}`;
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function verifySessionValue(value: string | undefined | null): Promise<Role | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [role, ts, sig] = parts;
  if (role !== "admin" && role !== "super") return null;

  const timestamp = Number(ts);
  if (!Number.isFinite(timestamp)) return null;
  if (Date.now() - timestamp > MAX_AGE_MS) return null;

  const key = await getKey();
  const expected = toHex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${role}.${ts}`)));
  if (expected !== sig) return null;

  return role;
}

/** API 라우트/미들웨어에서: 요청의 쿠키 헤더로부터 역할을 읽는다. */
export async function getRoleFromRequest(req: Request): Promise<Role | null> {
  const cookieHeader = req.headers.get("cookie") || "";
  const target = cookieHeader
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`));
  if (!target) return null;
  const value = decodeURIComponent(target.slice(SESSION_COOKIE.length + 1));
  return verifySessionValue(value);
}

/** 서버 컴포넌트에서: next/headers의 cookies()로부터 역할을 읽는다. */
export async function getRoleFromCookies(): Promise<Role | null> {
  const { cookies } = await import("next/headers");
  const store = cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return verifySessionValue(value);
}
