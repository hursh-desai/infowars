"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";

export default function ArchivePage({
  params,
}: {
  params: Promise<{ debateId: string }>;
}) {
  const { debateId } = use(params);
  const debate = useQuery(api.debates.getById, {
    debateId: debateId as Id<"debates">,
  });
  const messages = useQuery(api.messages.getDebateMessages, {
    debateId: debateId as Id<"debates">,
  });

  const { user: clerkUser } = useUser();
  const currentUser = useQuery(
    api.users.getByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  );

  const participant1 = debate
    ? useQuery(api.users.getById, { userId: debate.participant1 })
    : null;
  const participant2 = debate
    ? useQuery(api.users.getById, { userId: debate.participant2 })
    : null;

  if (debate === undefined) {
    return <div>Loading...</div>;
  }

  if (debate === null) {
    return <div>Debate not found</div>;
  }

  if (debate.status !== "completed") {
    return <div>This debate is not yet completed</div>;
  }

  const roundNames: Record<string, string> = {
    openingRemarks: "Opening Remarks",
    point1: "Point 1",
    point2: "Point 2",
    point3: "Point 3",
    closingRemarks: "Closing Remarks",
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <h1 className="text-3xl font-bold mb-2">{debate.title}</h1>
        <div className="text-gray-600 dark:text-gray-400 mb-4">
          {participant1?.username || "Loading..."} vs{" "}
          {participant2?.username || "Loading..."}
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-500">
          Completed:{" "}
          {debate.actualEndTime
            ? new Date(debate.actualEndTime).toLocaleString()
            : "Unknown"}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">Debate Transcript</h2>
        {messages === undefined ? (
          <div>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400">
            No messages in this debate
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => {
              const isP1 = msg.authorId === debate.participant1;
              const roundName = roundNames[msg.round];
              return (
                <div
                  key={msg._id}
                  className={`p-4 rounded-lg ${
                    isP1
                      ? "bg-blue-50 dark:bg-blue-900/20 ml-8"
                      : "bg-red-50 dark:bg-red-900/20 mr-8"
                  }`}
                >
                  <div className="font-semibold mb-1">
                    {isP1
                      ? participant1?.username || "Participant 1"
                      : participant2?.username || "Participant 2"}{" "}
                    <span className="text-xs text-gray-500">
                      ({roundName})
                    </span>
                  </div>
                  <div className="text-gray-900 dark:text-gray-100">
                    {msg.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

