// ============================================================================
//  JWT session helpers (Edge-safe via `jose`).
//  Sign / verify / read the CMW auth cookie.
// ============================================================================
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "./rbac";

const COOKIE = "cmw_token";
const secret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET || "change-me-in-production");

export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  email: string;
}

/** Create a signed JWT for a user. */
export async function signToken(user: SessionUser, remember = false) {
  const exp = remember ? "30d" : "1d";
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(secret());
}

/** Verify a raw token and return the payload, or null. */
export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

/** Read the current session from the auth cookie (server components / routes). */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function setSessionCookie(token: string, remember: boolean) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE, "", { path: "/", maxAge: 0 });
}

export const AUTH_COOKIE = COOKIE;
