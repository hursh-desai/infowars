import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const follow = mutation({
  args: {
    followerId: v.id("users"),
    followeeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    if (args.followerId === args.followeeId) {
      throw new Error("Cannot follow yourself");
    }

    const follower = await ctx.db.get(args.followerId);
    const followee = await ctx.db.get(args.followeeId);

    if (!follower || !followee) {
      throw new Error("User not found");
    }

    if (follower.following.includes(args.followeeId)) {
      return; // Already following
    }

    await ctx.db.patch(args.followerId, {
      following: [...follower.following, args.followeeId],
    });

    await ctx.db.patch(args.followeeId, {
      followers: [...followee.followers, args.followerId],
    });
  },
});

export const unfollow = mutation({
  args: {
    followerId: v.id("users"),
    followeeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const follower = await ctx.db.get(args.followerId);
    const followee = await ctx.db.get(args.followeeId);

    if (!follower || !followee) {
      throw new Error("User not found");
    }

    await ctx.db.patch(args.followerId, {
      following: follower.following.filter((id) => id !== args.followeeId),
    });

    await ctx.db.patch(args.followeeId, {
      followers: followee.followers.filter((id) => id !== args.followerId),
    });
  },
});

export const getFollowing = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const followingUsers = await Promise.all(
      user.following.map((id) => ctx.db.get(id))
    );

    return followingUsers.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});

export const getFollowers = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    const followerUsers = await Promise.all(
      user.followers.map((id) => ctx.db.get(id))
    );

    return followerUsers.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});

export const isFollowing = query({
  args: {
    followerId: v.id("users"),
    followeeId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const follower = await ctx.db.get(args.followerId);
    if (!follower) return false;
    return follower.following.includes(args.followeeId);
  },
});
