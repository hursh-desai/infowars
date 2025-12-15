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

export const getLiveDebates = query({
  args: {},
  handler: async (ctx) => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    // Get all live debates that started in the past 24 hours
    const liveDebates = await ctx.db
      .query("debates")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();
    
    const recentLiveDebates = liveDebates.filter((debate) => {
      // Use actualStartTime if available, otherwise use createdAt
      const startTime = debate.actualStartTime || debate.createdAt;
      return startTime >= twentyFourHoursAgo;
    });
    
    // Sort by start time (most recent first)
    return recentLiveDebates.sort((a, b) => {
      const startTimeA = a.actualStartTime || a.createdAt;
      const startTimeB = b.actualStartTime || b.createdAt;
      return startTimeB - startTimeA;
    });
  },
});

export const getRecentDebates = query({
  args: {},
  handler: async (ctx) => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    // Get all debates (live and completed) that started in the past 24 hours
    const allDebates = await ctx.db.query("debates").collect();
    
    const recentDebates = allDebates.filter((debate) => {
      // Use actualStartTime if available, otherwise use createdAt
      const startTime = debate.actualStartTime || debate.createdAt;
      return startTime >= twentyFourHoursAgo && 
             (debate.status === "live" || debate.status === "completed");
    });
    
    // Sort: live debates first, then completed
    // Within each group, sort by start time (most recent first)
    return recentDebates.sort((a, b) => {
      const startTimeA = a.actualStartTime || a.createdAt;
      const startTimeB = b.actualStartTime || b.createdAt;
      
      // Live debates come first
      if (a.status === "live" && b.status !== "live") return -1;
      if (a.status !== "live" && b.status === "live") return 1;
      
      // Within same status, sort by start time (most recent first)
      return startTimeB - startTimeA;
    });
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

export const addViewer = mutation({
  args: { 
    debateId: v.id("debates"),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const debate = await ctx.db.get(args.debateId);
    if (!debate) return;

    // Clean up stale viewers (haven't updated in 2+ minutes)
    const STALE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
    const now = Date.now();
    const allViewers = await ctx.db
      .query("debateViewers")
      .withIndex("by_debate", (q) => q.eq("debateId", args.debateId))
      .collect();

    for (const viewer of allViewers) {
      if (now - viewer.lastSeenAt > STALE_THRESHOLD) {
        await ctx.db.delete(viewer._id);
      }
    }

    // Check if viewer already exists
    if (args.userId) {
      const existing = await ctx.db
        .query("debateViewers")
        .withIndex("by_debate_user", (q) => 
          q.eq("debateId", args.debateId).eq("userId", args.userId)
        )
        .first();
      
      if (existing) {
        // Update last seen time
        await ctx.db.patch(existing._id, {
          lastSeenAt: Date.now(),
        });
        // Recalculate count after cleanup
        const activeViewers = await ctx.db
          .query("debateViewers")
          .withIndex("by_debate", (q) => q.eq("debateId", args.debateId))
          .collect();
        await ctx.db.patch(args.debateId, {
          viewerCount: activeViewers.length,
        });
        return;
      }
    } else if (args.sessionId) {
      const existing = await ctx.db
        .query("debateViewers")
        .withIndex("by_debate_session", (q) => 
          q.eq("debateId", args.debateId).eq("sessionId", args.sessionId)
        )
        .first();
      
      if (existing) {
        // Update last seen time
        await ctx.db.patch(existing._id, {
          lastSeenAt: Date.now(),
        });
        // Recalculate count after cleanup
        const activeViewers = await ctx.db
          .query("debateViewers")
          .withIndex("by_debate", (q) => q.eq("debateId", args.debateId))
          .collect();
        await ctx.db.patch(args.debateId, {
          viewerCount: activeViewers.length,
        });
        return;
      }
    }

    // Add new viewer
    await ctx.db.insert("debateViewers", {
      debateId: args.debateId,
      userId: args.userId,
      sessionId: args.sessionId,
      lastSeenAt: Date.now(),
    });

    // Update viewer count
    const activeViewers = await ctx.db
      .query("debateViewers")
      .withIndex("by_debate", (q) => q.eq("debateId", args.debateId))
      .collect();
    
    await ctx.db.patch(args.debateId, {
      viewerCount: activeViewers.length,
    });
  },
});

export const removeViewer = mutation({
  args: { 
    debateId: v.id("debates"),
    userId: v.optional(v.id("users")),
    sessionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const debate = await ctx.db.get(args.debateId);
    if (!debate) return;

    let viewerToRemove = null;

    if (args.userId) {
      viewerToRemove = await ctx.db
        .query("debateViewers")
        .withIndex("by_debate_user", (q) => 
          q.eq("debateId", args.debateId).eq("userId", args.userId)
        )
        .first();
    } else if (args.sessionId) {
      viewerToRemove = await ctx.db
        .query("debateViewers")
        .withIndex("by_debate_session", (q) => 
          q.eq("debateId", args.debateId).eq("sessionId", args.sessionId)
        )
        .first();
    }

    if (viewerToRemove) {
      await ctx.db.delete(viewerToRemove._id);
    }

    // Update viewer count
    const activeViewers = await ctx.db
      .query("debateViewers")
      .withIndex("by_debate", (q) => q.eq("debateId", args.debateId))
      .collect();
    
    await ctx.db.patch(args.debateId, {
      viewerCount: activeViewers.length,
    });
  },
});

// Legacy mutations for backward compatibility (deprecated)
export const incrementViewerCount = mutation({
  args: { debateId: v.id("debates") },
  handler: async (ctx, args) => {
    // This is deprecated - use addViewer instead
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
    // This is deprecated - use removeViewer instead
    const debate = await ctx.db.get(args.debateId);
    if (!debate || debate.viewerCount === 0) return;
    await ctx.db.patch(args.debateId, {
      viewerCount: debate.viewerCount - 1,
    });
  },
});

export const cleanupStaleViewers = mutation({
  args: { debateId: v.id("debates") },
  handler: async (ctx, args) => {
    const STALE_THRESHOLD = 2 * 60 * 1000; // 2 minutes
    const now = Date.now();

    const viewers = await ctx.db
      .query("debateViewers")
      .withIndex("by_debate", (q) => q.eq("debateId", args.debateId))
      .collect();

    // Remove viewers who haven't updated in 2+ minutes
    for (const viewer of viewers) {
      if (now - viewer.lastSeenAt > STALE_THRESHOLD) {
        await ctx.db.delete(viewer._id);
      }
    }

    // Recalculate viewer count
    const activeViewers = await ctx.db
      .query("debateViewers")
      .withIndex("by_debate", (q) => q.eq("debateId", args.debateId))
      .collect();
    
    await ctx.db.patch(args.debateId, {
      viewerCount: activeViewers.length,
    });
  },
});

export const recalculateViewerCount = mutation({
  args: { debateId: v.id("debates") },
  handler: async (ctx, args) => {
    const activeViewers = await ctx.db
      .query("debateViewers")
      .withIndex("by_debate", (q) => q.eq("debateId", args.debateId))
      .collect();
    
    await ctx.db.patch(args.debateId, {
      viewerCount: activeViewers.length,
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

export const getByParticipantScheduledOrLive = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const asParticipant1 = await ctx.db
      .query("debates")
      .withIndex("by_participant1", (q) => q.eq("participant1", args.userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "scheduled"),
          q.eq(q.field("status"), "live")
        )
      )
      .collect();

    const asParticipant2 = await ctx.db
      .query("debates")
      .withIndex("by_participant2", (q) => q.eq("participant2", args.userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("status"), "scheduled"),
          q.eq(q.field("status"), "live")
        )
      )
      .collect();

    const allDebates = [...asParticipant1, ...asParticipant2];
    
    // Remove duplicates (in case a debate appears in both queries)
    const uniqueDebates = Array.from(
      new Map(allDebates.map((debate) => [debate._id, debate])).values()
    );

    // Explicitly filter out completed and cancelled debates as a safety measure
    const filteredDebates = uniqueDebates.filter(
      (debate) => debate.status === "scheduled" || debate.status === "live"
    );

    return filteredDebates.sort((a, b) => {
      // Sort by scheduled time for scheduled, actual start time for live
      const timeA = a.status === "scheduled" 
        ? a.scheduledStartTime 
        : (a.actualStartTime || 0);
      const timeB = b.status === "scheduled" 
        ? b.scheduledStartTime 
        : (b.actualStartTime || 0);
      return timeB - timeA;
    });
  },
});

export const searchByTitle = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (args.searchTerm.length < 1) return [];
    
    const allDebates = await ctx.db.query("debates").collect();
    const searchLower = args.searchTerm.toLowerCase();
    
    return allDebates
      .filter((debate) => debate.title.toLowerCase().includes(searchLower))
      .slice(0, 20)
      .map((debate) => ({
        _id: debate._id,
        title: debate.title,
        status: debate.status,
        participant1: debate.participant1,
        participant2: debate.participant2,
        viewerCount: debate.viewerCount,
        scheduledStartTime: debate.scheduledStartTime,
        actualStartTime: debate.actualStartTime,
      }));
  },
});
