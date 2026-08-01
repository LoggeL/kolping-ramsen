import "server-only";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { requiresPasswordReset } from "./credential-policy";
import { prisma } from "./prisma";

const SESSION_COOKIE = "kolping_session_v4";
const LEGACY_SESSION_COOKIES = [
  "kolping_session",
  "kolping_session_v2",
  "kolping_session_v3",
] as const;
const SESSION_TTL_DAYS = 7;
const SESSION_ISSUER = "kolping-ramsen";
const SESSION_AUDIENCE = "redaktion-v4";

export type SessionPayload = {
  userId: string;
  role: "admin" | "redakteur";
  name: string;
  credentialUpdatedAt: string;
};

function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set in .env (min 32 chars). Generate with: openssl rand -base64 32",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function encryptSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(SESSION_ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_DAYS}d`)
    .sign(getKey());
}

export async function decryptSession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getKey(), {
      algorithms: ["HS256"],
      issuer: SESSION_ISSUER,
      audience: SESSION_AUDIENCE,
    });
    if (
      typeof payload.userId === "string" &&
      typeof payload.name === "string" &&
      typeof payload.credentialUpdatedAt === "string" &&
      (payload.role === "admin" || payload.role === "redakteur")
    ) {
      return {
        userId: payload.userId,
        name: payload.name,
        role: payload.role,
        credentialUpdatedAt: payload.credentialUpdatedAt,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const token = await encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    priority: "high",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  for (const cookie of LEGACY_SESSION_COOKIES) cookieStore.delete(cookie);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await decryptSession(token);
  if (!session) return null;

  // A signed token must not outlive the account or a credential/role change.
  // `updatedAt` changes for password resets and all Prisma-managed user edits.
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (
    !user ||
    requiresPasswordReset(user) ||
    user.updatedAt.toISOString() !== session.credentialUpdatedAt
  ) {
    return null;
  }

  const role = user.role === "admin" ? "admin" : "redakteur";
  return {
    userId: user.id,
    name: user.name,
    role,
    credentialUpdatedAt: user.updatedAt.toISOString(),
  };
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireAdmin(): Promise<SessionPayload> {
  const session = await requireSession();
  if (session.role !== "admin") throw new Error("FORBIDDEN");
  return session;
}
