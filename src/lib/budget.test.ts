import { describe, expect, it } from "vitest";
import { calculateBudgetSummary } from "@/lib/budget";

describe("calculateBudgetSummary", () => {
  it("returns within budget when learning minutes exceed non-learning minutes", () => {
    const result = calculateBudgetSummary({
      learningMinutes: 180,
      nonLearningMinutes: 120,
    });

    expect(result.status).toBe("within_budget");
    expect(result.remainingBudgetMinutes).toBe(60);
    expect(result.debtMinutes).toBe(0);
  });

  it("returns over budget with debt when non-learning exceeds learning", () => {
    const result = calculateBudgetSummary({
      learningMinutes: 90,
      nonLearningMinutes: 135,
    });

    expect(result.status).toBe("over_budget");
    expect(result.remainingBudgetMinutes).toBe(-45);
    expect(result.debtMinutes).toBe(45);
    expect(result.coverageRatio).toBe(0.67);
  });

  it("handles empty tracking history", () => {
    const result = calculateBudgetSummary({
      learningMinutes: 0,
      nonLearningMinutes: 0,
    });

    expect(result.status).toBe("within_budget");
    expect(result.coverageRatio).toBe(0);
    expect(result.remainingBudgetMinutes).toBe(0);
  });
});
