import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const send = mutation({
  args: {
    debateId: v.id("debates"),
    authorId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const debate = await ctx.db.get(args.debateId);
    if (!debate || debate.status !== "live") {
      throw new Error("Debate not found or not live");
    }

    await ctx.db.insert("spectatorMessages", {
      debateId: args.debateId,
      authorId: args.authorId,
      content: args.content,
      timestamp: Date.now(),
    });
  },
});

export const getByDebate = query({
  args: { debateId: v.id("debates") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("spectatorMessages")
      .withIndex("by_debate", (q) => q.eq("debateId", args.debateId))
      .order("desc")
      .take(50);

    // Include author info
    const messagesWithAuthors = await Promise.all(
      messages.map(async (msg) => {
        const author = await ctx.db.get(msg.authorId);
        return {
          ...msg,
          author: author
            ? {
                _id: author._id,
                username: author.username,
                displayName: author.displayName,
              }
            : null,
        };
      })
    );

    return messagesWithAuthors.reverse(); // Reverse to show oldest first
  },
});
