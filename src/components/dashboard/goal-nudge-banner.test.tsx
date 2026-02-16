import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GoalNudgeBanner } from "@/components/dashboard/goal-nudge-banner";

describe("GoalNudgeBanner", () => {
  it("shows encouragement when debt is cleared", () => {
    render(<GoalNudgeBanner debtMinutes={0} learningLanguageLabel="Danish" />);

    expect(screen.getByText(/You are balanced/)).toBeInTheDocument();
  });

  it("shows debt warning when over budget", () => {
    render(<GoalNudgeBanner debtMinutes={45} learningLanguageLabel="Danish" />);

    expect(screen.getByText(/Add 45m in Danish to clear debt/)).toBeInTheDocument();
  });
});
