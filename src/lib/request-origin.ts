export function hasExactOrigin(request: Request, expectedOrigin: string): boolean {
  const rawOrigin = request.headers.get("origin");
  if (!rawOrigin) return false;
  try {
    const parsed = new URL(rawOrigin);
    return rawOrigin === parsed.origin && parsed.origin === expectedOrigin;
  } catch {
    return false;
  }
}
