import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const submitDebateMessage = mutation({
  args: {
    debateId: v.id("debates"),
    authorId: v.id("users"),
    round: v.union(
      v.literal("openingRemarks"),
      v.literal("point1"),
      v.literal("point2"),
      v.literal("point3"),
      v.literal("closingRemarks")
    ),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const debate = await ctx.db.get(args.debateId);
    if (!debate || debate.status !== "live") {
      throw new Error("Debate not found or not live");
    }

    // Verify it's the correct turn
    const isParticipant1 = debate.participant1 === args.authorId;
    const isParticipant2 = debate.participant2 === args.authorId;
    if (!isParticipant1 && !isParticipant2) {
      throw new Error("User is not a participant");
    }

    const expectedTurn =
      (isParticipant1 && debate.currentTurn === "participant1") ||
      (isParticipant2 && debate.currentTurn === "participant2");

    if (!expectedTurn) {
      throw new Error("Not your turn");
    }

    if (debate.currentRound !== args.round) {
      throw new Error("Wrong round");
    }

    // Get existing messages for this round to determine order
    const existingMessages = await ctx.db
      .query("debateMessages")
      .withIndex("by_debate_round", (q) =>
        q.eq("debateId", args.debateId).eq("round", args.round)
      )
      .collect();

    const order = existingMessages.length;

    await ctx.db.insert("debateMessages", {
      debateId: args.debateId,
      authorId: args.authorId,
      round: args.round,
      content: args.content,
      timestamp: Date.now(),
      order,
    });

    // Automatically advance to next turn/round
    const updatedDebate = await ctx.db.get(args.debateId);
    if (!updatedDebate) return;

    const roundOrder = [
      "openingRemarks",
      "point1",
      "point2",
      "point3",
      "closingRemarks",
    ];
    const currentIndex = roundOrder.indexOf(updatedDebate.currentRound);

    if (currentIndex === -1) return;

    // Switch turn
    const nextTurn =
      updatedDebate.currentTurn === "participant1"
        ? "participant2"
        : "participant1";

    // If switching back to participant1, advance round
    let nextRound = updatedDebate.currentRound;
    if (nextTurn === "participant1") {
      if (currentIndex < roundOrder.length - 1) {
        nextRound = roundOrder[
          currentIndex + 1
        ] as typeof updatedDebate.currentRound;
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

export const getDebateMessages = query({
  args: { debateId: v.id("debates") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("debateMessages")
      .withIndex("by_debate", (q) => q.eq("debateId", args.debateId))
      .collect();

    return messages.sort((a, b) => {
      const roundOrder = [
        "openingRemarks",
        "point1",
        "point2",
        "point3",
        "closingRemarks",
      ];
      const roundDiff =
        roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round);
      if (roundDiff !== 0) return roundDiff;
      return a.order - b.order;
    });
  },
});
