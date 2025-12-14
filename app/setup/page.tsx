"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const { user: clerkUser } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const createOrUpdate = useMutation(api.users.createOrUpdate);
  const existingUser = useQuery(
    api.users.getByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  );

  // Redirect if already set up
  if (existingUser && existingUser.username) {
    router.push(`/profile/${existingUser.username}`);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Username is required");
      return;
    }

    if (!clerkUser) {
      setError("Please sign in first");
      return;
    }

    // Check username format (alphanumeric and underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Username can only contain letters, numbers, and underscores");
      return;
    }

    try {
      await createOrUpdate({
        clerkId: clerkUser.id,
        username: username.trim(),
        displayName: displayName.trim() || undefined,
      });
      router.push(`/profile/${username.trim()}`);
    } catch (error: any) {
      console.error("Failed to create profile:", error);
      setError(error.message || "Failed to create profile. Username may be taken.");
    }
  };

  if (!clerkUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Please sign in to set up your profile</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Set Up Your Profile</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Username *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              required
              pattern="[a-zA-Z0-9_]+"
            />
            <p className="text-xs text-gray-500 mt-1">
              Letters, numbers, and underscores only
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>
          )}

          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}
