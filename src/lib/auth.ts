import "server-only";
import bcrypt from "bcryptjs";
import { createHash, timingSafeEqual } from "node:crypto";
import { prisma } from "./prisma";

// SHA-256 fingerprints of passwords that were previously published with this
// repository. Keeping fingerprints (rather than the plaintext values) lets us
// reject compromised credentials without shipping another usable password.
const REVOKED_PASSWORD_DIGESTS = [
  "0c9ad49edbc870c0897d394e6c501a244afd09d89de7809d4a069626d8ac683d",
] as const;

// The original production account was created from the publicly committed
// bootstrap database. Reject that account until its password has actually
// been rotated. Prisma updates `updatedAt` when `admin:reset` changes the
// password, so the lock releases without a separate feature flag.
const COMPROMISED_ACCOUNT_EMAIL = "admin@kolping-ramsen.de";
const COMPROMISED_ACCOUNT_CUTOFF = new Date("2026-08-01T15:10:00.000Z");

function passwordDigest(password: string): Buffer {
  return createHash("sha256").update(password, "utf8").digest();
}

export function isRevokedPassword(password: string): boolean {
  const digest = passwordDigest(password);
  return REVOKED_PASSWORD_DIGESTS.some((candidate) =>
    timingSafeEqual(digest, Buffer.from(candidate, "hex")),
  );
}

export function requiresPasswordReset(user: {
  email: string;
  updatedAt: Date;
}): boolean {
  return (
    user.email.toLowerCase() === COMPROMISED_ACCOUNT_EMAIL &&
    user.updatedAt < COMPROMISED_ACCOUNT_CUTOFF
  );
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function authenticate(email: string, password: string) {
  if (isRevokedPassword(password)) return null;

  const user = await findUserByEmail(email);
  if (!user) {
    // Perform a real bcrypt comparison to reduce account-enumeration timing
    // differences without ever accepting this sentinel hash.
    await bcrypt.compare(
      password,
      "$2b$12$1cGkh4WMJqxO3UURnda.p.9bbFijSpPLOqXy8z6cpTkV0/lvMigra",
    );
    return null;
  }
  if (requiresPasswordReset(user)) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return user;
}
