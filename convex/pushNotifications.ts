import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Store push subscription for a user
export const subscribe = mutation({
  args: {
    userId: v.id("users"),
    subscription: v.object({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    // Check if subscription already exists for this endpoint
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.subscription.endpoint))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        userId: args.userId,
        endpoint: args.subscription.endpoint,
        keys: args.subscription.keys,
      });
      return existing._id;
    }

    // Create new subscription
    return await ctx.db.insert("pushSubscriptions", {
      userId: args.userId,
      endpoint: args.subscription.endpoint,
      keys: args.subscription.keys,
      createdAt: Date.now(),
    });
  },
});

// Remove push subscription
export const unsubscribe = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (subscription) {
      await ctx.db.delete(subscription._id);
    }
  },
});

// Get push subscription for a user
export const getSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get all push subscriptions for a user
export const getSubscriptions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});


