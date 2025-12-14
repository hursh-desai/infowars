import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    title: v.string(),
    participant1: v.id("users"),
    participant2: v.id("users"),
    scheduledStartTime: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("debates", {
      title: args.title,
      participant1: args.participant1,
      participant2: args.participant2,
      status: "scheduled",
      scheduledStartTime: args.scheduledStartTime,
      currentTurn: "participant1",
      currentRound: "openingRemarks",
      viewerCount: 0,
      createdAt: Date.now(),
    });
  },
});

export const getById = query({
  args: { debateId: v.id("debates") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.debateId);
  },
});

export const getBySlug = query({
  args: { username1: v.string(), username2: v.string() },
  handler: async (ctx, args) => {
    const user1 = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username1))
      .first();
    const user2 = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username2))
      .first();

    if (!user1 || !user2) return null;

    const debate = await ctx.db
      .query("debates")
      .withIndex("by_participant1", (q) => q.eq("participant1", user1._id))
      .filter((q) => q.eq(q.field("participant2"), user2._id))
      .filter((q) => q.eq(q.field("status"), "live"))
      .first();

    if (debate) return debate;

    // Try reverse order
    return await ctx.db
      .query("debates")
      .withIndex("by_participant1", (q) => q.eq("participant1", user2._id))
      .filter((q) => q.eq(q.field("participant2"), user1._id))
      .filter((q) => q.eq(q.field("status"), "live"))
      .first();
  },
});

export const getActive = query({
  args: { sortBy: v.union(v.literal("hot"), v.literal("recent")) },
  handler: async (ctx, args) => {
    const debates = await ctx.db
      .query("debates")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();

    if (args.sortBy === "hot") {
      return debates.sort((a, b) => b.viewerCount - a.viewerCount);
    } else {
      return debates.sort(
        (a, b) => (b.actualStartTime || 0) - (a.actualStartTime || 0)
      );
    }
  },
});

export const start = mutation({
  args: { debateId: v.id("debates") },
  handler: async (ctx, args) => {
    const debate = await ctx.db.get(args.debateId);
    if (!debate || debate.status !== "scheduled") {
      throw new Error("Debate not found or not scheduled");
    }

    const now = Date.now();
    await ctx.db.patch(args.debateId, {
      status: "live",
      actualStartTime: now,
      roundStartTime: now,
    });
  },
});

export const advanceRound = mutation({
  args: { debateId: v.id("debates") },
  handler: async (ctx, args) => {
    const debate = await ctx.db.get(args.debateId);
    if (!debate || debate.status !== "live") {
      throw new Error("Debate not found or not live");
    }

    const roundOrder = [
      "openingRemarks",
      "point1",
      "point2",
      "point3",
      "closingRemarks",
    ];
    const currentIndex = roundOrder.indexOf(debate.currentRound);

    if (currentIndex === -1) {
      throw new Error("Invalid round");
    }

    // Switch turn
    const nextTurn =
      debate.currentTurn === "participant1" ? "participant2" : "participant1";

    // If switching back to participant1, advance round
    let nextRound = debate.currentRound;
    if (nextTurn === "participant1") {
      if (currentIndex < roundOrder.length - 1) {
        nextRound = roundOrder[currentIndex + 1] as typeof debate.currentRound;
      } else {
        // Debate is complete
        await ctx.db.patch(args.debateId, {
          status: "completed",
          actualEndTime: Date.now(),
        });
        return;
      }
    }

    await ctx.db.patch(args.debateId, {
      currentTurn: nextTurn,
      currentRound: nextRound,
      roundStartTime: Date.now(),
    });
  },
});

export const incrementViewerCount = mutation({
  args: { debateId: v.id("debates") },
  handler: async (ctx, args) => {
    const debate = await ctx.db.get(args.debateId);
    if (!debate) return;
    await ctx.db.patch(args.debateId, {
      viewerCount: debate.viewerCount + 1,
    });
  },
});

export const decrementViewerCount = mutation({
  args: { debateId: v.id("debates") },
  handler: async (ctx, args) => {
    const debate = await ctx.db.get(args.debateId);
    if (!debate || debate.viewerCount === 0) return;
    await ctx.db.patch(args.debateId, {
      viewerCount: debate.viewerCount - 1,
    });
  },
});

export const getByParticipant = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const asParticipant1 = await ctx.db
      .query("debates")
      .withIndex("by_participant1", (q) => q.eq("participant1", args.userId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    const asParticipant2 = await ctx.db
      .query("debates")
      .withIndex("by_participant2", (q) => q.eq("participant2", args.userId))
      .filter((q) => q.eq(q.field("status"), "completed"))
      .collect();

    return [...asParticipant1, ...asParticipant2].sort(
      (a, b) => (b.actualEndTime || 0) - (a.actualEndTime || 0)
    );
  },
});
