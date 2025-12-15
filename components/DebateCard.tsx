"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface DebateCardProps {
  debate: {
    _id: Id<"debates">;
    title: string;
    participant1: Id<"users">;
    participant2: Id<"users">;
    viewerCount: number;
    status: "scheduled" | "live" | "completed" | "cancelled";
    scheduledStartTime?: number;
    actualStartTime?: number;
  };
}

export function DebateCard({ debate }: DebateCardProps) {
  const participant1 = useQuery(api.users.getById, {
    userId: debate.participant1,
  });
  const participant2 = useQuery(api.users.getById, {
    userId: debate.participant2,
  });

  const timeElapsed = debate.actualStartTime
    ? Math.floor((Date.now() - debate.actualStartTime) / 1000 / 60)
    : 0;

  const timeUntilStart = debate.scheduledStartTime && debate.status === "scheduled"
    ? Math.floor((debate.scheduledStartTime - Date.now()) / 1000 / 60)
    : null;

  return (
    <Link
      href={`/debate/${debate._id}`}
      className="block p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-xl font-semibold">{debate.title}</h3>
        {debate.status === "scheduled" && (
          <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
            Scheduled
          </span>
        )}
        {debate.status === "live" && (
          <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">
            Live
          </span>
        )}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {participant1?.username || "Loading..."} vs{" "}
        {participant2?.username || "Loading..."}
      </div>
      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-500">
        {debate.status === "live" && (
          <>
            <span>{debate.viewerCount} viewers</span>
            <span>{timeElapsed} min ago</span>
          </>
        )}
        {debate.status === "scheduled" && timeUntilStart !== null && (
          <span>
            {timeUntilStart > 0
              ? `Starts in ${timeUntilStart} min`
              : "Starting soon"}
          </span>
        )}
      </div>
    </Link>
  );
}
