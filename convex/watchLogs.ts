import { mutation, query, type MutationCtx } from "./_generated/server";
import { type Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { LOCAL_OWNER_KEY, MAX_UNIT_MINUTES, MIN_UNIT_MINUTES } from "./constants";

const recalculateTitleAggregates = async (
  ctx: MutationCtx,
  titleId: Id<"titles">,
) => {
  const logs = await ctx.db
    .query("watchLogs")
    .withIndex("by_title", (q) => q.eq("titleId", titleId))
    .collect();

  const totalUnits = logs.reduce((sum, log) => sum + log.units, 0);
  const totalMinutes = logs.reduce((sum, log) => sum + log.totalMinutes, 0);

  const latestLog = [...logs].sort((a, b) => {
    if (b.loggedAt !== a.loggedAt) {
      return b.loggedAt - a.loggedAt;
    }

    return b._creationTime - a._creationTime;
  })[0];

  return {
    totalUnits,
    totalMinutes,
    defaultUnitMinutes: latestLog?.unitMinutes ?? null,
  };
};

export const listRecent = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit && args.limit > 0 ? Math.floor(args.limit) : 20;

    const logs = await ctx.db
      .query("watchLogs")
      .withIndex("by_owner_logged_at", (q) => q.eq("ownerKey", LOCAL_OWNER_KEY))
      .order("desc")
      .take(limit);

    const uniqueTitleIds = [...new Set(logs.map((log) => log.titleId))];

    const titles = await Promise.all(uniqueTitleIds.map((titleId) => ctx.db.get(titleId)));

    const titleById = new Map(
      titles
        .filter((title): title is NonNullable<typeof title> => Boolean(title))
        .map((title) => [title._id, title]),
    );

    return logs.map((log) => {
      const title = titleById.get(log.titleId);
      return {
        ...log,
        titleName: title?.name ?? "Unknown title",
        contentType: title?.contentType ?? "series",
        languageCode: title?.languageCode ?? "unknown",
      };
    });
  },
});

export const add = mutation({
  args: {
    titleId: v.id("titles"),
    units: v.number(),
    unitMinutes: v.optional(v.number()),
    loggedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const title = await ctx.db.get(args.titleId);

    if (!title) {
      throw new Error("Title not found.");
    }

    if (!Number.isInteger(args.units) || args.units < 1) {
      throw new Error("Units must be an integer greater than 0.");
    }

    const resolvedUnitMinutes = args.unitMinutes ?? title.defaultUnitMinutes;

    if (resolvedUnitMinutes === null || resolvedUnitMinutes === undefined) {
      throw new Error("Unit minutes are required for a title's first watch entry.");
    }

    if (
      !Number.isInteger(resolvedUnitMinutes) ||
      resolvedUnitMinutes < MIN_UNIT_MINUTES ||
      resolvedUnitMinutes > MAX_UNIT_MINUTES
    ) {
      throw new Error(
        `Unit minutes must be an integer between ${MIN_UNIT_MINUTES} and ${MAX_UNIT_MINUTES}.`,
      );
    }

    const loggedAt = args.loggedAt ?? Date.now();
    const totalMinutes = args.units * resolvedUnitMinutes;

    const insertedId = await ctx.db.insert("watchLogs", {
      ownerKey: LOCAL_OWNER_KEY,
      titleId: title._id,
      units: args.units,
      unitMinutes: resolvedUnitMinutes,
      totalMinutes,
      loggedAt,
      createdAt: Date.now(),
    });

    const aggregates = await recalculateTitleAggregates(ctx, title._id);

    await ctx.db.patch(title._id, {
      totalUnits: aggregates.totalUnits,
      totalMinutes: aggregates.totalMinutes,
      defaultUnitMinutes: resolvedUnitMinutes,
      updatedAt: Date.now(),
    });

    return {
      logId: insertedId,
      ...aggregates,
    };
  },
});

export const remove = mutation({
  args: {
    logId: v.id("watchLogs"),
  },
  handler: async (ctx, args) => {
    const log = await ctx.db.get(args.logId);

    if (!log) {
      throw new Error("Watch log not found.");
    }

    await ctx.db.delete(args.logId);

    const title = await ctx.db.get(log.titleId);
    if (!title) {
      return {
        titleId: log.titleId,
        totalUnits: 0,
        totalMinutes: 0,
      };
    }

    const aggregates = await recalculateTitleAggregates(ctx, title._id);

    await ctx.db.patch(title._id, {
      totalUnits: aggregates.totalUnits,
      totalMinutes: aggregates.totalMinutes,
      defaultUnitMinutes: aggregates.defaultUnitMinutes,
      updatedAt: Date.now(),
    });

    return {
      titleId: title._id,
      ...aggregates,
    };
  },
});
