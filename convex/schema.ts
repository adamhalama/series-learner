import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const contentType = v.union(v.literal("series"), v.literal("movie"));

export default defineSchema({
  profiles: defineTable({
    key: v.string(),
    displayName: v.string(),
    learningLanguageCode: v.string(),
    learningLanguageLabel: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  languages: defineTable({
    code: v.string(),
    label: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_code", ["code"]),

  titles: defineTable({
    ownerKey: v.string(),
    name: v.string(),
    contentType,
    languageCode: v.string(),
    defaultUnitMinutes: v.union(v.number(), v.null()),
    totalUnits: v.number(),
    totalMinutes: v.number(),
    archived: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerKey"])
    .index("by_owner_archived", ["ownerKey", "archived"])
    .index("by_language", ["languageCode"])
    .index("by_content_type", ["contentType"]),

  watchLogs: defineTable({
    ownerKey: v.string(),
    titleId: v.id("titles"),
    units: v.number(),
    unitMinutes: v.number(),
    totalMinutes: v.number(),
    loggedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_title", ["titleId"])
    .index("by_owner_logged_at", ["ownerKey", "loggedAt"]),
});
