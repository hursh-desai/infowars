"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { user: clerkUser, isLoaded } = useUser();
  const router = useRouter();
  const currentUser = useQuery(
    api.users.getByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  );
  const updateProfile = useMutation(api.users.updateProfile);

  const [ideologyTags, setIdeologyTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [xProfile, setXProfile] = useState("");
  const [blueskyProfile, setBlueskyProfile] = useState("");

  useEffect(() => {
    if (isLoaded && clerkUser && currentUser === null) {
      router.push("/setup");
    }
  }, [isLoaded, clerkUser, currentUser, router]);

  useEffect(() => {
    if (currentUser) {
      setIdeologyTags(currentUser.ideologyTags || []);
      setXProfile(currentUser.xProfile || "");
      setBlueskyProfile(currentUser.blueskyProfile || "");
    }
  }, [currentUser]);

  if (!isLoaded || currentUser === undefined) {
    return <div>Loading...</div>;
  }

  if (!clerkUser) {
    return <div>Please sign in to edit your profile</div>;
  }

  if (currentUser === null) {
    return <div>Redirecting to setup...</div>;
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !ideologyTags.includes(tagInput.trim())) {
      setIdeologyTags([...ideologyTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setIdeologyTags(ideologyTags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        userId: currentUser._id,
        ideologyTags,
        xProfile: xProfile || undefined,
        blueskyProfile: blueskyProfile || undefined,
      });
      router.push(`/profile/${currentUser.username}`);
    } catch (error) {
      console.error("Failed to update profile:", error);
      alert("Failed to update profile");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">
            Ideology Tags
          </label>
          <div className="flex gap-2 mb-2">
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
              placeholder="Add a tag"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-md"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ideologyTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">X Profile</label>
          <input
            type="url"
            value={xProfile}
            onChange={(e) => setXProfile(e.target.value)}
            placeholder="https://x.com/username"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            BlueSky Profile
          </label>
          <input
            type="url"
            value={blueskyProfile}
            onChange={(e) => setBlueskyProfile(e.target.value)}
            placeholder="https://bsky.app/profile/username"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Profile
        </button>
      </form>
    </div>
  );
}

