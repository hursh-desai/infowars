"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { DebateTimer } from "./DebateTimer";
import { SpectatorChat } from "./SpectatorChat";

interface LiveDebateViewerProps {
  debateId: Id<"debates">;
}

export function LiveDebateViewer({ debateId }: LiveDebateViewerProps) {
  const { user } = useUser();
  const debate = useQuery(api.debates.getById, { debateId });
  const messages = useQuery(api.messages.getDebateMessages, { debateId });
  const submitMessage = useMutation(api.messages.submitDebateMessage);
  const currentUser = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const [messageInput, setMessageInput] = useState("");
  const incrementViewer = useMutation(api.debates.incrementViewerCount);
  const decrementViewer = useMutation(api.debates.decrementViewerCount);
  
  const participant1 = useQuery(
    api.users.getById,
    debate ? { userId: debate.participant1 } : "skip"
  );
  const participant2 = useQuery(
    api.users.getById,
    debate ? { userId: debate.participant2 } : "skip"
  );

  useEffect(() => {
    if (!debate) return;
    incrementViewer({ debateId });
    return () => {
      decrementViewer({ debateId });
    };
  }, [debateId, incrementViewer, decrementViewer]);

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
    <div className="flex h-screen">
      <div className="flex-1 flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold">{debate.title}</h1>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {participant1?.username} vs {participant2?.username} •{" "}
            {debate.viewerCount} viewers
          </div>
        </div>

        <div className="p-6">
          <DebateTimer
            roundStartTime={debate.roundStartTime}
            currentRound={debate.currentRound}
            currentTurn={debate.currentTurn}
          />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages?.map((msg) => {
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
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
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

      <div className="w-80">
        <SpectatorChat debateId={debateId} />
      </div>
    </div>
  );
}
