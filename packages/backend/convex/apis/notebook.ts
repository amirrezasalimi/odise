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
