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

  const slug = participant1 && participant2
    ? `${participant1.username}+${participant2.username}`
    : "";

  const timeElapsed = debate.actualStartTime
    ? Math.floor((Date.now() - debate.actualStartTime) / 1000 / 60)
    : 0;

  return (
    <Link
      href={`/live/${slug}`}
      className="block p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
    >
      <h3 className="text-xl font-semibold mb-2">{debate.title}</h3>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {participant1?.username || "Loading..."} vs{" "}
        {participant2?.username || "Loading..."}
      </div>
      <div className="flex gap-4 text-sm text-gray-500 dark:text-gray-500">
        <span>{debate.viewerCount} viewers</span>
        <span>{timeElapsed} min ago</span>
      </div>
    </Link>
  );
}
