"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, useClerk } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";

interface SettingsModalProps {
  userId: Id<"users">;
  onClose: () => void;
}

export function SettingsModal({ userId, onClose }: SettingsModalProps) {
  const clerk = useClerk();
  const currentUser = useQuery(api.users.getById, { userId });
  const updateProfile = useMutation(api.users.updateProfile);

  const [xProfile, setXProfile] = useState("");
  const [blueskyProfile, setBlueskyProfile] = useState("");
  const [notificationChallengeCreated, setNotificationChallengeCreated] =
    useState(false);
  const [notificationChallengeAccepted, setNotificationChallengeAccepted] =
    useState(false);
  const [notificationDebateStarting, setNotificationDebateStarting] =
    useState(false);

  useEffect(() => {
    if (currentUser) {
      setXProfile(currentUser.xProfile || "");
      setBlueskyProfile(currentUser.blueskyProfile || "");
      setNotificationChallengeCreated(
        currentUser.notificationChallengeCreated ?? true
      );
      setNotificationChallengeAccepted(
        currentUser.notificationChallengeAccepted ?? true
      );
      setNotificationDebateStarting(
        currentUser.notificationDebateStarting ?? true
      );
    }
  }, [currentUser]);

  const handleSave = async () => {
    try {
      await updateProfile({
        userId,
        xProfile: xProfile || undefined,
        blueskyProfile: blueskyProfile || undefined,
        notificationChallengeCreated,
        notificationChallengeAccepted,
        notificationDebateStarting,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update settings:", error);
      alert("Failed to update settings");
    }
  };

  const handleSignOut = () => {
    clerk.signOut();
  };

  if (currentUser === undefined) {
    return (
      <div className="p-6">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Settings</h2>
        <button
          onClick={onClose}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-6">
        {/* Social Links */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Social Links</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                X Profile
              </label>
              <input
                type="url"
                value={xProfile}
                onChange={(e) => setXProfile(e.target.value)}
                placeholder="https://x.com/username"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                BlueSky Profile
              </label>
              <input
                type="url"
                value={blueskyProfile}
                onChange={(e) => setBlueskyProfile(e.target.value)}
                placeholder="https://bsky.app/profile/username"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Notifications</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Challenge created for you</span>
              <input
                type="checkbox"
                checked={notificationChallengeCreated}
                onChange={(e) =>
                  setNotificationChallengeCreated(e.target.checked)
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Your Challenge accepted</span>
              <input
                type="checkbox"
                checked={notificationChallengeAccepted}
                onChange={(e) =>
                  setNotificationChallengeAccepted(e.target.checked)
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm">Debate starting</span>
              <input
                type="checkbox"
                checked={notificationDebateStarting}
                onChange={(e) =>
                  setNotificationDebateStarting(e.target.checked)
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Save Changes
          </button>
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

