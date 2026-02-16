import type { BudgetStatus } from "@/lib/types";

export type BudgetInput = {
  learningMinutes: number;
  nonLearningMinutes: number;
};

export type BudgetResult = {
  learningMinutes: number;
  nonLearningMinutes: number;
  remainingBudgetMinutes: number;
  debtMinutes: number;
  coverageRatio: number;
  status: BudgetStatus;
};

export const calculateBudgetSummary = ({
  learningMinutes,
  nonLearningMinutes,
}: BudgetInput): BudgetResult => {
  const safeLearning = Math.max(0, Math.round(learningMinutes));
  const safeNonLearning = Math.max(0, Math.round(nonLearningMinutes));

  const remainingBudgetMinutes = safeLearning - safeNonLearning;
  const debtMinutes = Math.max(0, safeNonLearning - safeLearning);

  const coverageRatio =
    safeNonLearning === 0
      ? safeLearning > 0
        ? 1
        : 0
      : Number((safeLearning / safeNonLearning).toFixed(2));

  return {
    learningMinutes: safeLearning,
    nonLearningMinutes: safeNonLearning,
    remainingBudgetMinutes,
    debtMinutes,
    coverageRatio,
    status: debtMinutes > 0 ? "over_budget" : "within_budget",
  };
};
