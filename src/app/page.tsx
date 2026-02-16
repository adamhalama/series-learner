"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Radio, TvMinimalPlay } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { BalanceCommandDeck } from "@/components/dashboard/balance-command-deck";
import { GoalNudgeBanner } from "@/components/dashboard/goal-nudge-banner";
import { LanguageTotalsGrid } from "@/components/dashboard/language-totals-grid";
import { LearningLanguageSwitcher } from "@/components/dashboard/learning-language-switcher";
import { QuickLogFab } from "@/components/dashboard/quick-log-fab";
import { RecentActivityTimeline } from "@/components/dashboard/recent-activity-timeline";
import { LanguageRuntimeChart } from "@/components/charts/language-runtime-chart";
import { AddTitleDialog } from "@/components/logging/add-title-dialog";
import { QuickLogPicker } from "@/components/logging/quick-log-picker";
import { TitleBoard } from "@/components/titles/title-board";
import { Button } from "@/components/ui/button";
import { DEFAULT_LANGUAGES } from "@/lib/constants";
import type {
  DashboardSummary,
  LanguageOption,
  RecentLogItem,
  TitleItem,
} from "@/lib/types";

const toFallbackSummary = (learningLanguageCode: string, learningLanguageLabel: string): DashboardSummary => ({
  learningLanguageCode,
  learningLanguageLabel,
  learningMinutes: 0,
  nonLearningMinutes: 0,
  remainingBudgetMinutes: 0,
  debtMinutes: 0,
  coverageRatio: 0,
  status: "within_budget",
  totalsByLanguage: [],
  topTitles: [],
  recentLogs: [],
});

