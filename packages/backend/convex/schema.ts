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
    })
        // Index for querying sources by notebook (used in dashboard and notebook views)
        .index("by_notebookId", ["notebookId"])
        // Compound index for querying sources by notebook with processing status filter
        .index("by_notebookId_processing", ["notebookId", "isProcessing"])
        // Compound index for querying sources by notebook with embedding status filter
        .index("by_notebookId_embedding", ["notebookId", "hasEmbedding"]),
    notebookSourceChunks: defineTable({
        notebookSourceId: v.id("notebookSources"),
        content: v.string(),
        chunkIndex: v.number(),
        embedding: v.optional(v.array(v.float64())),
        status: v.string(), // "pending" | "processing" | "complete"
        tokenCount: v.number()
    })
        // Index for querying chunks by source (used for embedding operations)
        .index("by_source", ["notebookSourceId"])
        // Compound index for querying chunks by source with status filter (for processing queues)
        .index("by_source_status", ["notebookSourceId", "status"])
        // Index for querying chunks by status across all sources (for batch processing)
        .index("by_status", ["status"]),
    notebookItems: defineTable({
        notebookId: v.id("notebooks"),
        type: v.string(), // audio-overview
        refId: v.string(),
    })
        // Index for querying items by notebook (used for listing notebook items)
        .index("by_notebookId", ["notebookId"])
        // Compound index for querying items by notebook and type (for filtering specific item types)
        .index("by_notebookId_type", ["notebookId", "type"]),
    audioOverviews: defineTable({
        format: v.string(),
        lang: v.string(),
        lengthMin: v.number(),
        focusDetails: v.optional(v.string()),
        status: v.string(),
    })
        // Index for querying audio overviews by status (for processing queues)
        .index("by_status", ["status"]),
    config: defineTable({
        key: v.string(),
        value: v.union(v.string(), v.number(), v.boolean()),
    })
        // Unique index for config lookups by key (ensures no duplicate keys)
        .index("by_key", ["key"])
});
