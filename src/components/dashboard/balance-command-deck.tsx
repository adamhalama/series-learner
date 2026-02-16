"use client";

import { AlertTriangle, Gauge, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatHoursDecimal, formatMinutes, formatRatio } from "@/lib/format";
import type { BalanceSummary } from "@/lib/types";

type BalanceCommandDeckProps = {
  summary: BalanceSummary;
};

export const BalanceCommandDeck = ({ summary }: BalanceCommandDeckProps) => {
  const consumedPercentage =
    summary.learningMinutes === 0
      ? summary.nonLearningMinutes > 0
        ? 100
        : 0
      : Math.min(100, Math.round((summary.nonLearningMinutes / summary.learningMinutes) * 100));

  const isOverBudget = summary.status === "over_budget";

  return (
    <Card className="panel-card relative overflow-hidden">
      <div className="scanline" aria-hidden />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-3 font-display text-xl tracking-wider sm:text-2xl">
          <span className="flex items-center gap-2">
            <Gauge className="size-6 text-[var(--color-signal)]" />
            Balance Deck
          </span>
          <Badge
            className={
              isOverBudget
                ? "bg-[var(--color-danger)] text-black"
                : "bg-[var(--color-learning)] text-black"
            }
          >
            {isOverBudget ? "Over Budget" : "Within Budget"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="meter-block">
            <p className="meter-label">Learning</p>
            <p className="meter-value">{formatMinutes(summary.learningMinutes)}</p>
          </div>
          <div className="meter-block">
            <p className="meter-label">Non-Learning</p>
            <p className="meter-value">{formatMinutes(summary.nonLearningMinutes)}</p>
          </div>
          <div className="meter-block">
            <p className="meter-label">Coverage</p>
            <p className="meter-value">{formatRatio(summary.coverageRatio)}x</p>
          </div>
          <div className="meter-block">
            <p className="meter-label">Remaining</p>
            <p
              className={`meter-value ${
                summary.remainingBudgetMinutes < 0
                  ? "text-[var(--color-danger)]"
                  : "text-[var(--color-learning)]"
              }`}
            >
              {summary.remainingBudgetMinutes < 0
                ? `-${formatMinutes(Math.abs(summary.remainingBudgetMinutes))}`
                : formatMinutes(summary.remainingBudgetMinutes)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
            <span>Allowance used</span>
            <span>{consumedPercentage}%</span>
          </div>
          <Progress
            value={consumedPercentage}
            className="h-2 bg-[var(--color-surface-soft)]"
          />
        </div>

        <div
          className={`rounded-xl border p-3 text-sm ${
            isOverBudget
              ? "border-[var(--color-danger)]/50 bg-[var(--color-danger)]/15"
              : "border-[var(--color-learning)]/40 bg-[var(--color-learning)]/10"
          }`}
        >
          <p className="flex items-center gap-2 font-medium">
            {isOverBudget ? (
              <AlertTriangle className="size-4 text-[var(--color-danger)]" />
            ) : (
              <ShieldCheck className="size-4 text-[var(--color-learning)]" />
            )}
            {isOverBudget
              ? `You owe ${formatMinutes(summary.debtMinutes)} in ${summary.learningLanguageLabel}.`
              : `You can spend ${formatMinutes(summary.remainingBudgetMinutes)} more in other languages.`}
          </p>
          <p className="mt-1 text-[var(--color-text-muted)]">
            Target language total: {formatHoursDecimal(summary.learningMinutes)}h.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
