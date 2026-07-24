import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "node:crypto";

const ADMIN_COOKIE = "nezuko_admin_session";
const ADMIN_SESSION_TTL_SECS = 60 * 60 * 8;

function secretKey() {
  const raw = process.env.ADMIN_SESSION_SECRET;
  if (!raw) throw new Error("ADMIN_SESSION_SECRET not set");
  return new TextEncoder().encode(raw);
}

function timingSafeEqualBuf(a: Buffer, b: Buffer): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// Stored format: "scrypt:<saltHex>:<hashHex>"
export function hashAdminPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyAdminPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) return false;
  const parts = stored.split(":");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  try {
    const salt = Buffer.from(parts[1], "hex");
    const expected = Buffer.from(parts[2], "hex");
    const provided = crypto.scryptSync(password, salt, expected.length);
    return timingSafeEqualBuf(provided, expected);
  } catch {
    return false;
  }
}

async function signAdminToken() {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_SESSION_TTL_SECS}s`)
    .sign(secretKey());
}

export async function createAdminSession() {
  const token = await signAdminToken();
  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECS,
  });
}

export async function getAdminSession(): Promise<{ ok: true } | null> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.role !== "admin") return null;
    return { ok: true };
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  cookies().delete(ADMIN_COOKIE);
}
