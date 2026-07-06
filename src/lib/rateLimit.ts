const limits = new Map<string, number>();

export function checkRateLimit(key: string, minIntervalMs: number): boolean {
  const now = Date.now();
  const last = limits.get(key) ?? 0;
  if (now - last < minIntervalMs) return false;
  limits.set(key, now);
  return true;
}
