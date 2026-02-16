import type { Id } from "../../convex/_generated/dataModel";

export type ContentType = "series" | "movie";

export type BudgetStatus = "within_budget" | "over_budget";

export type LanguageOption = {
  code: string;
  label: string;
};

export type BalanceSummary = {
  learningLanguageCode: string;
  learningLanguageLabel: string;
  learningMinutes: number;
  nonLearningMinutes: number;
  remainingBudgetMinutes: number;
  debtMinutes: number;
  coverageRatio: number;
  status: BudgetStatus;
};

export type LanguageTotal = {
  languageCode: string;
  languageLabel: string;
  totalMinutes: number;
  titleCount: number;
};

export type TitleItem = {
  _id: Id<"titles">;
  name: string;
  contentType: ContentType;
  languageCode: string;
  defaultUnitMinutes: number | null;
  totalUnits: number;
  totalMinutes: number;
  archived: boolean;
  createdAt: number;
  updatedAt: number;
};

export type RecentLogItem = {
  _id: Id<"watchLogs">;
  titleId: Id<"titles">;
  titleName: string;
  contentType: ContentType;
  languageCode: string;
  units: number;
  unitMinutes: number;
  totalMinutes: number;
  loggedAt: number;
};

export type DashboardSummary = BalanceSummary & {
  totalsByLanguage: LanguageTotal[];
  topTitles: Array<{
    _id: Id<"titles">;
    name: string;
    contentType: ContentType;
    languageCode: string;
    totalUnits: number;
    totalMinutes: number;
  }>;
  recentLogs: RecentLogItem[];
};
