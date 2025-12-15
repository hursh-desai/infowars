"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { DebateTimer } from "./DebateTimer";

interface LiveDebateViewerProps {
  debateId: Id<"debates">;
}

// Generate or retrieve session ID for anonymous users
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "debate_session_id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export function LiveDebateViewer({ debateId }: LiveDebateViewerProps) {
  const { user } = useUser();
  const router = useRouter();
  const debate = useQuery(api.debates.getById, { debateId });
  const messages = useQuery(api.messages.getDebateMessages, { debateId });
  const submitMessage = useMutation(api.messages.submitDebateMessage);
  const currentUser = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const [messageInput, setMessageInput] = useState("");
  const addViewer = useMutation(api.debates.addViewer);
  const removeViewer = useMutation(api.debates.removeViewer);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const participant1 = useQuery(
    api.users.getById,
    debate ? { userId: debate.participant1 } : "skip"
  );
  const participant2 = useQuery(
    api.users.getById,
    debate ? { userId: debate.participant2 } : "skip"
  );

  // Get slug for chat panel route
  const slug = participant1 && participant2
    ? `${participant1.username}+${participant2.username}`
    : null;

  // Track unique viewers
  useEffect(() => {
    if (!debate) return;
    
    const sessionId = user ? undefined : getSessionId();
    addViewer({
      debateId,
      userId: currentUser?._id,
      sessionId,
    });

    // Set up heartbeat to update lastSeenAt every 30 seconds
    heartbeatIntervalRef.current = setInterval(() => {
      addViewer({
        debateId,
        userId: currentUser?._id,
        sessionId,
      });
    }, 30000);

    // Cleanup: remove viewer when component unmounts
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      removeViewer({
        debateId,
        userId: currentUser?._id,
        sessionId,
      });
    };
  }, [debateId, currentUser?._id, addViewer, removeViewer, user]);

  if (!debate) {
    return <div>Loading debate...</div>;
  }

  const isParticipant1 =
    currentUser && debate.participant1 === currentUser._id;
  const isParticipant2 =
    currentUser && debate.participant2 === currentUser._id;
  const isParticipant = isParticipant1 || isParticipant2;
  const isMyTurn =
    (isParticipant1 && debate.currentTurn === "participant1") ||
    (isParticipant2 && debate.currentTurn === "participant2");

  const roundNames: Record<string, string> = {
    openingRemarks: "Opening Remarks",
    point1: "Point 1",
    point2: "Point 2",
    point3: "Point 3",
    closingRemarks: "Closing Remarks",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentUser || !isMyTurn) return;

    try {
      await submitMessage({
        debateId,
        authorId: currentUser._id,
        round: debate.currentRound,
        content: messageInput.trim(),
      });
      setMessageInput("");
    } catch (error) {
      console.error("Failed to submit message:", error);
      alert("Failed to submit message. Make sure it's your turn!");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold">{debate.title}</h1>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {participant1?.username} vs {participant2?.username} •{" "}
              {debate.viewerCount} viewers
            </div>
          </div>
          {/* Mobile Chat Button */}
          {slug && (
            <button
              onClick={() => router.push(`/live/${slug}/chat`)}
              className="lg:hidden ml-4 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 md:p-6">
        <DebateTimer
          roundStartTime={debate.roundStartTime}
          currentRound={debate.currentRound}
          currentTurn={debate.currentTurn}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages?.map((msg) => {
          const isP1 = msg.authorId === debate.participant1;
          const roundName = roundNames[msg.round];
          return (
            <div
              key={msg._id}
              className={`p-4 rounded-lg ${
                isP1
                  ? "bg-blue-50 dark:bg-blue-900/20 md:ml-8"
                  : "bg-red-50 dark:bg-red-900/20 md:mr-8"
              }`}
            >
              <div className="font-semibold mb-1">
                {isP1
                  ? participant1?.username || "Participant 1"
                  : participant2?.username || "Participant 2"}{" "}
                <span className="text-xs text-gray-500">({roundName})</span>
              </div>
              <div className="text-gray-900 dark:text-gray-100">
                {msg.content}
              </div>
            </div>
          );
        })}
      </div>

      {isParticipant && isMyTurn && (
        <div className="p-4 md:p-6 border-t border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder={`Your ${roundNames[debate.currentRound]}...`}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
