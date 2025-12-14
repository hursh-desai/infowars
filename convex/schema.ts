import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    ideologyTags: v.array(v.string()),
    xProfile: v.optional(v.string()),
    blueskyProfile: v.optional(v.string()),
    highlightedMedia: v.array(
      v.object({
        title: v.string(),
        url: v.string(),
        description: v.optional(v.string()),
      })
    ),
    followers: v.array(v.id("users")),
    following: v.array(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"]),

  debates: defineTable({
    title: v.string(),
    participant1: v.id("users"),
    participant2: v.id("users"),
    status: v.union(
      v.literal("scheduled"),
      v.literal("live"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    scheduledStartTime: v.number(),
    actualStartTime: v.optional(v.number()),
    actualEndTime: v.optional(v.number()),
    currentTurn: v.union(v.literal("participant1"), v.literal("participant2")),
    currentRound: v.union(
      v.literal("openingRemarks"),
      v.literal("point1"),
      v.literal("point2"),
      v.literal("point3"),
      v.literal("closingRemarks")
    ),
    roundStartTime: v.optional(v.number()),
    viewerCount: v.number(),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_participant1", ["participant1"])
    .index("by_participant2", ["participant2"])
    .index("by_scheduled_time", ["scheduledStartTime"]),

  debateMessages: defineTable({
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
    timestamp: v.number(),
    order: v.number(),
  })
    .index("by_debate", ["debateId"])
    .index("by_debate_round", ["debateId", "round"]),

  spectatorMessages: defineTable({
    debateId: v.id("debates"),
    authorId: v.id("users"),
    content: v.string(),
    timestamp: v.number(),
  })
    .index("by_debate", ["debateId"]),

  challenges: defineTable({
    challengerId: v.id("users"),
    recipientId: v.id("users"),
    title: v.string(),
    scheduledTime: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("expired")
    ),
    createdAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_challenger", ["challengerId"])
    .index("by_recipient", ["recipientId"])
    .index("by_status", ["status"]),
});
