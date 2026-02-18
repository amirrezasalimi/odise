import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// config
export const setConfig = mutation({
    args: {
        key: v.string(),
        value: v.union(v.string(), v.number(), v.boolean()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db.query("config").filter((q) => q.eq(q.field("key"), args.key)).first();
        if (existing) {
            await ctx.db.replace(existing._id, args);
        } else {
            await ctx.db.insert("config", args);
        }
    }
})

export const getConfig = query({
    args: {
        key: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.query("config").filter((q) => q.eq(q.field("key"), args.key)).first();
    }
})