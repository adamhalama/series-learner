"use client";

import { Clapperboard, Zap } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DEFAULT_LANGUAGES } from "@/lib/constants";
import type { LanguageOption, TitleItem } from "@/lib/types";

type QuickLogPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titles: TitleItem[];
  languages: LanguageOption[];
  onQuickLog: (title: TitleItem) => Promise<void>;
  loggingTitleId?: Id<"titles">;
};

export const QuickLogPicker = ({
  open,
  onOpenChange,
  titles,
  languages,
  onQuickLog,
  loggingTitleId,
}: QuickLogPickerProps) => {
  const languageMap = new Map<string, string>();

  for (const language of [...DEFAULT_LANGUAGES, ...languages]) {
    if (!languageMap.has(language.code)) {
      languageMap.set(language.code, language.label);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[var(--color-panel-border)] bg-[var(--color-surface)] p-0 sm:max-w-[480px]">
        <DialogHeader className="border-b border-[var(--color-panel-border)] px-5 pt-5 pb-4">
          <DialogTitle className="flex items-center gap-2 font-display text-2xl tracking-wide">
            <Zap className="size-5 text-[var(--color-signal)]" />
            Quick Log Series
          </DialogTitle>
          <DialogDescription className="text-[var(--color-text-muted)]">
            Tap a series to instantly log one episode.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-4">
          {titles.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-panel-border)] p-4 text-sm text-[var(--color-text-muted)]">
              No series available. Add a series first.
            </div>
          ) : (
            <ScrollArea className="h-[50svh] pr-2 sm:h-[420px]">
              <div className="space-y-2 py-2">
                {titles.map((title) => {
                  const languageLabel =
                    languageMap.get(title.languageCode) ?? title.languageCode.toUpperCase();
                  const canQuickLog = title.defaultUnitMinutes !== null;
                  const effectiveMinutes = title.defaultUnitMinutes;
                  const isLoading = loggingTitleId === title._id;

                  return (
                    <button
                      key={title._id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-[var(--color-panel-border)] bg-[var(--color-surface-soft)] p-3 text-left transition hover:border-[var(--color-signal)]/50 hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-60"
                      onClick={() => void onQuickLog(title)}
                      disabled={Boolean(loggingTitleId) || !canQuickLog}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium text-[var(--color-text-primary)]">
                          {title.name}
                        </p>
                        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
                          {languageLabel} •{" "}
                          {effectiveMinutes === null
                            ? "set minutes in title board"
                            : `${effectiveMinutes}m/episode`}
                        </p>
                      </div>
                      {!canQuickLog ? (
                        <Badge
                          variant="outline"
                          className="border-[var(--color-non-learning)]/50 text-[var(--color-non-learning)]"
                        >
                          set time first
                        </Badge>
                      ) : null}
                      <div className="shrink-0 rounded-lg border border-[var(--color-panel-border)] bg-[var(--color-surface)] px-2 py-1 text-xs font-mono text-[var(--color-text-muted)]">
                        {isLoading ? "..." : canQuickLog ? "+1" : "--"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}

          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Series without a configured duration must be configured from Title Board first.
          </p>
        </div>

        <div className="border-t border-[var(--color-panel-border)] px-5 py-3 text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-2">
            <Clapperboard className="size-4" />
            Quick log always adds 1 episode.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
