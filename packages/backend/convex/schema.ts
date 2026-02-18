import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    notebooks: defineTable({
        title: v.string(),
        emoji: v.string(),
        description: v.string(),
    }),
    notebookSources: defineTable({
        name: v.string(),
        url: v.optional(v.string()),
        type: v.string(), // pdf, epub, html, markdown
        isProcessing: v.boolean(),
        storageId: v.id("_storage"),
        rawContent: v.string(),
    }),
    notebookSourceChunks: defineTable({
        notebookSourceId: v.id("notebookSources"),
        content: v.string(),
        chunkIndex: v.number(),
        chunk: v.string(),
        embedding: v.array(v.float64()),
        embedding_done: v.boolean(),
    }).vectorIndex("by_embedding", {
        vectorField: "embedding",
        dimensions: 1536,
        filterFields: ["embedding",],
    }),
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
