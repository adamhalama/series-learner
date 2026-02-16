import { describe, expect, it } from "vitest";
import { computeTitleTotals, resolveUnitMinutes } from "@/lib/tracking";

describe("resolveUnitMinutes", () => {
  it("requires minutes when no explicit or fallback value exists", () => {
    expect(() =>
      resolveUnitMinutes({
        explicitUnitMinutes: undefined,
        fallbackUnitMinutes: undefined,
      }),
    ).toThrow(/required/);
  });

  it("uses fallback value when explicit value is missing", () => {
    const value = resolveUnitMinutes({
      explicitUnitMinutes: undefined,
      fallbackUnitMinutes: 30,
    });

    expect(value).toBe(30);
  });

  it("prefers explicit value over fallback and validates bounds", () => {
    const value = resolveUnitMinutes({
      explicitUnitMinutes: 45,
      fallbackUnitMinutes: 30,
    });

    expect(value).toBe(45);
  });
});

describe("computeTitleTotals", () => {
  it("sums units and minutes from watch logs", () => {
    const totals = computeTitleTotals([
      { units: 1, totalMinutes: 30 },
      { units: 2, totalMinutes: 90 },
    ]);

    expect(totals).toEqual({
      totalUnits: 3,
      totalMinutes: 120,
    });
  });
});
