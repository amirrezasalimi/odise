import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

export const getNotebooks = query({
    handler: async (ctx) => {
        const notebooks = await ctx.db.query("notebooks").order("desc").collect();

        // Get source count for each notebook
        const notebooksWithCounts = await Promise.all(
            notebooks.map(async (notebook) => {
                const sources = await ctx.db
                    .query("notebookSources")
                    .withIndex("by_notebookId", (q) => q.eq("notebookId", notebook._id))
                    .collect();
                return {
                    ...notebook,
                    sourceCount: sources.length,
                };
            })
        );

        return notebooksWithCounts;
    },
});

export const createNotebook = mutation({
    args: {
        title: v.string(),
        emoji: v.string(),
        description: v.string(),
    },
    handler: async (ctx, args) => {
        const notebookId = await ctx.db.insert("notebooks", {
            title: args.title,
            emoji: args.emoji,
            description: args.description,
        });
        return notebookId;
    },
});

export const addSource = mutation({
    args: {
        notebookId: v.id("notebooks"),
        name: v.string(),
        url: v.optional(v.string()),
        type: v.string(),
        storageId: v.id("_storage"),
        rawContent: v.string(),
    },
    handler: async (ctx, args) => {
        const sourceId = await ctx.db.insert("notebookSources", {
            name: args.name,
            url: args.url,
            type: args.type,
            isProcessing: false,
            storageId: args.storageId as any,
            rawContent: args.rawContent,
        });
        return sourceId;
    },
});