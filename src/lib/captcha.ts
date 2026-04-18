import crypto from "node:crypto";

const SECRET = process.env.SESSION_SECRET ?? "dev-secret-change-me";
const MAX_AGE_MS = 15 * 60 * 1000;

type Captcha = { a: number; b: number; token: string; question: string };

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function newCaptcha(): Captcha {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  const expiresAt = Date.now() + MAX_AGE_MS;
  const payload = `${a}:${b}:${expiresAt}`;
  const sig = sign(payload);
  return {
    a,
    b,
    token: `${payload}.${sig}`,
    question: `Wieviel ist ${a} + ${b}?`,
  };
}

export function verifyCaptcha(token: string, answer: string): boolean {
  if (!token || !answer) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload);
  // timing-safe compare
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;
  if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;

  const [aStr, bStr, expStr] = payload.split(":");
  const expiresAt = Number(expStr);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return false;

  const parsed = Number.parseInt(answer.trim(), 10);
  if (!Number.isFinite(parsed)) return false;
  return parsed === Number(aStr) + Number(bStr);
}
