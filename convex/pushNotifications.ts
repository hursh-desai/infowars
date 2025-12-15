import { v } from "convex/values";
import { mutation, query, internalAction, ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// Store push subscription for a user
export const subscribe = mutation({
  args: {
    userId: v.id("users"),
    subscription: v.object({
      endpoint: v.string(),
      keys: v.object({
        p256dh: v.string(),
        auth: v.string(),
      }),
    }),
  },
  handler: async (ctx, args) => {
    // Check if subscription already exists for this endpoint
    const existing = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.subscription.endpoint))
      .first();

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, {
        userId: args.userId,
        endpoint: args.subscription.endpoint,
        keys: args.subscription.keys,
      });
      return existing._id;
    }

    // Create new subscription
    return await ctx.db.insert("pushSubscriptions", {
      userId: args.userId,
      endpoint: args.subscription.endpoint,
      keys: args.subscription.keys,
      createdAt: Date.now(),
    });
  },
});

// Remove push subscription
export const unsubscribe = mutation({
  args: {
    endpoint: v.string(),
  },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_endpoint", (q) => q.eq("endpoint", args.endpoint))
      .first();

    if (subscription) {
      await ctx.db.delete(subscription._id);
    }
  },
});

// Get push subscription for a user
export const getSubscription = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Get all push subscriptions for a user
export const getSubscriptions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pushSubscriptions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Helper function to send a push notification using web-push
async function sendNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; icon?: string; badge?: string; url?: string; tag?: string }
): Promise<void> {
  // Get VAPID keys from environment
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidSubject = process.env.VAPID_SUBJECT || "mailto:notifications@infowars.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    throw new Error("VAPID keys not configured");
  }

  try {
    // Try to use web-push library if available
    // Note: web-push needs to be installed as a dependency
    // Use require for Convex runtime compatibility
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const webPush = require("web-push") as {
      setVapidDetails: (subject: string, publicKey: string, privateKey: string) => void;
      sendNotification: (subscription: unknown, payload: string) => Promise<void>;
    };
    
    webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

    await webPush.sendNotification(subscription, JSON.stringify(payload));
  } catch (error: unknown) {
    // If web-push is not available, log error but don't fail
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error sending push notification (web-push may not be installed):", errorMessage);
    throw error;
  }
}

// Helper function to send notification to a user (used by internal actions)
async function notifyUserHelper(
  ctx: ActionCtx,
  userId: Id<"users">,
  notification: { title: string; body: string; icon?: string; badge?: string; url?: string; tag?: string }
): Promise<void> {
  // Get user's push subscriptions
  const subscriptions = await ctx.runQuery(api.pushNotifications.getSubscriptions, {
    userId,
  });

  if (subscriptions.length === 0) {
    return; // User has no push subscriptions
  }

  // Check user's notification preferences
  const user = await ctx.runQuery(api.users.getById, { userId });
  if (!user) return;

  // Determine which notification type this is based on tag or other criteria
  // For now, we'll send to all subscriptions
  const payload = {
    title: notification.title,
    body: notification.body,
    icon: notification.icon || "/favicon.ico",
    badge: notification.badge || "/favicon.ico",
    url: notification.url || "/",
    tag: notification.tag,
  };

  // Send notification to each subscription
  for (const subscription of subscriptions) {
    try {
      const subscriptionObj = {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      };

      await sendNotification(subscriptionObj, payload);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error sending notification to ${subscription.endpoint}:`, errorMessage);
      // If subscription is invalid, we might want to remove it
      // For now, just log the error
    }
  }
}

// Internal action: Notify when challenge is created
export const notifyChallengeCreated = internalAction({
  args: {
    recipientId: v.id("users"),
    challengerUsername: v.string(),
    challengeTitle: v.string(),
    challengeId: v.id("challenges"),
  },
  handler: async (ctx, args) => {
    // Check if user wants challenge created notifications
    const user = await ctx.runQuery(api.users.getById, { userId: args.recipientId });
    if (!user || user.notificationChallengeCreated === false) {
      return; // User has disabled this notification type
    }

    await notifyUserHelper(ctx, args.recipientId, {
      title: "New Challenge Received",
      body: `${args.challengerUsername} challenged you: "${args.challengeTitle}"`,
      url: `/challenges`,
      tag: `challenge-${args.challengeId}`,
    });
  },
});

// Internal action: Notify when challenge is accepted
export const notifyChallengeAccepted = internalAction({
  args: {
    challengerId: v.id("users"),
    recipientUsername: v.string(),
    challengeTitle: v.string(),
    debateId: v.id("debates"),
  },
  handler: async (ctx, args) => {
    // Check if user wants challenge accepted notifications
    const user = await ctx.runQuery(api.users.getById, { userId: args.challengerId });
    if (!user || user.notificationChallengeAccepted === false) {
      return; // User has disabled this notification type
    }

    await notifyUserHelper(ctx, args.challengerId, {
      title: "Challenge Accepted",
      body: `${args.recipientUsername} accepted your challenge: "${args.challengeTitle}"`,
      url: `/debate/${args.debateId}`,
      tag: `debate-${args.debateId}`,
    });
  },
});

// Internal action: Notify when debate starts
export const notifyDebateStarted = internalAction({
  args: {
    participantId: v.id("users"),
    opponentUsername: v.string(),
    debateTitle: v.string(),
    debateId: v.id("debates"),
  },
  handler: async (ctx, args) => {
    // Check if user wants debate starting notifications
    const user = await ctx.runQuery(api.users.getById, { userId: args.participantId });
    if (!user || user.notificationDebateStarting === false) {
      return; // User has disabled this notification type
    }

    await notifyUserHelper(ctx, args.participantId, {
      title: "Debate Started",
      body: `Your debate "${args.debateTitle}" with ${args.opponentUsername} has started!`,
      url: `/debate/${args.debateId}`,
      tag: `debate-${args.debateId}`,
    });
  },
});

