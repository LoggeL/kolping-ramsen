export const DEFAULT_SITE_URL = "https://kolping-ramsen.logge.top";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Resolve the public origin used for canonical metadata, feeds and sitemaps.
 * A broken production value should fail during build instead of publishing
 * misleading URLs to search engines and calendar clients.
 */
export function resolveSiteUrl(value: string | undefined): string {
  const configured = value?.trim();
  if (!configured) return DEFAULT_SITE_URL;

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an absolute URL");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https");
  }
  if (url.protocol === "http:" && !LOCAL_HOSTNAMES.has(url.hostname)) {
    throw new Error("NEXT_PUBLIC_SITE_URL must use https outside local development");
  }
  if (url.username || url.password) {
    throw new Error("NEXT_PUBLIC_SITE_URL must not include credentials");
  }
  if (url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must contain only an origin");
  }

  return url.origin;
}

export const SITE_URL = resolveSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
