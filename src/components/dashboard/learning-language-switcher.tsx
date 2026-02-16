"use client";

import { RadioTower } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LanguageOption } from "@/lib/types";

type LearningLanguageSwitcherProps = {
  learningLanguageCode: string;
  languages: LanguageOption[];
  onChange: (language: LanguageOption) => void;
  disabled?: boolean;
};

export const LearningLanguageSwitcher = ({
  learningLanguageCode,
  languages,
  onChange,
  disabled = false,
}: LearningLanguageSwitcherProps) => {
  const normalizedLanguages = [...languages].sort((a, b) =>
    a.label.localeCompare(b.label),
  );

  return (
    <Card className="panel-card h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 font-display text-lg tracking-wide">
          <RadioTower className="size-5 text-[var(--color-signal)]" />
          Learning Language
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-[var(--color-text-muted)]">
          Your non-learning watch time budget is tied to this language.
        </p>
        <Select
          value={learningLanguageCode}
          onValueChange={(value) => {
            const language = normalizedLanguages.find((entry) => entry.code === value);
            if (language) {
              onChange(language);
            }
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-full min-h-11 border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {normalizedLanguages.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                {language.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
};
