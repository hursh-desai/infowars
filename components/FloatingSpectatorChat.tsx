"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";

interface FloatingSpectatorChatProps {
  debateId: Id<"debates">;
}

export function FloatingSpectatorChat({ debateId }: FloatingSpectatorChatProps) {
  const { user } = useUser();
  const messages = useQuery(api.spectatorMessages.getByDebate, { debateId });
  const sendMessage = useMutation(api.spectatorMessages.send);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUser = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

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

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
      setIsOpen(true);
    } else {
      setIsMinimized(true);
    }
  };

  return (
    <>
      {/* Floating Chat Button (when minimized) */}
      {isMinimized && (
        <button
          onClick={toggleChat}
          className="fixed bottom-20 right-4 z-[60] w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
          aria-label="Open spectator chat"
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
          {messages && messages.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {messages.length > 9 ? "9+" : messages.length}
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Window (when open) */}
      {isOpen && !isMinimized && (
        <div className="fixed bottom-20 right-4 z-[60] w-[calc(100vw-2rem)] max-w-80 h-[calc(100vh-6rem)] max-h-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-t-lg">
            <h3 className="font-semibold text-sm">Spectator Chat</h3>
            <button
              onClick={toggleChat}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              aria-label="Minimize chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 12H4"
                />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm">
            {messages === undefined ? (
              <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                No messages yet. Be the first to chat!
              </div>
            ) : (
              <>
                {messages.map((msg: any) => (
                  <div key={msg._id} className="text-sm">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {msg.author?.username || "Anonymous"}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      : {msg.content}
                    </span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input */}
          {currentUser && (
            <form
              onSubmit={handleSend}
              className="p-3 border-t border-gray-200 dark:border-gray-700"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </form>
          )}
        </div>
      )}
    </>
  );
}

