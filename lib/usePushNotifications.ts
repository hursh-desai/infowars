"use client";

import { useEffect, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

// Convert VAPID public key from base64 URL to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission | null;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const { user, isLoaded } = useUser();
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    permission: null,
    isSubscribed: false,
    isLoading: false,
    error: null,
  });

  // Get Convex user from Clerk ID
  const currentUser = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const subscribeMutation = useMutation(api.pushNotifications.subscribe);
  const unsubscribeMutation = useMutation(api.pushNotifications.unsubscribe);
  const subscriptionQuery = useQuery(
    api.pushNotifications.getSubscription,
    currentUser ? { userId: currentUser._id } : "skip"
  );

  // Check if push notifications are supported
  useEffect(() => {
    const isSupported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setState((prev) => ({ ...prev, isSupported }));

    if (isSupported && "Notification" in window) {
      setState((prev) => ({
        ...prev,
        permission: Notification.permission,
      }));
    }
  }, []);

  // Update subscription status when query changes
  useEffect(() => {
    if (subscriptionQuery !== undefined) {
      setState((prev) => ({
        ...prev,
        isSubscribed: subscriptionQuery !== null,
      }));
    }
  }, [subscriptionQuery]);

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    if (!("serviceWorker" in navigator)) {
      setState((prev) => ({
        ...prev,
        error: "Service workers are not supported",
      }));
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      return registration;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: `Service worker registration failed: ${error.message}`,
      }));
      return null;
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!("Notification" in window)) {
      setState((prev) => ({
        ...prev,
        error: "Notifications are not supported",
      }));
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission !== "granted") {
        setState((prev) => ({
          ...prev,
          error: "Notification permission denied",
        }));
        return false;
      }

      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: `Permission request failed: ${error.message}`,
      }));
      return false;
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isLoaded || !user || !currentUser) {
      setState((prev) => ({
        ...prev,
        error: "User not loaded",
      }));
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        return false;
      }

      // Request permission
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        return false;
      }

      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setState((prev) => ({
          ...prev,
          error: "VAPID public key not configured",
          isLoading: false,
        }));
        return false;
      }

      // Subscribe to push service
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Get user ID from Convex (we need to get it by Clerk ID)
      // For now, we'll assume we have a way to get the Convex user ID
      // This might need to be adjusted based on your user lookup logic
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey("p256dh")!),
          auth: arrayBufferToBase64(subscription.getKey("auth")!),
        },
      };

      // Store subscription in Convex
      await subscribeMutation({
        userId: currentUser._id,
        subscription: subscriptionData,
      });

      setState((prev) => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: `Subscription failed: ${error.message}`,
        isLoading: false,
      }));
      return false;
    }
  }, [isLoaded, user, currentUser, registerServiceWorker, requestPermission, subscribeMutation]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isLoaded || !user || !currentUser) {
      return false;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        await unsubscribeMutation({
          endpoint: subscription.endpoint,
        });
      }

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        isLoading: false,
      }));

      return true;
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        error: `Unsubscription failed: ${error.message}`,
        isLoading: false,
      }));
      return false;
    }
  }, [isLoaded, user, currentUser, unsubscribeMutation]);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

// Helper function to convert ArrayBuffer to base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

