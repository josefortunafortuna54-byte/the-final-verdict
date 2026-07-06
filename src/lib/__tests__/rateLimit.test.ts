import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows first call for a key", () => {
    expect(checkRateLimit("test-key", 1000)).toBe(true);
  });

  it("blocks second call within interval", () => {
    expect(checkRateLimit("fast-key", 1000)).toBe(true);
    expect(checkRateLimit("fast-key", 1000)).toBe(false);
  });

  it("allows call after interval has passed", () => {
    vi.useFakeTimers();
    expect(checkRateLimit("timed-key", 1000)).toBe(true);
    vi.advanceTimersByTime(1001);
    expect(checkRateLimit("timed-key", 1000)).toBe(true);
    vi.useRealTimers();
  });

  it("treats different keys independently", () => {
    expect(checkRateLimit("key-a", 1000)).toBe(true);
    expect(checkRateLimit("key-b", 1000)).toBe(true);
    expect(checkRateLimit("key-a", 1000)).toBe(false);
    expect(checkRateLimit("key-b", 1000)).toBe(false);
  });
});
