import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "node:crypto";

const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET || "dev-secret-change-me-please-32bytes!"
);

const COOKIE = "nezuko_session";
const CODE_COOKIE = "nezuko_code";
const SESSION_TTL_SECS = 60 * 60 * 24 * 7;
const RENEW_IF_OLDER_THAN_SECS = 60 * 60 * 24;

export function generateCode(): string {
  const digits = Array.from(crypto.randomBytes(16))
    .map((b) => (b % 10).toString())
    .join("");
  return digits.match(/.{4}/g)!.join("-");
}

export function normalizeCode(input: string): string {
  return input.replace(/\D/g, "").slice(0, 16);
}

export function hashCode(code: string): string {
  const digits = normalizeCode(code);
  const pepper = process.env.CODE_PEPPER || "nezuko-pepper";
  return crypto.createHash("sha256").update(digits + ":" + pepper).digest("hex");
}

async function signSessionToken(userId: string) {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECS}s`)
    .sign(secret);
}

function writeSessionCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECS,
  });
}

export async function createSession(userId: string) {
  const token = await signSessionToken(userId);
  writeSessionCookie(token);
}

export async function getSession(): Promise<{ uid: string } | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const uid = String(payload.uid);
    const iat = Number(payload.iat) || 0;
    const ageSecs = Math.floor(Date.now() / 1000) - iat;
    if (ageSecs > RENEW_IF_OLDER_THAN_SECS) {
      try {
        const fresh = await signSessionToken(uid);
        writeSessionCookie(fresh);
        const code = cookies().get(CODE_COOKIE)?.value;
        if (code) setCodeRecoveryCookie(code);
      } catch {}
    }
    return { uid };
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().delete(COOKIE);
  cookies().delete(CODE_COOKIE);
}

export function setCodeRecoveryCookie(code: string) {
  cookies().set(CODE_COOKIE, normalizeCode(code), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECS,
  });
}
