"use client";

import { Languages } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHoursDecimal, formatMinutes } from "@/lib/format";
import type { LanguageTotal } from "@/lib/types";

type LanguageTotalsGridProps = {
  totals: LanguageTotal[];
  learningLanguageCode: string;
};

export const LanguageTotalsGrid = ({
  totals,
  learningLanguageCode,
}: LanguageTotalsGridProps) => {
  return (
    <Card className="panel-card">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 font-display text-lg tracking-wide">
          <Languages className="size-5 text-[var(--color-signal)]" />
          Language Totals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totals.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            No watch entries yet. Add a title and log your first session.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {totals.map((entry) => {
              const isLearning = entry.languageCode === learningLanguageCode;
              return (
                <div
                  key={entry.languageCode}
                  className={`rounded-xl border p-3 ${
                    isLearning
                      ? "border-[var(--color-learning)]/60 bg-[var(--color-learning)]/10"
                      : "border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-text-muted)]">
                    {entry.languageLabel}
                  </p>
                  <p className="mt-2 font-mono text-xl font-semibold">
                    {formatMinutes(entry.totalMinutes)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {formatHoursDecimal(entry.totalMinutes)}h across {entry.titleCount} titles
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
