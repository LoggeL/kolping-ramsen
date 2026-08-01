import { isIP } from "node:net";

type HeaderReader = {
  get(name: string): string | null;
};

export const UNKNOWN_CLIENT_IP = "unknown";
export const DEFAULT_TRUSTED_PROXY_HOPS = 1;

export function parseTrustedProxyHops(value: string | undefined): number {
  const normalized = value?.trim();
  if (!normalized) return DEFAULT_TRUSTED_PROXY_HOPS;
  if (!/^\d+$/.test(normalized)) return DEFAULT_TRUSTED_PROXY_HOPS;

  const hops = Number(normalized);
  return hops >= 0 && hops <= 10 ? hops : DEFAULT_TRUSTED_PROXY_HOPS;
}

/**
 * Select the client immediately before the configured number of trusted
 * reverse proxies. Reading from the right prevents a caller-supplied first
 * X-Forwarded-For value from creating arbitrary rate-limit identities.
 */
export function getClientIp(
  headers: HeaderReader,
  trustedProxyHops = parseTrustedProxyHops(process.env.TRUSTED_PROXY_HOPS),
): string {
  if (trustedProxyHops === 0) return UNKNOWN_CLIENT_IP;

  const chain = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!chain || chain.length < trustedProxyHops) return UNKNOWN_CLIENT_IP;

  const candidate = chain[chain.length - trustedProxyHops];
  return candidate && isIP(candidate) ? candidate.toLowerCase() : UNKNOWN_CLIENT_IP;
}

export function rateLimitKey(
  scope: string,
  headers: HeaderReader,
  trustedProxyHops?: number,
): string {
  return `${scope}:${getClientIp(headers, trustedProxyHops)}`;
}
