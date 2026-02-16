"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Lock, Radio, TvMinimalPlay } from "lucide-react";
import { toast } from "sonner";
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

const SNAPSHOT_POLL_MS = 4_000;

type ConvexMutationPath =
  | "profile:ensureLocalSetup"
  | "profile:setLearningLanguage"
  | "titles:create"
  | "titles:remove"
  | "watchLogs:add"
  | "watchLogs:remove";

type ConvexQueryPath =
  | "profile:get"
  | "languages:list"
  | "titles:list"
  | "dashboard:summary"
  | "watchLogs:listRecent";

type ConvexResponse<T> =
  | {
      status: "success";
      value: T;
    }
  | {
      status: "error";
      errorMessage?: string;
    };

type ProfileItem = {
  key: string;
  displayName: string;
  learningLanguageCode: string;
  learningLanguageLabel: string;
  createdAt: number;
  updatedAt: number;
};

const toFallbackSummary = (
  learningLanguageCode: string,
  learningLanguageLabel: string,
): DashboardSummary => ({
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

const isLoopbackHost = (host: string) =>
  host === "127.0.0.1" || host === "localhost";

const resolveConvexHttpBaseUrl = () => {
  const configured = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();
  const serverFallback = "http://127.0.0.1:3210";

  if (typeof window === "undefined") {
    if (!configured) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("NEXT_PUBLIC_CONVEX_URL is required in production.");
      }
      return serverFallback;
    }

    const configuredUrl = new URL(configured);
    if (
      process.env.NODE_ENV === "production" &&
      !isLoopbackHost(configuredUrl.hostname) &&
      configuredUrl.protocol !== "https:"
    ) {
      throw new Error("NEXT_PUBLIC_CONVEX_URL must use HTTPS in production.");
    }

    return configuredUrl.toString().replace(/\/$/, "");
  }

  const browserHost = window.location.hostname;
  const fallback = `http://${browserHost}:3210`;

  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("NEXT_PUBLIC_CONVEX_URL is required in production.");
    }
    return fallback;
  }

  const configuredUrl = new URL(configured);
  const isLoopbackConfigured = isLoopbackHost(configuredUrl.hostname);
  const isLoopbackBrowserHost = isLoopbackHost(browserHost);

  if (isLoopbackConfigured && !isLoopbackBrowserHost) {
    configuredUrl.hostname = browserHost;
  }

  if (
    process.env.NODE_ENV === "production" &&
    !isLoopbackHost(configuredUrl.hostname) &&
    configuredUrl.protocol !== "https:"
  ) {
    throw new Error("NEXT_PUBLIC_CONVEX_URL must use HTTPS in production.");
  }

  return configuredUrl.toString().replace(/\/$/, "");
};

