import { query, mutation } from "../_generated/server";
import { v } from "convex/values";

export const getConfig = query({
    args: { key: v.string() },
    handler: async (ctx, args) => {
        const config = await ctx.db
            .query("config")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .first();
        return config?.value;
    },
});

export const setConfig = mutation({
    args: {
        key: v.string(),
        value: v.union(v.string(), v.number(), v.boolean()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("config")
            .withIndex("by_key", (q) => q.eq("key", args.key))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { value: args.value });
        } else {
            await ctx.db.insert("config", {
                key: args.key,
                value: args.value,
            });
        }
    },
});

export const getAllConfigs = query({
    handler: async (ctx) => {
        const configs = await ctx.db.query("config").collect();
        return configs.reduce((acc, config) => {
            acc[config.key] = config.value;
            return acc;
        }, {} as Record<string, string | number | boolean>);
    },
});
