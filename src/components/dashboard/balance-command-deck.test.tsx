import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BalanceCommandDeck } from "@/components/dashboard/balance-command-deck";

describe("BalanceCommandDeck", () => {
  it("shows over-budget status and debt messaging", () => {
    render(
      <BalanceCommandDeck
        summary={{
          learningLanguageCode: "da",
          learningLanguageLabel: "Danish",
          learningMinutes: 60,
          nonLearningMinutes: 120,
          remainingBudgetMinutes: -60,
          debtMinutes: 60,
          coverageRatio: 0.5,
          status: "over_budget",
        }}
      />, 
    );

    expect(screen.getByText("Over Budget")).toBeInTheDocument();
    expect(screen.getByText(/You owe/)).toBeInTheDocument();
  });

  it("shows within-budget state", () => {
    render(
      <BalanceCommandDeck
        summary={{
          learningLanguageCode: "da",
          learningLanguageLabel: "Danish",
          learningMinutes: 180,
          nonLearningMinutes: 90,
          remainingBudgetMinutes: 90,
          debtMinutes: 0,
          coverageRatio: 2,
          status: "within_budget",
        }}
      />,
    );

    expect(screen.getByText("Within Budget")).toBeInTheDocument();
    expect(screen.getByText(/You can spend/)).toBeInTheDocument();
  });
});
