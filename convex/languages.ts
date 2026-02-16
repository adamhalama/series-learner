import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_LANGUAGES } from "./constants";

const normalizeLanguageCode = (code: string) => code.trim().toLowerCase();

export const list = query({
  args: {},
  handler: async (ctx) => {
    const languages = await ctx.db.query("languages").collect();

    if (languages.length === 0) {
      return DEFAULT_LANGUAGES;
    }

    return languages
      .map((language) => ({ code: language.code, label: language.label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  },
});

export const upsert = mutation({
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

    const existing = await ctx.db
      .query("languages")
      .withIndex("by_code", (q) => q.eq("code", code))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        label,
        updatedAt: now,
      });
      return {
        _id: existing._id,
        code,
        label,
      };
    }

    const insertedId = await ctx.db.insert("languages", {
      code,
      label,
      createdAt: now,
      updatedAt: now,
    });

    return {
      _id: insertedId,
      code,
      label,
    };
  },
});
