"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHoursDecimal } from "@/lib/format";
import type { LanguageTotal } from "@/lib/types";

type LanguageRuntimeChartProps = {
  totals: LanguageTotal[];
};

export const LanguageRuntimeChart = ({ totals }: LanguageRuntimeChartProps) => {
  const data = totals.map((entry) => ({
    language: entry.languageLabel,
    hours: Number((entry.totalMinutes / 60).toFixed(2)),
  }));

  return (
    <Card className="panel-card hidden lg:flex lg:flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-lg tracking-wide">
          Runtime Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[260px]">
        {data.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            Runtime chart appears after first watch log.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 4, left: -10, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-panel-border)" />
              <XAxis
                dataKey="language"
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "var(--color-text-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-surface)",
                  border: "1px solid var(--color-panel-border)",
                  borderRadius: "12px",
                  color: "var(--color-text-primary)",
                }}
                formatter={(value: number | string | undefined) => {
                  const numericValue =
                    typeof value === "number"
                      ? value
                      : Number.parseFloat(String(value ?? 0));
                  return [`${numericValue.toFixed(2)}h`, "Watched"];
                }}
              />
              <Bar dataKey="hours" fill="var(--color-signal)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {data.length > 0 ? (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Total runtime: {formatHoursDecimal(totals.reduce((sum, row) => sum + row.totalMinutes, 0))}h
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};
