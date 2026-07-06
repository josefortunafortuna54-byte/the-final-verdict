import { describe, it, expect } from "vitest";
import { generateScorecard, CRITERIA } from "@/lib/battleScoring";

describe("generateScorecard", () => {
  it("returns a scorecard with 3 rounds", () => {
    const result = generateScorecard("test-battle-1", 75, 75);
    expect(result.rounds).toHaveLength(3);
  });

  it("returns deterministic results for the same battle ID", () => {
    const a = generateScorecard("deterministic-test", 80, 70);
    const b = generateScorecard("deterministic-test", 80, 70);
    expect(a).toEqual(b);
  });

  it("returns different results for different battle IDs", () => {
    const a = generateScorecard("battle-1", 75, 75);
    const b = generateScorecard("battle-2", 75, 75);
    expect(a).not.toEqual(b);
  });

  it("scores each criterion between 60 and 98", () => {
    const result = generateScorecard("range-test", 75, 75);
    for (const round of result.rounds) {
      for (const criterion of CRITERIA) {
        expect(round.a[criterion.key]).toBeGreaterThanOrEqual(60);
        expect(round.a[criterion.key]).toBeLessThanOrEqual(98);
        expect(round.b[criterion.key]).toBeGreaterThanOrEqual(60);
        expect(round.b[criterion.key]).toBeLessThanOrEqual(98);
      }
    }
  });

  it("determines a winner side", () => {
    const result = generateScorecard("winner-test", 75, 75);
    expect(["A", "B"]).toContain(result.winnerSide);
  });

  it("applies energy bias correctly", () => {
    const highEnergy = generateScorecard("energy-bias", 100, 50);
    const lowEnergy = generateScorecard("energy-bias", 50, 100);
    expect(highEnergy.winnerSide).toBe("A");
    expect(lowEnergy.winnerSide).toBe("B");
  });

  it("applies reaction bonus to final score", () => {
    const withBonus = generateScorecard("bonus-test", 75, 75, 15, 0);
    const noBonus = generateScorecard("bonus-test", 75, 75, 0, 0);
    expect(withBonus.finalA).toBeGreaterThan(noBonus.finalA);
    expect(withBonus.finalB).toBe(noBonus.finalB);
  });

  it("handles zero energy gracefully", () => {
    const result = generateScorecard("zero-energy", 0, 0);
    expect(result.finalA).toBeGreaterThanOrEqual(0);
    expect(result.finalB).toBeGreaterThanOrEqual(0);
  });

  it("caps energy at 100", () => {
    const result = generateScorecard("max-energy", 200, 200);
    expect(CRITERIA.every((c) => result.rounds[0].a[c.key] <= 98)).toBe(true);
  });
});
