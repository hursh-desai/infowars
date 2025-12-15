"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { DebateTimer } from "./DebateTimer";
import { DebateCountdown } from "./DebateCountdown";
import { FloatingSpectatorChat } from "./FloatingSpectatorChat";

interface DebateViewerProps {
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

export function DebateViewer({ debateId }: DebateViewerProps) {
  const { user } = useUser();
  const debate = useQuery(api.debates.getById, { debateId });
  const debateMessages = useQuery(api.messages.getDebateMessages, { debateId });
  const spectatorMessages = useQuery(api.spectatorMessages.getByDebate, { debateId });
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

  // Track unique viewers for scheduled and live debates
  useEffect(() => {
    if (!debate) return;
    if (debate.status !== "scheduled" && debate.status !== "live") return;

    // Add viewer
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
  }, [debateId, debate?.status, currentUser?._id, addViewer, removeViewer, user]);

  if (debate === undefined) {
    return <div className="p-8 text-center">Loading debate...</div>;
  }

  if (debate === null) {
    return <div className="p-8 text-center">Debate not found</div>;
  }

  const roundNames: Record<string, string> = {
    openingRemarks: "Opening Remarks",
    point1: "Point 1",
    point2: "Point 2",
    point3: "Point 3",
    closingRemarks: "Closing Remarks",
  };

  // Scheduled debate: Show countdown + spectator chat
  if (debate.status === "scheduled") {
    return (
      <>
        <div className="flex flex-col h-full">
          <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-xl md:text-2xl font-bold">{debate.title}</h1>
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {participant1?.username || "Loading..."} vs {participant2?.username || "Loading..."} •{" "}
                  {debate.viewerCount} viewers
                </div>
              </div>
              <span className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded">
                Scheduled
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {debate.scheduledStartTime && (
              <DebateCountdown
                scheduledStartTime={debate.scheduledStartTime}
                title={debate.title}
                participant1Username={participant1?.username}
                participant2Username={participant2?.username}
              />
            )}
          </div>
        </div>
        <FloatingSpectatorChat debateId={debateId} />
      </>
    );
  }

  // Live debate: Show debate messages + spectator chat
  if (debate.status === "live") {
    const isParticipant1 =
      currentUser && debate.participant1 === currentUser._id;
    const isParticipant2 =
      currentUser && debate.participant2 === currentUser._id;
    const isParticipant = isParticipant1 || isParticipant2;
    const isMyTurn =
      (isParticipant1 && debate.currentTurn === "participant1") ||
      (isParticipant2 && debate.currentTurn === "participant2");

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
      <>
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
              <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded">
                Live
              </span>
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
          {debateMessages?.map((msg) => {
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
        <FloatingSpectatorChat debateId={debateId} />
      </>
    );
  }

  // Completed debate: Show transcript + spectator messages
  if (debate.status === "completed") {
    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-xl md:text-2xl font-bold">{debate.title}</h1>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {participant1?.username || "Loading..."} vs {participant2?.username || "Loading..."}
              </div>
              {debate.actualEndTime && (
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                  Completed: {new Date(debate.actualEndTime).toLocaleString()}
                </div>
              )}
            </div>
            <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
              Completed
            </span>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-6 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Debate Transcript</h2>
            {debateMessages === undefined ? (
              <div>Loading messages...</div>
            ) : debateMessages.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400">
                No messages in this debate
              </div>
            ) : (
              <div className="space-y-4">
                {debateMessages.map((msg) => {
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

          {spectatorMessages && spectatorMessages.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold mb-4">Spectator Messages</h2>
              <div className="space-y-2">
                {spectatorMessages.map((msg: any) => (
                  <div key={msg._id} className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
                    <span className="font-medium">
                      {msg.author?.username || "Anonymous"}
                    </span>
                    : <span className="text-gray-700 dark:text-gray-300">{msg.content}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Cancelled or unknown status
  return (
    <div className="p-8 text-center">
      <p>This debate is not available for viewing.</p>
    </div>
  );
}

