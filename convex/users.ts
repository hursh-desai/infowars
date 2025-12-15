import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
  },
});

export const createOrUpdate = mutation({
  args: {
    clerkId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      // Update existing user
      return await ctx.db.patch(existing._id, {
        username: args.username,
        displayName: args.displayName,
        bio: args.bio,
      });
    } else {
      // Create new user
      return await ctx.db.insert("users", {
        clerkId: args.clerkId,
        username: args.username,
        displayName: args.displayName,
        bio: args.bio,
        ideologyTags: [],
        highlightedMedia: [],
        followers: [],
        following: [],
        createdAt: Date.now(),
      });
    }
  },
});

export const updateProfile = mutation({
  args: {
    userId: v.id("users"),
    bio: v.optional(v.string()),
    ideologyTags: v.optional(v.array(v.string())),
    xProfile: v.optional(v.string()),
    blueskyProfile: v.optional(v.string()),
    highlightedMedia: v.optional(
      v.array(
        v.object({
          title: v.string(),
          url: v.string(),
          description: v.optional(v.string()),
        })
      )
    ),
    notificationChallengeCreated: v.optional(v.boolean()),
    notificationChallengeAccepted: v.optional(v.boolean()),
    notificationDebateStarting: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { userId, ...updates } = args;
    await ctx.db.patch(userId, updates);
  },
});

export const searchByUsername = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    if (args.searchTerm.length < 1) return [];
    
    const allUsers = await ctx.db.query("users").collect();
    const searchLower = args.searchTerm.toLowerCase();
    
    return allUsers
      .filter(
        (user) =>
          user.username.toLowerCase().includes(searchLower) ||
          user.displayName?.toLowerCase().includes(searchLower)
      )
      .slice(0, 10)
      .map((user) => ({
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
      }));
  },
});

export const updateLastSeen = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      lastSeenAt: Date.now(),
    });
  },
});

export const getOnlineUsers = query({
  args: { excludeUserId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    const thirtySecondsAgo = Date.now() - 30000;
    const allUsers = await ctx.db.query("users").collect();
    
    return allUsers
      .filter((user) => {
        if (args.excludeUserId && user._id === args.excludeUserId) {
          return false;
        }
        return user.lastSeenAt && user.lastSeenAt > thirtySecondsAgo;
      })
      .map((user) => ({
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        ideologyTags: user.ideologyTags,
        lastSeenAt: user.lastSeenAt,
      }))
      .sort((a, b) => (b.lastSeenAt || 0) - (a.lastSeenAt || 0));
  },
});
