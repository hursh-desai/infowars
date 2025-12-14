"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

interface FollowButtonProps {
  followerId: Id<"users">;
  followeeId: Id<"users">;
}

export function FollowButton({ followerId, followeeId }: FollowButtonProps) {
  const isFollowing = useQuery(api.follows.isFollowing, {
    followerId,
    followeeId,
  });
  const follow = useMutation(api.follows.follow);
  const unfollow = useMutation(api.follows.unfollow);
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      if (isFollowing) {
        await unfollow({ followerId, followeeId });
      } else {
        await follow({ followerId, followeeId });
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isFollowing === undefined) {
    return <div>Loading...</div>;
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`px-4 py-2 rounded-md ${
        isFollowing
          ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
          : "bg-blue-600 text-white"
      }`}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
}
