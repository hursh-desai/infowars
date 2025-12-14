import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { api } from "./_generated/api";

export const create = mutation({
  args: {
    challengerId: v.id("users"),
    recipientId: v.id("users"),
    title: v.string(),
    scheduledTime: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.challengerId === args.recipientId) {
      throw new Error("Cannot challenge yourself");
    }

    return await ctx.db.insert("challenges", {
      challengerId: args.challengerId,
      recipientId: args.recipientId,
      title: args.title,
      scheduledTime: args.scheduledTime,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const getIncoming = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_recipient", (q) => q.eq("recipientId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .collect();
  },
});

export const getOutgoing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("challenges")
      .withIndex("by_challenger", (q) => q.eq("challengerId", args.userId))
      .order("desc")
      .collect();
  },
});

export const accept = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.status !== "pending") {
      throw new Error("Challenge not found or not pending");
    }

    await ctx.db.patch(args.challengeId, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    // Create debate automatically
    await ctx.runMutation(api.debates.create, {
      title: challenge.title,
      participant1: challenge.challengerId,
      participant2: challenge.recipientId,
      scheduledStartTime: challenge.scheduledTime,
    });
  },
});

export const decline = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.status !== "pending") {
      throw new Error("Challenge not found or not pending");
    }

    await ctx.db.patch(args.challengeId, {
      status: "declined",
      respondedAt: Date.now(),
    });
  },
});
