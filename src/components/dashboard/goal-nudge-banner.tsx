"use client";

import { Sparkles, TriangleAlert } from "lucide-react";
import { formatMinutes } from "@/lib/format";

type GoalNudgeBannerProps = {
  debtMinutes: number;
  learningLanguageLabel: string;
};

export const GoalNudgeBanner = ({
  debtMinutes,
  learningLanguageLabel,
}: GoalNudgeBannerProps) => {
  if (debtMinutes <= 0) {
    return (
      <div className="rounded-xl border border-[var(--color-learning)]/50 bg-[var(--color-learning)]/10 p-3 text-sm text-[var(--color-text-primary)]">
        <p className="flex items-center gap-2 font-medium">
          <Sparkles className="size-4 text-[var(--color-learning)]" />
          You are balanced. Keep feeding your {learningLanguageLabel} minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-danger)]/60 bg-[var(--color-danger)]/15 p-3 text-sm text-[var(--color-text-primary)]">
      <p className="flex items-center gap-2 font-medium">
        <TriangleAlert className="size-4 text-[var(--color-danger)]" />
        Add {formatMinutes(debtMinutes)} in {learningLanguageLabel} to clear debt.
      </p>
    </div>
  );
};
