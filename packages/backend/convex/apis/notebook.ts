import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const createSource = mutation({
    args: {
        notebookId: v.id("notebooks"),
        name: v.string(),
        type: v.string(),
        originalFileStorageId: v.optional(v.id("_storage")),
        rawContentStorageId: v.optional(v.id("_storage")),
        tokensCount: v.number(),
    },
    handler: async (ctx, args) => {
        const sourceId = await ctx.db.insert("notebookSources", {
            notebookId: args.notebookId,
            name: args.name,
            type: args.type,
            isProcessing: false,
            originalFileStorageId: args.originalFileStorageId,
            rawContentStorageId: args.rawContentStorageId,
            hasEmbedding: false,
            tokensCount: args.tokensCount,
        });
        return sourceId;
    },
});

export const listSources = query({
    args: {
        notebookId: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("notebookSources")
            .withIndex("by_notebookId", (q) => q.eq("notebookId", args.notebookId as any))
            .collect();
    },
});

export const listNotebooks = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("notebooks").collect();
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const deleteSource = mutation({
    args: { sourceId: v.id("notebookSources") },
    handler: async (ctx, args) => {
        const source = await ctx.db.get(args.sourceId);
        if (!source) throw new Error("Source not found");

        // Delete from storage if exists
        if (source.originalFileStorageId) {
            await ctx.storage.delete(source.originalFileStorageId);
        }
        if (source.rawContentStorageId) {
            await ctx.storage.delete(source.rawContentStorageId);
        }

        await ctx.db.delete(args.sourceId);
    },
});

export const getRawContentUrl = query({
    args: { storageId: v.optional(v.id("_storage")) },
    handler: async (ctx, args) => {
        if (!args.storageId) return null;
        return await ctx.storage.getUrl(args.storageId);
    },
});

/** Insert all chunk placeholder rows upfront with status "pending". Returns their IDs in order. */
export const preSaveChunks = mutation({
    args: {
        notebookSourceId: v.id("notebookSources"),
        chunks: v.array(
            v.object({
                content: v.string(),
                chunkIndex: v.number(),
                tokenCount: v.number(),
            })
        ),
    },
    handler: async (ctx, args) => {
        const ids: string[] = [];
        for (const c of args.chunks) {
            const id = await ctx.db.insert("notebookSourceChunks", {
                notebookSourceId: args.notebookSourceId,
                content: c.content,
                chunkIndex: c.chunkIndex,
                status: "pending",
                tokenCount: c.tokenCount,
            });
            ids.push(id);
        }
        return ids;
    },
});

/** Mark a single chunk as "processing" (embedding started). */
export const setChunkProcessing = mutation({
    args: { chunkId: v.id("notebookSourceChunks") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.chunkId, { status: "processing" });
    },
});

/** Store the embedding result and mark the chunk "complete". */
export const setChunkComplete = mutation({
    args: {
        chunkId: v.id("notebookSourceChunks"),
        embedding: v.array(v.float64()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.chunkId, {
            embedding: args.embedding,
            status: "complete",
        });
    },
});

/** Finalise the source: all chunks done, flip hasEmbedding and clear isProcessing. */
export const markSourceEmbedded = mutation({
    args: { sourceId: v.id("notebookSources") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.sourceId, { hasEmbedding: true, isProcessing: false });
    },
});
