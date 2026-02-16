import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { LOCAL_OWNER_KEY, MAX_UNIT_MINUTES, MIN_UNIT_MINUTES } from "./constants";

const contentTypeValidator = v.union(v.literal("series"), v.literal("movie"));

const normalizeLanguageCode = (code: string) => code.trim().toLowerCase();

const ensureLanguage = async (
  ctx: MutationCtx,
  code: string,
  label?: string,
) => {
  const existingLanguage = await ctx.db
    .query("languages")
    .withIndex("by_code", (q) => q.eq("code", code))
    .first();

  const now = Date.now();

  if (!existingLanguage) {
    await ctx.db.insert("languages", {
      code,
      label: label?.trim() || code.toUpperCase(),
      createdAt: now,
      updatedAt: now,
    });
    return;
  }

  if (label?.trim() && existingLanguage.label !== label.trim()) {
    await ctx.db.patch(existingLanguage._id, {
      label: label.trim(),
      updatedAt: now,
    });
  }
};

export const list = query({
  args: {
    languageCode: v.optional(v.string()),
    contentType: v.optional(contentTypeValidator),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const titles = await ctx.db
      .query("titles")
      .withIndex("by_owner", (q) => q.eq("ownerKey", LOCAL_OWNER_KEY))
      .collect();

    const normalizedLanguageCode = args.languageCode
      ? normalizeLanguageCode(args.languageCode)
      : undefined;

    return titles
      .filter((title) =>
        normalizedLanguageCode
          ? title.languageCode === normalizedLanguageCode
          : true,
      )
      .filter((title) =>
        args.contentType ? title.contentType === args.contentType : true,
      )
      .filter((title) =>
        args.archived !== undefined ? title.archived === args.archived : true,
      )
      .sort((a, b) => {
        if (a.languageCode !== b.languageCode) {
          return a.languageCode.localeCompare(b.languageCode);
        }

        if (b.updatedAt !== a.updatedAt) {
          return b.updatedAt - a.updatedAt;
        }

        return a.name.localeCompare(b.name);
      });
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    contentType: contentTypeValidator,
    languageCode: v.string(),
    languageLabel: v.optional(v.string()),
    initialUnitMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    const languageCode = normalizeLanguageCode(args.languageCode);

    if (!name) {
      throw new Error("Title name is required.");
    }

    if (!languageCode) {
      throw new Error("Language code is required.");
    }

    if (
      args.initialUnitMinutes !== undefined &&
      (!Number.isInteger(args.initialUnitMinutes) ||
        args.initialUnitMinutes < MIN_UNIT_MINUTES ||
        args.initialUnitMinutes > MAX_UNIT_MINUTES)
    ) {
      throw new Error(
        `Initial minutes must be an integer between ${MIN_UNIT_MINUTES} and ${MAX_UNIT_MINUTES}.`,
      );
    }

    await ensureLanguage(ctx, languageCode, args.languageLabel);

    const now = Date.now();

    const insertedId = await ctx.db.insert("titles", {
      ownerKey: LOCAL_OWNER_KEY,
      name,
      contentType: args.contentType,
      languageCode,
      defaultUnitMinutes: args.initialUnitMinutes ?? null,
      totalUnits: 0,
      totalMinutes: 0,
      archived: false,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(insertedId);
  },
});

export const update = mutation({
  args: {
    titleId: v.id("titles"),
    name: v.optional(v.string()),
    languageCode: v.optional(v.string()),
    languageLabel: v.optional(v.string()),
    defaultUnitMinutes: v.optional(v.union(v.number(), v.null())),
    archived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const title = await ctx.db.get(args.titleId);

    if (!title) {
      throw new Error("Title not found.");
    }

    const patch: {
      name?: string;
      languageCode?: string;
      defaultUnitMinutes?: number | null;
      archived?: boolean;
      updatedAt: number;
    } = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) {
      const name = args.name.trim();
      if (!name) {
        throw new Error("Title name is required.");
      }
      patch.name = name;
    }

    if (args.languageCode !== undefined) {
      const languageCode = normalizeLanguageCode(args.languageCode);
      if (!languageCode) {
        throw new Error("Language code is required.");
      }
      await ensureLanguage(ctx, languageCode, args.languageLabel);
      patch.languageCode = languageCode;
    }

    if (args.defaultUnitMinutes !== undefined) {
      if (
        args.defaultUnitMinutes !== null &&
        (!Number.isInteger(args.defaultUnitMinutes) ||
          args.defaultUnitMinutes < MIN_UNIT_MINUTES ||
          args.defaultUnitMinutes > MAX_UNIT_MINUTES)
      ) {
        throw new Error(
          `Default minutes must be an integer between ${MIN_UNIT_MINUTES} and ${MAX_UNIT_MINUTES}.`,
        );
      }
      patch.defaultUnitMinutes = args.defaultUnitMinutes;
    }

    if (args.archived !== undefined) {
      patch.archived = args.archived;
    }

    await ctx.db.patch(title._id, patch);

    return await ctx.db.get(title._id);
  },
});

export const remove = mutation({
  args: {
    titleId: v.id("titles"),
  },
  handler: async (ctx, args) => {
    const title = await ctx.db.get(args.titleId);

    if (!title) {
      throw new Error("Title not found.");
    }

    if (title.ownerKey !== LOCAL_OWNER_KEY) {
      throw new Error("You do not have permission to remove this title.");
    }

    const logs = await ctx.db
      .query("watchLogs")
      .withIndex("by_title", (q) => q.eq("titleId", title._id))
      .collect();

    for (const log of logs) {
      await ctx.db.delete(log._id);
    }

    await ctx.db.delete(title._id);

    return {
      titleId: title._id,
      deletedLogs: logs.length,
    };
  },
});
