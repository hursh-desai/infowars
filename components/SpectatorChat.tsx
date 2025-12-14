"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

interface SpectatorChatProps {
  debateId: Id<"debates">;
}

export function SpectatorChat({ debateId }: SpectatorChatProps) {
  const { user } = useUser();
  const messages = useQuery(api.spectatorMessages.getByDebate, { debateId });
  const sendMessage = useMutation(api.spectatorMessages.send);
  const [input, setInput] = useState("");

  const currentUser = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !currentUser) return;

    try {
      await sendMessage({
        debateId,
        authorId: currentUser._id,
        content: input.trim(),
      });
      setInput("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  return (
    <div className="flex flex-col h-full border-l border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold">Spectator Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages?.map((msg: any) => (
          <div key={msg._id} className="text-sm">
            <span className="font-medium">
              {msg.author?.username || "Anonymous"}
            </span>
            : {msg.content}
          </div>
        ))}
      </div>
      {currentUser && (
        <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </form>
      )}
    </div>
  );
}
