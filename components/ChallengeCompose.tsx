"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useRouter } from "next/navigation";

interface ChallengeComposeProps {
  recipientId: Id<"users">;
  recipientUsername: string;
  currentUserId: Id<"users">;
  onSuccess?: () => void;
}

export function ChallengeCompose({
  recipientId,
  recipientUsername,
  currentUserId,
  onSuccess,
}: ChallengeComposeProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const createChallenge = useMutation(api.challenges.create);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduledTime) {
      alert("Please fill in all fields");
      return;
    }

    try {
      await createChallenge({
        challengerId: currentUserId,
        recipientId,
        title,
        scheduledTime: new Date(scheduledTime).getTime(),
      });
      setTitle("");
      setScheduledTime("");
      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
      }
    } catch (error) {
      console.error("Failed to create challenge:", error);
      alert("Failed to create challenge");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">
          Challenge User
        </label>
        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
          @{recipientUsername}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Debate Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          required
          placeholder="Enter debate title..."
        />
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

      <div className="flex gap-2 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Send Challenge
        </button>
      </div>
    </form>
  );
}

