import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    notebooks: defineTable({
        title: v.string(),
        emoji: v.string(),
        description: v.string(),
    }),
    notebookSources: defineTable({
        notebookId: v.id("notebooks"),
        name: v.string(),
        url: v.optional(v.string()),
        type: v.string(), // pdf, epub, html, markdown
        isProcessing: v.boolean(),
        originalFileStorageId: v.optional(v.id("_storage")),
        rawContentStorageId: v.optional(v.id("_storage")),
        hasEmbedding: v.boolean(),
        tokensCount: v.number(),
    }).index("by_notebookId", ["notebookId"]),
    notebookSourceChunks: defineTable({
        notebookSourceId: v.id("notebookSources"),
        content: v.string(),
        chunkIndex: v.number(),
        embedding: v.optional(v.array(v.float64())),
        status: v.string(), // "pending" | "processing" | "complete"
        tokenCount: v.number()
    }).index("by_source", ["notebookSourceId"]),
    notebookItems: defineTable({
        notebookId: v.id("notebooks"),
        type: v.string(), // audio-overview
        refId: v.string(),
    }),
    audioOverviews: defineTable({
        format: v.string(),
        lang: v.string(),
        lengthMin: v.number(),
        focusDetails: v.optional(v.string()),
        status: v.string(),
    }),
    config: defineTable({
        key: v.string(),
        value: v.union(v.string(), v.number(), v.boolean()),
    }).index("by_key", ["key"])
});
