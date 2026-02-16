import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_LANGUAGES, DEFAULT_PROFILE, LOCAL_OWNER_KEY } from "./constants";

const normalizeLanguageCode = (code: string) => code.trim().toLowerCase();

export const get = query({
  args: {},
  handler: async (ctx) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", LOCAL_OWNER_KEY))
      .first();

    if (profile) {
      return profile;
    }

    return {
      ...DEFAULT_PROFILE,
      createdAt: 0,
      updatedAt: 0,
    };
  },
});

export const ensureLocalSetup = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", LOCAL_OWNER_KEY))
      .first();

    if (!existingProfile) {
      await ctx.db.insert("profiles", {
        ...DEFAULT_PROFILE,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (const language of DEFAULT_LANGUAGES) {
      const existingLanguage = await ctx.db
        .query("languages")
        .withIndex("by_code", (q) => q.eq("code", language.code))
        .first();

      if (!existingLanguage) {
        await ctx.db.insert("languages", {
          ...language,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", LOCAL_OWNER_KEY))
      .first();

    if (!profile) {
      throw new Error("Failed to initialize local profile.");
    }

    return profile;
  },
});

export const setLearningLanguage = mutation({
  args: {
    code: v.string(),
    label: v.string(),
  },
  handler: async (ctx, args) => {
    const code = normalizeLanguageCode(args.code);
    const label = args.label.trim();

    if (!code) {
      throw new Error("Language code is required.");
    }

    if (!label) {
      throw new Error("Language label is required.");
    }

    const now = Date.now();

    const language = await ctx.db
      .query("languages")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (language) {
      if (language.label !== label) {
        await ctx.db.patch(language._id, {
          label,
          updatedAt: now,
        });
      }
    } else {
      await ctx.db.insert("languages", {
        code,
        label,
        createdAt: now,
        updatedAt: now,
      });
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", LOCAL_OWNER_KEY))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        learningLanguageCode: code,
        learningLanguageLabel: label,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert("profiles", {
        key: LOCAL_OWNER_KEY,
        displayName: DEFAULT_PROFILE.displayName,
        learningLanguageCode: code,
        learningLanguageLabel: label,
        createdAt: now,
        updatedAt: now,
      });
    }

    return await ctx.db
      .query("profiles")
      .withIndex("by_key", (q) => q.eq("key", LOCAL_OWNER_KEY))
      .first();
  },
});
