"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DebateCard } from "@/components/DebateCard";
import { useUser, useAuth } from "@clerk/nextjs";
import { useHeartbeat } from "@/lib/useHeartbeat";

export default function Home() {
  const { user } = useUser();
  const { isSignedIn } = useAuth();
  const currentUser = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );
  const myDebates = useQuery(
    api.debates.getByParticipantScheduledOrLive,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const liveDebates = useQuery(api.debates.getLiveDebates);

  // Track user as online
  useHeartbeat(currentUser?._id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {isSignedIn && currentUser && (
        <>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">My Debates</h2>
            {myDebates === undefined ? (
              <div>Loading your debates...</div>
            ) : myDebates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                You don't have any scheduled or live debates.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {myDebates.map((debate) => (
                  <DebateCard key={debate._id} debate={debate} />
                ))}
              </div>
            )}
          </div>
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Upcoming Debates</h2>
            {myDebates === undefined ? (
              <div>Loading upcoming debates...</div>
            ) : myDebates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                You don't have any upcoming debates.
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
                {myDebates.map((debate) => (
                  <DebateCard key={debate._id} debate={debate} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
      <div className="mb-6">
        <h2 className="text-3xl font-bold">Live Debates</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Live debates from the past 24 hours
        </p>
      </div>

      {liveDebates === undefined ? (
        <div>Loading debates...</div>
      ) : liveDebates.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No live debates at the moment. Check back soon!
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {liveDebates.map((debate) => (
            <DebateCard key={debate._id} debate={debate} />
          ))}
        </div>
      )}
    </div>
  );
}

