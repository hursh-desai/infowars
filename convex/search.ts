import { v } from "convex/values";
import { query } from "./_generated/server";

export const search = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (args.searchTerm.length < 1) {
      return {
        users: [],
        debates: [],
        hashtags: [],
      };
    }

    const searchLower = args.searchTerm.toLowerCase().trim();
    const isHashtag = searchLower.startsWith("#");
    const searchWithoutHash = isHashtag ? searchLower.slice(1) : searchLower;

    // Search users by handle
    const allUsers = await ctx.db.query("users").collect();
    const matchingUsers = allUsers
      .filter(
        (user) =>
          user.username.toLowerCase().includes(searchWithoutHash) ||
          user.displayName?.toLowerCase().includes(searchWithoutHash)
      )
      .slice(0, 10)
      .map((user) => ({
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
      }));

    // Search debates by title
    const allDebates = await ctx.db.query("debates").collect();
    const matchingDebates = allDebates
      .filter((debate) =>
        debate.title.toLowerCase().includes(searchWithoutHash)
      )
      .slice(0, 10)
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

    // Search hashtags (ideology tags)
    const matchingHashtags = new Set<string>();
    allUsers.forEach((user) => {
      user.ideologyTags.forEach((tag) => {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes(searchWithoutHash)) {
          matchingHashtags.add(tag);
        }
      });
    });

    // If searching with #, prioritize hashtag results
    const hashtagArray = Array.from(matchingHashtags)
      .slice(0, 10)
      .map((tag) => ({
        tag,
        count: allUsers.filter((u) =>
          u.ideologyTags.some((t) => t.toLowerCase() === tag.toLowerCase())
        ).length,
      }));

    return {
      users: matchingUsers,
      debates: matchingDebates,
      hashtags: hashtagArray,
    };
  },
});