export default function HomePage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isQuickLogPickerOpen, setIsQuickLogPickerOpen] = useState(false);
  const [deletingLogId, setDeletingLogId] = useState<Id<"watchLogs"> | undefined>();
  const [deletingTitleId, setDeletingTitleId] = useState<Id<"titles"> | undefined>();
  const [inlineLoggingTitleId, setInlineLoggingTitleId] = useState<Id<"titles"> | undefined>();
  const [quickLoggingTitleId, setQuickLoggingTitleId] = useState<Id<"titles"> | undefined>();
  const [isUpdatingLearningLanguage, setIsUpdatingLearningLanguage] = useState(false);
  const [isSnapshotSyncing, setIsSnapshotSyncing] = useState(false);

  const [profile, setProfile] = useState<ProfileItem | undefined>();
  const [languages, setLanguages] = useState<LanguageOption[]>(DEFAULT_LANGUAGES);
  const [titles, setTitles] = useState<TitleItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | undefined>();
  const [recentLogs, setRecentLogs] = useState<RecentLogItem[]>([]);

  const convexHttpBaseUrl = useMemo(() => {
    try {
      return resolveConvexHttpBaseUrl();
    } catch (error) {
      toast.error((error as Error).message);
      return "";
    }
  }, []);

  const runConvexHttpRequest = useCallback(
    async <TArgs extends Record<string, unknown>, TResult>(
      route: "query" | "mutation",
      path: ConvexQueryPath | ConvexMutationPath,
      args: TArgs,
    ): Promise<TResult> => {
      if (!convexHttpBaseUrl) {
        throw new Error("Convex URL is not configured.");
      }

      const response = await fetch(`${convexHttpBaseUrl}/api/${route}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          path,
          args,
        }),
      });

      if (!response.ok) {
        throw new Error(`Convex ${route} failed (${response.status}).`);
      }

      const payload = (await response.json()) as ConvexResponse<TResult>;
      if (payload.status !== "success") {
        throw new Error(payload.errorMessage || `Convex ${route} failed.`);
      }

      return payload.value;
    },
    [convexHttpBaseUrl],
  );

  const runConvexHttpQuery = useCallback(
    async <TArgs extends Record<string, unknown>, TResult>(
      path: ConvexQueryPath,
      args: TArgs,
    ) =>
      await runConvexHttpRequest<TArgs, TResult>("query", path, args),
    [runConvexHttpRequest],
  );

  const runConvexHttpMutation = useCallback(
    async <TArgs extends Record<string, unknown>, TResult>(
      path: ConvexMutationPath,
      args: TArgs,
    ) =>
      await runConvexHttpRequest<TArgs, TResult>("mutation", path, args),
    [runConvexHttpRequest],
  );

  const refreshSnapshot = useCallback(
    async (silent = false) => {
      if (!convexHttpBaseUrl) {
        if (!silent) {
          toast.error("Convex URL is not configured.");
        }
        return false;
      }

      try {
        setIsSnapshotSyncing(true);
        const [
          nextProfile,
          nextLanguages,
          nextTitles,
          nextSummary,
          nextRecentLogs,
        ] = await Promise.all([
          runConvexHttpQuery<Record<string, never>, ProfileItem>("profile:get", {}),
          runConvexHttpQuery<Record<string, never>, LanguageOption[]>(
            "languages:list",
            {},
          ),
          runConvexHttpQuery<
            { languageCode?: string; contentType?: "series" | "movie"; archived?: boolean },
            TitleItem[]
          >("titles:list", {}),
          runConvexHttpQuery<Record<string, never>, DashboardSummary>(
            "dashboard:summary",
            {},
          ),
          runConvexHttpQuery<{ limit: number }, RecentLogItem[]>(
            "watchLogs:listRecent",
            { limit: 40 },
          ),
        ]);

        setProfile(nextProfile);
        setLanguages(nextLanguages.length > 0 ? nextLanguages : DEFAULT_LANGUAGES);
        setTitles(nextTitles);
        setSummary(nextSummary);
        setRecentLogs(nextRecentLogs);
        return true;
      } catch (error) {
        if (!silent) {
          toast.error(`Could not sync data: ${(error as Error).message}`);
        }
        return false;
      } finally {
        setIsSnapshotSyncing(false);
      }
    },
    [convexHttpBaseUrl, runConvexHttpQuery],
  );

  const mutateAndRefresh = useCallback(
    async <TArgs extends Record<string, unknown>, TResult>(
      path: ConvexMutationPath,
      args: TArgs,
    ): Promise<TResult> => {
      const result = await runConvexHttpMutation<TArgs, TResult>(path, args);
      await refreshSnapshot(true);
      return result;
    },
    [refreshSnapshot, runConvexHttpMutation],
  );

  useEffect(() => {
    let isCancelled = false;

    const bootstrap = async () => {
      if (!convexHttpBaseUrl) {
        return;
      }

      try {
        await runConvexHttpMutation("profile:ensureLocalSetup", {});
      } catch (error) {
        if (!isCancelled) {
          toast.error(`Could not initialize local profile: ${(error as Error).message}`);
        }
      } finally {
        if (!isCancelled) {
          await refreshSnapshot(true);
        }
      }
    };

    void bootstrap();

    const intervalId = window.setInterval(() => {
      void refreshSnapshot(true);
    }, SNAPSHOT_POLL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [convexHttpBaseUrl, refreshSnapshot, runConvexHttpMutation]);

  const fallbackSummary = useMemo(
    () =>
      toFallbackSummary(
        profile?.learningLanguageCode ?? "da",
        profile?.learningLanguageLabel ?? "Danish",
      ),
    [profile?.learningLanguageCode, profile?.learningLanguageLabel],
  );

  const effectiveSummary = summary ?? fallbackSummary;

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
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-[var(--color-panel-border)] bg-[var(--color-surface-soft)] px-3 py-1 text-xs uppercase tracking-[0.16em]">
              <span
                className={`size-2 rounded-full ${
                  isSnapshotSyncing
                    ? "bg-[var(--color-non-learning)]"
                    : "bg-[var(--color-learning)]"
                }`}
                aria-hidden
              />
              {isSnapshotSyncing ? "HTTP Syncing" : "HTTP Mode"}
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <form action="/api/auth/lock" method="post">
              <Button
                type="submit"
                variant="outline"
                className="min-h-11 border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]"
              >
                <Lock className="size-4" />
                Lock
              </Button>
            </form>
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

        <section className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-12">
              <BalanceCommandDeck summary={effectiveSummary} />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <TitleBoard
                titles={titles}
                languages={languages}
                loggingTitleId={inlineLoggingTitleId}
                onQuickLog={async (title, unitMinutes) => {
                  try {
                    setInlineLoggingTitleId(title._id);
                    await mutateAndRefresh("watchLogs:add", {
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
                onCreateTitle={async ({
                  name,
                  contentType,
                  languageCode,
                  languageLabel,
                }) => {
                  try {
                    await mutateAndRefresh("titles:create", {
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
                    await mutateAndRefresh("titles:remove", { titleId: title._id });
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
              <LanguageRuntimeChart totals={effectiveSummary.totalsByLanguage} />
              <RecentActivityTimeline
                logs={recentLogs}
                deletingLogId={deletingLogId}
                onDelete={async (logId) => {
                  try {
                    setDeletingLogId(logId);
                    await mutateAndRefresh("watchLogs:remove", { logId });
                    toast.success("Log entry removed.");
                  } catch (error) {
                    toast.error(`Could not remove log: ${(error as Error).message}`);
                  } finally {
                    setDeletingLogId(undefined);
                  }
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <LanguageTotalsGrid
                totals={effectiveSummary.totalsByLanguage}
                learningLanguageCode={effectiveSummary.learningLanguageCode}
              />
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              <LearningLanguageSwitcher
                learningLanguageCode={effectiveSummary.learningLanguageCode}
                languages={languages}
                disabled={isUpdatingLearningLanguage}
                onChange={async (language) => {
                  try {
                    setIsUpdatingLearningLanguage(true);
                    await mutateAndRefresh("profile:setLearningLanguage", {
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
                debtMinutes={effectiveSummary.debtMinutes}
                learningLanguageLabel={effectiveSummary.learningLanguageLabel}
              />
            </div>
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
            await mutateAndRefresh("watchLogs:add", {
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
          await mutateAndRefresh("titles:create", values);
          toast.success(`Added ${values.name}.`);
        }}
      />
    </div>
  );
}
