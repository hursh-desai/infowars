"use client";

import { use } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { FollowButton } from "@/components/FollowButton";

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

  if (profileUser === undefined) {
    return <div>Loading...</div>;
  }

  if (profileUser === null) {
    return <div>User not found</div>;
  }

  const isOwnProfile = currentUser?._id === profileUser._id;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold">
                {profileUser.displayName || profileUser.username}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                @{profileUser.username}
              </p>
            </div>
            {!isOwnProfile && currentUser && (
              <FollowButton
                followerId={currentUser._id}
                followeeId={profileUser._id}
              />
            )}
            {isOwnProfile && (
              <Link
                href="/profile/edit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Profile
              </Link>
            )}
          </div>

          {profileUser.bio && (
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              {profileUser.bio}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            {profileUser.ideologyTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm"
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="flex gap-4 mb-4">
            {profileUser.xProfile && (
              <a
                href={profileUser.xProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                X Profile
              </a>
            )}
            {profileUser.blueskyProfile && (
              <a
                href={profileUser.blueskyProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                BlueSky Profile
              </a>
            )}
          </div>

          {profileUser.highlightedMedia.length > 0 && (
            <div className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Highlighted Media</h2>
              <div className="space-y-2">
                {profileUser.highlightedMedia.map((media, idx) => (
                  <a
                    key={idx}
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="font-semibold">{media.title}</div>
                    {media.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {media.description}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Debate Archive</h2>
          {debates === undefined ? (
            <div>Loading debates...</div>
          ) : debates.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">
              No debates yet
            </div>
          ) : (
            <div className="space-y-2">
              {debates.map((debate) => (
                <Link
                  key={debate._id}
                  href={`/archive/${debate._id}`}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div className="font-semibold">{debate.title}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(debate.actualEndTime || 0).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
