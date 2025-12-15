import { internalMutation } from "./_generated/server";
import { api } from "./_generated/api";

export const checkScheduledDebates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const scheduledDebates = await ctx.db
      .query("debates")
      .withIndex("by_status", (q) => q.eq("status", "scheduled"))
      .filter((q) => q.lte(q.field("scheduledStartTime"), now))
      .collect();

    for (const debate of scheduledDebates) {
      await ctx.db.patch(debate._id, {
        status: "live",
        actualStartTime: now,
        roundStartTime: now,
      });

      // Get participant usernames for notifications
      const participant1 = await ctx.db.get(debate.participant1);
      const participant2 = await ctx.db.get(debate.participant2);
      const participant1Username = participant1?.username || "User";
      const participant2Username = participant2?.username || "User";

      // Trigger notifications to both participants (async, don't wait)
      ctx.scheduler.runAfter(0, (api as any).pushNotificationsActions.notifyDebateStarted, {
        participantId: debate.participant1,
        opponentUsername: participant2Username,
        debateTitle: debate.title,
        debateId: debate._id,
      });

      ctx.scheduler.runAfter(0, (api as any).pushNotificationsActions.notifyDebateStarted, {
        participantId: debate.participant2,
        opponentUsername: participant1Username,
        debateTitle: debate.title,
        debateId: debate._id,
      });
    }
  },
});

export const checkRoundTimers = internalMutation({
  args: {},
  handler: async (ctx) => {
    const liveDebates = await ctx.db
      .query("debates")
      .withIndex("by_status", (q) => q.eq("status", "live"))
      .collect();

    const ROUND_DURATION = 60 * 1000; // 1 minute in milliseconds
    const now = Date.now();

    for (const debate of liveDebates) {
      if (!debate.roundStartTime) continue;

      const elapsed = now - debate.roundStartTime;
      if (elapsed >= ROUND_DURATION) {
        // Advance round
        const roundOrder = [
          "openingRemarks",
          "point1",
          "point2",
          "point3",
          "closingRemarks",
        ];
        const currentIndex = roundOrder.indexOf(debate.currentRound);

        if (currentIndex === -1) continue;

        const nextTurn =
          debate.currentTurn === "participant1"
            ? "participant2"
            : "participant1";

        let nextRound = debate.currentRound;
        if (nextTurn === "participant1") {
          if (currentIndex < roundOrder.length - 1) {
            nextRound = roundOrder[
              currentIndex + 1
            ] as typeof debate.currentRound;
          } else {
            // Debate complete
            await ctx.db.patch(debate._id, {
              status: "completed",
              actualEndTime: Date.now(),
            });
            continue;
          }
        }

        await ctx.db.patch(debate._id, {
          currentTurn: nextTurn,
          currentRound: nextRound,
          roundStartTime: Date.now(),
        });
      }
    }
  },
});

// Note: These would be called by Convex cron jobs or scheduled actions
// For now, we'll handle timing client-side with server state checks
