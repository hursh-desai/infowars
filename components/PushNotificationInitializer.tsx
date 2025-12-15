"use client";

import { useEffect } from "react";

/**
 * Component that initializes push notifications on app load.
 * Registers the service worker.
 */
export function PushNotificationInitializer() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      // Register service worker on app load
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration.scope);
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error);
        });
    }
  }, []);

  // This component doesn't render anything
  return null;
}

