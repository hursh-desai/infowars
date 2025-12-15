import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export function useHeartbeat(userId: Id<"users"> | undefined) {
  const updateLastSeen = useMutation(api.users.updateLastSeen);

  useEffect(() => {
    if (!userId) return;

    // Update immediately
    updateLastSeen({ userId });

    // Then update every 15 seconds
    const interval = setInterval(() => {
      updateLastSeen({ userId });
    }, 15000);

    return () => clearInterval(interval);
  }, [userId, updateLastSeen]);
}

