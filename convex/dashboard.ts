import { query } from "./_generated/server";
import { LOCAL_OWNER_KEY, DEFAULT_PROFILE } from "./constants";

const toLanguageLabel = (languageCode: string) =>
  languageCode
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("-");

export const summary = query({
  args: {},
  handler: async (ctx) => {
    const [profile, titles, languages] = await Promise.all([
      ctx.db
        .query("profiles")
        .withIndex("by_key", (q) => q.eq("key", LOCAL_OWNER_KEY))
        .first(),
      ctx.db
        .query("titles")
        .withIndex("by_owner", (q) => q.eq("ownerKey", LOCAL_OWNER_KEY))
        .collect(),
      ctx.db.query("languages").collect(),
    ]);

    const activeProfile = profile ?? {
      ...DEFAULT_PROFILE,
      createdAt: 0,
      updatedAt: 0,
    };

    const languageLabelByCode = new Map(
      languages.map((language) => [language.code, language.label]),
    );

    const totalsByLanguageMap = new Map<
      string,
      {
        languageCode: string;
        languageLabel: string;
        totalMinutes: number;
        titleCount: number;
      }
    >();

    for (const title of titles.filter((entry) => !entry.archived)) {
      const existing = totalsByLanguageMap.get(title.languageCode);
      const base = existing ?? {
        languageCode: title.languageCode,
        languageLabel:
          languageLabelByCode.get(title.languageCode) ??
          toLanguageLabel(title.languageCode),
        totalMinutes: 0,
        titleCount: 0,
      };

      totalsByLanguageMap.set(title.languageCode, {
        ...base,
        totalMinutes: base.totalMinutes + title.totalMinutes,
        titleCount: base.titleCount + 1,
      });
    }

    const totalsByLanguage = [...totalsByLanguageMap.values()].sort((a, b) => {
      if (b.totalMinutes !== a.totalMinutes) {
        return b.totalMinutes - a.totalMinutes;
      }
      return a.languageLabel.localeCompare(b.languageLabel);
    });

    const learningMinutes =
      totalsByLanguageMap.get(activeProfile.learningLanguageCode)?.totalMinutes ?? 0;

    const nonLearningMinutes = totalsByLanguage
      .filter((entry) => entry.languageCode !== activeProfile.learningLanguageCode)
      .reduce((sum, entry) => sum + entry.totalMinutes, 0);

    const remainingBudgetMinutes = learningMinutes - nonLearningMinutes;
    const debtMinutes = Math.max(0, nonLearningMinutes - learningMinutes);

    const coverageRatio =
      nonLearningMinutes === 0
        ? learningMinutes > 0
          ? 1
          : 0
        : Number((learningMinutes / nonLearningMinutes).toFixed(2));

    const topTitles = [...titles]
      .filter((title) => !title.archived)
      .sort((a, b) => {
        if (b.totalMinutes !== a.totalMinutes) {
          return b.totalMinutes - a.totalMinutes;
        }
        return a.name.localeCompare(b.name);
      })
      .slice(0, 8)
      .map((title) => ({
        _id: title._id,
        name: title.name,
        contentType: title.contentType,
        languageCode: title.languageCode,
        totalUnits: title.totalUnits,
        totalMinutes: title.totalMinutes,
      }));

    const recentLogs = await ctx.db
      .query("watchLogs")
      .withIndex("by_owner_logged_at", (q) => q.eq("ownerKey", LOCAL_OWNER_KEY))
      .order("desc")
      .take(12);

    const titleById = new Map(titles.map((title) => [title._id, title]));

    return {
      learningLanguageCode: activeProfile.learningLanguageCode,
      learningLanguageLabel: activeProfile.learningLanguageLabel,
      learningMinutes,
      nonLearningMinutes,
      remainingBudgetMinutes,
      debtMinutes,
      coverageRatio,
      status: debtMinutes > 0 ? "over_budget" : "within_budget",
      totalsByLanguage,
      topTitles,
      recentLogs: recentLogs.map((log) => {
        const title = titleById.get(log.titleId);
        return {
          _id: log._id,
          titleId: log.titleId,
          titleName: title?.name ?? "Unknown title",
          contentType: title?.contentType ?? "series",
          languageCode: title?.languageCode ?? "unknown",
          units: log.units,
          unitMinutes: log.unitMinutes,
          totalMinutes: log.totalMinutes,
          loggedAt: log.loggedAt,
        };
      }),
    };
  },
});
