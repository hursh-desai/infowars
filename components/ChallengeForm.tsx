"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface ChallengeFormProps {
  currentUserId: Id<"users">;
}

export function ChallengeForm({ currentUserId }: ChallengeFormProps) {
  const [title, setTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(
    null
  );
  const [scheduledTime, setScheduledTime] = useState("");
  const createChallenge = useMutation(api.challenges.create);

  const searchResults = useQuery(
    api.users.searchByUsername,
    searchTerm.length > 0 ? { searchTerm } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !title || !scheduledTime) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await createChallenge({
        challengerId: currentUserId,
        recipientId: selectedUserId,
        title,
        scheduledTime: new Date(scheduledTime).getTime(),
      });
      setTitle("");
      setSearchTerm("");
      setSelectedUserId(null);
      setScheduledTime("");
      alert("Challenge sent!");
    } catch (error) {
      console.error("Failed to create challenge:", error);
      alert("Failed to create challenge");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Create New Challenge</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Debate Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Challenge User
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          {searchResults && searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-md">
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  type="button"
                  onClick={() => {
                    setSelectedUserId(user._id);
                    setSearchTerm(user.username);
                  }}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedUserId === user._id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : ""
                  }`}
                >
                  {user.username}
                  {user.displayName && ` (${user.displayName})`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Scheduled Date & Time
          </label>
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Send Challenge
        </button>
      </form>
    </div>
  );
}
