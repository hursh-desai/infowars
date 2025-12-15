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

    const challengeId = await ctx.db.insert("challenges", {
      challengerId: args.challengerId,
      recipientId: args.recipientId,
      title: args.title,
      scheduledTime: args.scheduledTime,
      status: "pending",
      createdAt: Date.now(),
    });

    // Get challenger username for notification
    const challenger = await ctx.db.get(args.challengerId);
    const challengerUsername = challenger?.username || "Someone";

    // Trigger notification to recipient (async, don't wait)
    ctx.scheduler.runAfter(0, (api.pushNotifications as any).notifyChallengeCreated, {
      recipientId: args.recipientId,
      challengerUsername,
      challengeTitle: args.title,
      challengeId,
    });

    return challengeId;
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
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_challenger", (q) => q.eq("challengerId", args.userId))
      .order("desc")
      .collect();
    
    // Filter out challenges that have completed debates
    const filtered = [];
    for (const challenge of challenges) {
      // Check if there's a completed debate for this challenge
      // Match by participants, title, and scheduled time
      const debate = await ctx.db
        .query("debates")
        .withIndex("by_participant1", (q) => q.eq("participant1", challenge.challengerId))
        .filter((q) => q.eq(q.field("participant2"), challenge.recipientId))
        .filter((q) => q.eq(q.field("title"), challenge.title))
        .filter((q) => q.eq(q.field("scheduledStartTime"), challenge.scheduledTime))
        .filter((q) => q.eq(q.field("status"), "completed"))
        .first();
      
      // Only include if no completed debate exists
      if (!debate) {
        filtered.push(challenge);
      }
    }
    
    return filtered;
  },
});

export const accept = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args): Promise<string> => {
    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge || challenge.status !== "pending") {
      throw new Error("Challenge not found or not pending");
    }

    await ctx.db.patch(args.challengeId, {
      status: "accepted",
      respondedAt: Date.now(),
    });

    // Get recipient username for notification
    const recipient = await ctx.db.get(challenge.recipientId);
    const recipientUsername = recipient?.username || "Someone";

    // Create debate automatically
    const debateId = await ctx.runMutation(api.debates.create, {
      title: challenge.title,
      participant1: challenge.challengerId,
      participant2: challenge.recipientId,
      scheduledStartTime: challenge.scheduledTime,
    });

    // Trigger notification to challenger (async, don't wait)
    ctx.scheduler.runAfter(0, (api.pushNotifications as any).notifyChallengeAccepted, {
      challengerId: challenge.challengerId,
      recipientUsername,
      challengeTitle: challenge.title,
      debateId,
    });

    return debateId;
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
