"use client";

import { useMemo, useState } from "react";
import { Plus, Radio, Trash2 } from "lucide-react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEFAULT_LANGUAGES, MAX_UNIT_MINUTES, MIN_UNIT_MINUTES } from "@/lib/constants";
import { formatMinutes } from "@/lib/format";
import type { ContentType, LanguageOption, TitleItem } from "@/lib/types";

type CreateTitlePayload = {
  name: string;
  contentType: ContentType;
  languageCode: string;
  languageLabel: string;
};

type TitleBoardProps = {
  titles: TitleItem[];
  languages: LanguageOption[];
  onQuickLog: (title: TitleItem, unitMinutes: number) => Promise<void>;
  loggingTitleId?: Id<"titles">;
  onCreateTitle: (payload: CreateTitlePayload) => Promise<void>;
  onDeleteTitle: (title: TitleItem) => Promise<void>;
  deletingTitleId?: Id<"titles">;
};

export const TitleBoard = ({
  titles,
  languages,
  onQuickLog,
  loggingTitleId,
  onCreateTitle,
  onDeleteTitle,
  deletingTitleId,
}: TitleBoardProps) => {
  const [contentType, setContentType] = useState<ContentType>("series");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [minutesByTitleKey, setMinutesByTitleKey] = useState<Record<string, string>>(
    {},
  );
  const [pendingDeleteId, setPendingDeleteId] = useState<Id<"titles"> | null>(
    null,
  );
  const [activeAddLanguageCode, setActiveAddLanguageCode] = useState<string | null>(
    null,
  );
  const [draftTitleByLanguage, setDraftTitleByLanguage] = useState<Record<string, string>>(
    {},
  );
  const [creatingLanguageCode, setCreatingLanguageCode] = useState<string | null>(
    null,
  );

  const languageOptions = useMemo(() => {
    const merged = [...DEFAULT_LANGUAGES, ...languages];
    const map = new Map<string, LanguageOption>();
    for (const entry of merged) {
      map.set(entry.code, entry);
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  }, [languages]);

  const languageLabelByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const entry of languageOptions) {
      map.set(entry.code, entry.label);
    }
    return map;
  }, [languageOptions]);

  const titlesForType = useMemo(() => {
    return titles
      .filter((title) => title.contentType === contentType)
      .filter((title) => !title.archived);
  }, [titles, contentType]);

  const groupedByLanguage = useMemo(() => {
    const codes = new Set<string>(languageOptions.map((language) => language.code));

    for (const title of titlesForType) {
      codes.add(title.languageCode);
    }

    const visibleCodes =
      languageFilter === "all"
        ? [...codes]
        : [languageFilter].filter((code) => Boolean(code));

    return visibleCodes
      .sort((a, b) => {
        const labelA = languageLabelByCode.get(a) ?? a.toUpperCase();
        const labelB = languageLabelByCode.get(b) ?? b.toUpperCase();
        return labelA.localeCompare(labelB);
      })
      .map((languageCode) => ({
        languageCode,
        titles: titlesForType.filter((title) => title.languageCode === languageCode),
      }));
  }, [languageOptions, languageFilter, titlesForType, languageLabelByCode]);

  const labelForLanguage = (languageCode: string) =>
    languageLabelByCode.get(languageCode) ?? languageCode.toUpperCase();

  return (
    <Card className="panel-card h-full">
      <CardHeader className="space-y-4 pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="font-display text-xl tracking-wide">Title Board</CardTitle>
        </div>

        <Tabs
          value={contentType}
          onValueChange={(value) => setContentType(value as ContentType)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 bg-[var(--color-surface-soft)]">
            <TabsTrigger value="series" className="min-h-11">
              Series
            </TabsTrigger>
            <TabsTrigger value="movie" className="min-h-11">
              Movies
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={languageFilter} onValueChange={setLanguageFilter}>
          <SelectTrigger className="min-h-11 w-full border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All languages</SelectItem>
            {languageOptions.map((language) => (
              <SelectItem key={language.code} value={language.code}>
                {language.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="space-y-4">
        {groupedByLanguage.map(({ languageCode, titles: languageTitles }, groupIndex) => (
          <div key={languageCode} className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-lg tracking-wide">{labelForLanguage(languageCode)}</h3>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="min-h-9 border-[var(--color-panel-border)]"
                  onClick={() => {
                    setActiveAddLanguageCode(languageCode);
                    setDraftTitleByLanguage((current) => ({
                      ...current,
                      [languageCode]: current[languageCode] ?? "",
                    }));
                  }}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
                <Badge variant="outline" className="border-[var(--color-panel-border)]">
                  {languageTitles.length} titles
                </Badge>
              </div>
            </div>

            {activeAddLanguageCode === languageCode ? (
              <div className="rounded-xl border border-dashed border-[var(--color-panel-border)] bg-[var(--color-surface)]/75 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    value={draftTitleByLanguage[languageCode] ?? ""}
                    onChange={(event) => {
                      const next = event.target.value;
                      setDraftTitleByLanguage((current) => ({
                        ...current,
                        [languageCode]: next,
                      }));
                    }}
                    placeholder={`New ${contentType} title`}
                    className="min-h-11 border-[var(--color-panel-border)] bg-[var(--color-surface-soft)]"
                    autoFocus
                  />
                  <Button
                    type="button"
                    className="min-h-11 sm:min-w-[110px]"
                    onClick={async () => {
                      const name = (draftTitleByLanguage[languageCode] ?? "").trim();
                      if (!name || creatingLanguageCode) {
                        return;
                      }

                      try {
                        setCreatingLanguageCode(languageCode);
                        await onCreateTitle({
                          name,
                          contentType,
                          languageCode,
                          languageLabel: labelForLanguage(languageCode),
                        });
                        setDraftTitleByLanguage((current) => ({
                          ...current,
                          [languageCode]: "",
                        }));
                        setActiveAddLanguageCode(null);
                      } finally {
                        setCreatingLanguageCode(null);
                      }
                    }}
                    disabled={
                      creatingLanguageCode !== null ||
                      !(draftTitleByLanguage[languageCode] ?? "").trim()
                    }
                  >
                    {creatingLanguageCode === languageCode ? "Adding..." : "Create"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11 border-[var(--color-panel-border)]"
                    onClick={() => {
                      setActiveAddLanguageCode(null);
                      setDraftTitleByLanguage((current) => ({
                        ...current,
                        [languageCode]: "",
                      }));
                    }}
                    disabled={creatingLanguageCode !== null}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              {languageTitles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[var(--color-panel-border)] p-3 text-sm text-[var(--color-text-muted)]">
                  No {contentType} titles yet in {labelForLanguage(languageCode)}.
                </div>
              ) : null}

              {languageTitles.map((title) => {
                const titleKey = String(title._id);
                const minutesValue =
                  minutesByTitleKey[titleKey] ??
                  (title.defaultUnitMinutes === null
                    ? ""
                    : title.defaultUnitMinutes.toString());

                const parsedMinutes = Number.parseInt(minutesValue, 10);
                const isMinutesValid =
                  Number.isInteger(parsedMinutes) &&
                  parsedMinutes >= MIN_UNIT_MINUTES &&
                  parsedMinutes <= MAX_UNIT_MINUTES;
                const hasDefaultMinutes = title.defaultUnitMinutes !== null;
                const isConfirmingChange =
                  hasDefaultMinutes &&
                  isMinutesValid &&
                  parsedMinutes !== title.defaultUnitMinutes;
                const isLogging = loggingTitleId === title._id;

                return (
                  <div
                    key={title._id}
                    className="rounded-xl border border-[var(--color-panel-border)] bg-[var(--color-surface-soft)] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium leading-tight">{title.name}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                          {title.totalUnits} units • {formatMinutes(title.totalMinutes)}
                        </p>
                      </div>

                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                        <div className="flex w-full items-center gap-2 sm:w-auto">
                          <div className="relative w-[94px] shrink-0">
                            <Input
                              value={minutesValue}
                              onChange={(event) => {
                                const next = event.target.value.replace(/[^0-9]/g, "");
                                setMinutesByTitleKey((current) => ({
                                  ...current,
                                  [titleKey]: next,
                                }));
                              }}
                              inputMode="numeric"
                              className={`min-h-11 border-[var(--color-panel-border)] bg-[var(--color-surface)] pr-9 font-mono ${
                                !isMinutesValid && minutesValue.length > 0
                                  ? "border-[var(--color-danger)]/70"
                                  : ""
                              }`}
                              aria-label={`${title.name} minutes`}
                              placeholder={hasDefaultMinutes ? undefined : "min"}
                            />
                            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">
                              m
                            </span>
                          </div>

                          <Button
                            type="button"
                            size="sm"
                            className={`min-h-11 min-w-[124px] ${
                              isConfirmingChange
                                ? "bg-[var(--color-non-learning)] text-black hover:bg-[var(--color-non-learning)]/90"
                                : ""
                            }`}
                            onClick={async () => {
                              if (!isMinutesValid || isLogging) {
                                return;
                              }
                              await onQuickLog(title, parsedMinutes);
                            }}
                            disabled={
                              deletingTitleId === title._id || !isMinutesValid || isLogging
                            }
                          >
                            <Radio className="size-4" />
                            {isLogging
                              ? "Logging..."
                              : !hasDefaultMinutes
                                ? "Set + Log"
                                : isConfirmingChange
                                  ? "Confirm + Log"
                                  : "+ Log"}
                          </Button>
                        </div>

                        {hasDefaultMinutes === false && minutesValue.length === 0 ? (
                          <p className="w-full text-xs text-[var(--color-text-muted)] sm:text-right">
                            Add minutes before first log.
                          </p>
                        ) : null}

                        {!isMinutesValid && minutesValue.length > 0 ? (
                          <p className="w-full text-xs text-[var(--color-danger)] sm:text-right">
                            Minutes must be {MIN_UNIT_MINUTES}-{MAX_UNIT_MINUTES}.
                          </p>
                        ) : null}

                        {pendingDeleteId === title._id ? (
                          <div className="flex w-full gap-2 sm:w-auto">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="min-h-11 flex-1 border-[var(--color-panel-border)] sm:flex-none"
                              onClick={() => setPendingDeleteId(null)}
                              disabled={deletingTitleId === title._id}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="min-h-11 flex-1 bg-[var(--color-danger)] text-black hover:bg-[var(--color-danger)]/90 sm:flex-none"
                              onClick={async () => {
                                await onDeleteTitle(title);
                                setPendingDeleteId(null);
                              }}
                              disabled={deletingTitleId === title._id}
                            >
                              <Trash2 className="size-4" />
                              {deletingTitleId === title._id ? "Removing..." : "Confirm"}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="min-h-11 w-full border-[var(--color-panel-border)] text-[var(--color-text-muted)] hover:text-[var(--color-danger)] sm:w-auto"
                            onClick={() => setPendingDeleteId(title._id)}
                            disabled={deletingTitleId === title._id}
                          >
                            <Trash2 className="size-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                      Default minutes: {title.defaultUnitMinutes ?? "not set"}
                    </p>
                  </div>
                );
              })}
            </div>

            {groupIndex < groupedByLanguage.length - 1 ? (
              <Separator className="bg-[var(--color-panel-border)]" />
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
