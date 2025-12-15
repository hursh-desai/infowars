"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { ChallengeForm } from "@/components/ChallengeForm";
import { useHeartbeat } from "@/lib/useHeartbeat";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TabType = "online" | "incoming" | "outgoing" | "create";

export default function ChallengesPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("online");
  const currentUser = useQuery(
    api.users.getByClerkId,
    clerkUser ? { clerkId: clerkUser.id } : "skip"
  );
  const incoming = useQuery(
    api.challenges.getIncoming,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const outgoing = useQuery(
    api.challenges.getOutgoing,
    currentUser ? { userId: currentUser._id } : "skip"
  );
  const onlineUsers = useQuery(
    api.users.getOnlineUsers,
    currentUser ? { excludeUserId: currentUser._id } : "skip"
  );
  const acceptChallenge = useMutation(api.challenges.accept);
  const declineChallenge = useMutation(api.challenges.decline);

  // Start heartbeat when user is loaded
  useHeartbeat(currentUser?._id);

  useEffect(() => {
    if (isLoaded && clerkUser && currentUser === null) {
      router.push("/setup");
    }
  }, [isLoaded, clerkUser, currentUser, router]);

  if (!isLoaded || currentUser === undefined) {
    return <div>Loading...</div>;
  }

  if (!clerkUser) {
    return <div>Please sign in to view challenges</div>;
  }

  if (currentUser === null) {
    return <div>Redirecting to setup...</div>;
  }

  // Filter outgoing challenges to only show pending ones
  const pendingOutgoing = outgoing?.filter(
    (challenge) => challenge.status === "pending"
  ) || [];

  const handleAccept = async (challengeId: string) => {
    try {
      await acceptChallenge({ challengeId: challengeId as any });
    } catch (error) {
      console.error("Failed to accept challenge:", error);
      alert("Failed to accept challenge");
    }
  };

  const handleDecline = async (challengeId: string) => {
    try {
      await declineChallenge({ challengeId: challengeId as any });
    } catch (error) {
      console.error("Failed to decline challenge:", error);
      alert("Failed to decline challenge");
    }
  };

  const handleChallengeUser = (recipientId: string) => {
    router.push(`/challenges/new?userId=${recipientId}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Challenge Center</h1>

      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab("online")}
          className={`px-4 py-2 font-medium whitespace-nowrap ${
            activeTab === "online"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Online Users ({onlineUsers?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-4 py-2 font-medium whitespace-nowrap ${
            activeTab === "incoming"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Incoming ({incoming?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`px-4 py-2 font-medium whitespace-nowrap ${
            activeTab === "outgoing"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Outgoing ({pendingOutgoing.length})
        </button>
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 font-medium whitespace-nowrap ${
            activeTab === "create"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          Create Challenge
        </button>
      </div>

      {activeTab === "online" && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Online Users</h2>
          {onlineUsers === undefined ? (
            <div>Loading online users...</div>
          ) : onlineUsers.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">
              No users online at the moment
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {onlineUsers.map((user) => (
                <div
                  key={user._id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <Link
                        href={`/profile/${user.username}`}
                        className="font-semibold hover:underline"
                      >
                        {user.displayName || user.username}
                      </Link>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        @{user.username}
                      </div>
                    </div>
                    <span className="w-2 h-2 bg-green-500 rounded-full ml-2 flex-shrink-0"></span>
                  </div>
                  {user.ideologyTags && user.ideologyTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {user.ideologyTags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                      {user.ideologyTags.length > 3 && (
                        <span className="px-2 py-0.5 text-gray-500 dark:text-gray-400 text-xs">
                          +{user.ideologyTags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <button
                    onClick={() => handleChallengeUser(user._id)}
                    className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Challenge
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "incoming" && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Incoming Challenges</h2>
          {incoming === undefined ? (
            <div>Loading...</div>
          ) : incoming.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">
              No incoming challenges
            </div>
          ) : (
            <div className="space-y-4">
              {incoming.map((challenge) => (
                <ChallengeCard
                  key={challenge._id}
                  challenge={challenge}
                  onAccept={() => handleAccept(challenge._id)}
                  onDecline={() => handleDecline(challenge._id)}
                  type="incoming"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "outgoing" && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Outgoing Challenges</h2>
          {outgoing === undefined ? (
            <div>Loading...</div>
          ) : pendingOutgoing.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400">
              No pending outgoing challenges
            </div>
          ) : (
            <div className="space-y-4">
              {pendingOutgoing.map((challenge) => (
                <ChallengeCard
                  key={challenge._id}
                  challenge={challenge}
                  type="outgoing"
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "create" && (
        <div>
          <ChallengeForm currentUserId={currentUser._id} />
        </div>
      )}
    </div>
  );
}

function ChallengeCard({
  challenge,
  onAccept,
  onDecline,
  type,
}: {
  challenge: any;
  onAccept?: () => void;
  onDecline?: () => void;
  type: "incoming" | "outgoing";
}) {
  const challenger = challenge.challengerId
    ? useQuery(api.users.getById, { userId: challenge.challengerId })
    : null;
  const recipient = challenge.recipientId
    ? useQuery(api.users.getById, { userId: challenge.recipientId })
    : null;

  return (
    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <h3 className="font-semibold mb-2">{challenge.title}</h3>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {type === "incoming" ? (
          <>
            From: {challenger?.username || "Loading..."}
          </>
        ) : (
          <>
            To: {recipient?.username || "Loading..."}
          </>
        )}
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Scheduled: {new Date(challenge.scheduledTime).toLocaleString()}
      </div>
      <div className="text-sm mb-4">
        Status: <span className="font-semibold">{challenge.status}</span>
      </div>
      {type === "incoming" && challenge.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={onAccept}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Accept
          </button>
          <button
            onClick={onDecline}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

