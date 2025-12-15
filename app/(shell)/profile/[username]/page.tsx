"use client";

import { use, useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useHeartbeat } from "@/lib/useHeartbeat";
import Link from "next/link";
import { FollowButton } from "@/components/FollowButton";
import { SettingsModal } from "@/components/SettingsModal";

export default function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = use(params);
  const { user: clerkUser } = useUser();
  const profileUser = useQuery(api.users.getByUsername, {
    username,
  });
  const currentUser = useQuery(
    api.users.getByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  );
  const debates = useQuery(
    api.debates.getByParticipant,
    profileUser ? { userId: profileUser._id } : "skip"
  );
  const updateProfile = useMutation(api.users.updateProfile);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [isAddingMedia, setIsAddingMedia] = useState(false);
  const [media, setMedia] = useState<
    Array<{ title: string; url: string; description?: string }>
  >([]);
  const [newMedia, setNewMedia] = useState({
    title: "",
    url: "",
    description: "",
  });

  // Initialize and sync media state when profileUser loads or updates
  useEffect(() => {
    if (profileUser) {
      setMedia(profileUser.highlightedMedia || []);
    }
  }, [profileUser?.highlightedMedia]);

  // Handle escape key to close settings modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isSettingsOpen) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isSettingsOpen]);

  // Track user as online
  useHeartbeat(currentUser?._id);

  if (profileUser === undefined) {
    return <div>Loading...</div>;
  }

  if (profileUser === null) {
    return <div>User not found</div>;
  }

  const isOwnProfile = currentUser?._id === profileUser._id;

  const handleAddTag = async () => {
    const trimmedTag = tagInput.trim();
    if (
      trimmedTag &&
      currentUser &&
      profileUser &&
      !profileUser.ideologyTags.includes(trimmedTag)
    ) {
      const updatedTags = [...profileUser.ideologyTags, trimmedTag];
      await updateProfile({
        userId: currentUser._id,
        ideologyTags: updatedTags,
      });
      setTagInput("");
      setIsAddingTag(false);
    } else if (trimmedTag && profileUser?.ideologyTags.includes(trimmedTag)) {
      setTagInput("");
      setIsAddingTag(false);
    } else {
      // If input is empty, just revert to the + button
      setTagInput("");
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (currentUser && profileUser) {
      const updatedTags = profileUser.ideologyTags.filter(
        (tag) => tag !== tagToRemove
      );
      await updateProfile({
        userId: currentUser._id,
        ideologyTags: updatedTags,
      });
    }
  };

  const handleAddMedia = async () => {
    if (newMedia.title && newMedia.url && currentUser) {
      const updatedMedia = [...media, { ...newMedia }];
      setMedia(updatedMedia);
      await updateProfile({
        userId: currentUser._id,
        highlightedMedia: updatedMedia,
      });
      setNewMedia({ title: "", url: "", description: "" });
      setIsAddingMedia(false);
    }
  };

  const handleRemoveMedia = async (index: number) => {
    if (currentUser) {
      const updatedMedia = media.filter((_, i) => i !== index);
      setMedia(updatedMedia);
      await updateProfile({
        userId: currentUser._id,
        highlightedMedia: updatedMedia,
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold">
                {profileUser.displayName || profileUser.username}
              </h1>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                @{profileUser.username}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2 items-center">
              {profileUser.ideologyTags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs flex items-center gap-1 group relative"
                >
                  {tag}
                  {isOwnProfile && (
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-red-600 hover:text-red-800 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove tag"
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {isOwnProfile && (
                <>
                  {isAddingTag ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                        onBlur={handleAddTag}
                        placeholder="Add tag"
                        autoFocus
                        className="px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs w-24"
                      />
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingTag(true)}
                      className="w-5 h-5 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400"
                      title="Add tag"
                    >
                      +
                    </button>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-3 text-sm">
              {profileUser.xProfile && (
                <a
                  href={profileUser.xProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  X
                </a>
              )}
              {profileUser.blueskyProfile && (
                <a
                  href={profileUser.blueskyProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  BlueSky
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2 ml-4">
            {!isOwnProfile && currentUser && (
              <FollowButton
                followerId={currentUser._id}
                followeeId={profileUser._id}
              />
            )}
            {isOwnProfile && currentUser && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                title="Settings"
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
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold">Highlighted Media</h2>
            {isOwnProfile && !isAddingMedia && (
              <button
                onClick={() => setIsAddingMedia(true)}
                className="w-5 h-5 flex items-center justify-center bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-xs font-bold text-gray-600 dark:text-gray-400"
                title="Add media"
              >
                +
              </button>
            )}
          </div>
          {isOwnProfile && isAddingMedia && (
            <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs">
              <div className="space-y-1.5 mb-2">
                <input
                  type="text"
                  value={newMedia.title}
                  onChange={(e) =>
                    setNewMedia({ ...newMedia, title: e.target.value })
                  }
                  placeholder="Title"
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
                  autoFocus
                />
                <input
                  type="url"
                  value={newMedia.url}
                  onChange={(e) =>
                    setNewMedia({ ...newMedia, url: e.target.value })
                  }
                  placeholder="URL"
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
                />
                <input
                  type="text"
                  value={newMedia.description}
                  onChange={(e) =>
                    setNewMedia({ ...newMedia, description: e.target.value })
                  }
                  placeholder="Description (optional)"
                  className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-xs"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddMedia}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingMedia(false);
                      setNewMedia({ title: "", url: "", description: "" });
                    }}
                    className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {media.length > 0 ? (
            <div className="space-y-1.5">
              {media.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start p-2 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700 group"
                >
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <div className="font-semibold text-xs">{item.title}</div>
                    {item.description && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {item.description}
                      </div>
                    )}
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                      {item.url}
                    </div>
                  </a>
                  {isOwnProfile && (
                    <button
                      onClick={() => handleRemoveMedia(idx)}
                      className="ml-2 text-red-600 hover:text-red-800 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remove"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {isOwnProfile ? "No media added yet" : "No media"}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <h2 className="text-sm font-semibold mb-2">Debate Archive</h2>
        {debates === undefined ? (
          <div className="text-xs">Loading debates...</div>
        ) : debates.length === 0 ? (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            No debates yet
          </div>
        ) : (
          <div className="space-y-1.5">
            {debates.map((debate) => (
              <Link
                key={debate._id}
                href={`/archive/${debate._id}`}
                className="block p-2 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="font-semibold text-xs">{debate.title}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  {new Date(debate.actualEndTime || 0).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {isSettingsOpen && currentUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsSettingsOpen(false);
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <SettingsModal
              userId={currentUser._id}
              onClose={() => setIsSettingsOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