export default function HomePage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isQuickLogPickerOpen, setIsQuickLogPickerOpen] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<Id<"watchLogs"> | undefined>();
  const [deletingTitleId, setDeletingTitleId] = useState<Id<"titles"> | undefined>();
  const [inlineLoggingTitleId, setInlineLoggingTitleId] = useState<Id<"titles"> | undefined>();
  const [quickLoggingTitleId, setQuickLoggingTitleId] = useState<Id<"titles"> | undefined>();
  const [isUpdatingLearningLanguage, setIsUpdatingLearningLanguage] = useState(false);

  const profile = useQuery(api.profile.get);
  const languagesQuery = useQuery(api.languages.list);
  const titlesQuery = useQuery(api.titles.list, {});
  const dashboardQuery = useQuery(api.dashboard.summary);
  const recentLogsQuery = useQuery(api.watchLogs.listRecent, { limit: 40 });

  const ensureLocalSetup = useMutation(api.profile.ensureLocalSetup);
  const setLearningLanguage = useMutation(api.profile.setLearningLanguage);
  const createTitle = useMutation(api.titles.create);
  const removeTitle = useMutation(api.titles.remove);
  const addWatchLog = useMutation(api.watchLogs.add);
  const removeWatchLog = useMutation(api.watchLogs.remove);

  useEffect(() => {
    void ensureLocalSetup().catch((error) => {
      toast.error(`Could not initialize local profile: ${error.message}`);
    });
  }, [ensureLocalSetup]);

  const languages = useMemo(
    () => (languagesQuery ?? DEFAULT_LANGUAGES) as LanguageOption[],
    [languagesQuery],
  );
  const titles = useMemo(() => (titlesQuery ?? []) as TitleItem[], [titlesQuery]);
  const recentLogs = useMemo(
    () => (recentLogsQuery ?? []) as RecentLogItem[],
    [recentLogsQuery],
  );

  const fallbackSummary = useMemo(() => {
    return toFallbackSummary(
      profile?.learningLanguageCode ?? "da",
      profile?.learningLanguageLabel ?? "Danish",
    );
  }, [profile?.learningLanguageCode, profile?.learningLanguageLabel]);

  const summary = (dashboardQuery ?? fallbackSummary) as DashboardSummary;

  const quickLogSeries = useMemo(
    () =>
      [...titles]
        .filter((title) => !title.archived && title.contentType === "series")
        .sort((a, b) => {
          if (b.updatedAt !== a.updatedAt) {
            return b.updatedAt - a.updatedAt;
          }
          return a.name.localeCompare(b.name);
        }),
    [titles],
  );

  const handleOpenQuickLogPicker = () => {
    if (quickLogSeries.length === 0) {
      toast.error("Add a series before using quick log.");
      return;
    }

    setIsQuickLogPickerOpen(true);
  };

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[var(--color-background)] pb-24 md:pb-8">
      <div className="atmosphere" aria-hidden />

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3 lg:mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--color-text-muted)]">
              Series Learner Command Deck
            </p>
            <h1 className="font-display text-4xl tracking-[0.08em] text-[var(--color-text-primary)] sm:text-5xl">
              Runtime Budget Tracker
            </h1>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Button
              type="button"
              variant="outline"
              className="min-h-11 border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]"
              onClick={handleOpenQuickLogPicker}
              disabled={quickLogSeries.length === 0}
            >
              <Radio className="size-4" />
              Quick log
            </Button>
            <Button
              type="button"
              className="min-h-11"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <TvMinimalPlay className="size-4" />
              Add title
            </Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <BalanceCommandDeck summary={summary} />
          </div>

          <div className="space-y-4 lg:col-span-4">
            <LearningLanguageSwitcher
              learningLanguageCode={summary.learningLanguageCode}
              languages={languages}
              disabled={isUpdatingLearningLanguage}
              onChange={async (language) => {
                try {
                  setIsUpdatingLearningLanguage(true);
                  await setLearningLanguage({
                    code: language.code,
                    label: language.label,
                  });
                  toast.success(`Learning language set to ${language.label}.`);
                } catch (error) {
                  toast.error(
                    `Could not update learning language: ${(error as Error).message}`,
                  );
                } finally {
                  setIsUpdatingLearningLanguage(false);
                }
              }}
            />
            <GoalNudgeBanner
              debtMinutes={summary.debtMinutes}
              learningLanguageLabel={summary.learningLanguageLabel}
            />
          </div>

          <div className="lg:col-span-12">
            <LanguageTotalsGrid
              totals={summary.totalsByLanguage}
              learningLanguageCode={summary.learningLanguageCode}
            />
          </div>

          <div className="lg:col-span-7">
            <TitleBoard
              titles={titles}
              languages={languages}
              loggingTitleId={inlineLoggingTitleId}
              onQuickLog={async (title, unitMinutes) => {
                try {
                  setInlineLoggingTitleId(title._id);
                  await addWatchLog({
                    titleId: title._id,
                    units: 1,
                    unitMinutes,
                  });
                  toast.success(`Logged 1 episode for ${title.name}.`);
                } catch (error) {
                  toast.error(`Could not log session: ${(error as Error).message}`);
                } finally {
                  setInlineLoggingTitleId(undefined);
                }
              }}
              onCreateTitle={async ({ name, contentType, languageCode, languageLabel }) => {
                try {
                  await createTitle({
                    name,
                    contentType,
                    languageCode,
                    languageLabel,
                  });
                  toast.success(`Added ${name}.`);
                } catch (error) {
                  toast.error(`Could not add title: ${(error as Error).message}`);
                  throw error;
                }
              }}
              deletingTitleId={deletingTitleId}
              onDeleteTitle={async (title) => {
                try {
                  setDeletingTitleId(title._id);
                  await removeTitle({ titleId: title._id });
                  toast.success(`Removed ${title.name}.`);
                } catch (error) {
                  toast.error(`Could not remove title: ${(error as Error).message}`);
                } finally {
                  setDeletingTitleId(undefined);
                }
              }}
            />
          </div>

          <div className="space-y-4 lg:col-span-5">
            <LanguageRuntimeChart totals={summary.totalsByLanguage} />
            <RecentActivityTimeline
              logs={recentLogs}
              deletingLogId={deletingLogId}
              onDelete={async (logId) => {
                try {
                  setDeletingLogId(logId);
                  await removeWatchLog({ logId });
                  toast.success("Log entry removed.");
                } catch (error) {
                  toast.error(`Could not remove log: ${(error as Error).message}`);
                } finally {
                  setDeletingLogId(undefined);
                }
              }}
            />
          </div>
        </section>
      </main>

      <QuickLogFab onClick={handleOpenQuickLogPicker} disabled={quickLogSeries.length === 0} />

      <QuickLogPicker
        open={isQuickLogPickerOpen}
        onOpenChange={setIsQuickLogPickerOpen}
        titles={quickLogSeries}
        languages={languages}
        loggingTitleId={quickLoggingTitleId}
        onQuickLog={async (title) => {
          try {
            if (title.defaultUnitMinutes === null) {
              toast.error(`Set minutes for ${title.name} in Title Board first.`);
              return;
            }

            setQuickLoggingTitleId(title._id);
            await addWatchLog({
              titleId: title._id,
              units: 1,
              unitMinutes: title.defaultUnitMinutes,
            });
            setIsQuickLogPickerOpen(false);
            toast.success(`Quick logged 1 episode of ${title.name}.`);
          } catch (error) {
            toast.error(`Could not quick log: ${(error as Error).message}`);
          } finally {
            setQuickLoggingTitleId(undefined);
          }
        }}
      />

      <AddTitleDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        languages={languages}
        onSubmit={async (values) => {
          await createTitle(values);
          toast.success(`Added ${values.name}.`);
        }}
      />
    </div>
  );
}
