"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser, UserButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { ChallengeForm } from "@/components/ChallengeForm";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ChallengesPage() {
  const { user: clerkUser, isLoaded } = useUser();
  const router = useRouter();
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
  const acceptChallenge = useMutation(api.challenges.accept);
  const declineChallenge = useMutation(api.challenges.decline);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
            Info Wars
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/challenges"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Challenges
            </Link>
            <Link
              href="/profile/edit"
              className="text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Profile
            </Link>
            <UserButton />
          </nav>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Debate Challenges</h1>

        <div className="mb-8">
          <ChallengeForm currentUserId={currentUser._id} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
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

          <div>
            <h2 className="text-2xl font-semibold mb-4">Outgoing Challenges</h2>
            {outgoing === undefined ? (
              <div>Loading...</div>
            ) : outgoing.length === 0 ? (
              <div className="text-gray-500 dark:text-gray-400">
                No outgoing challenges
              </div>
            ) : (
              <div className="space-y-4">
                {outgoing.map((challenge) => (
                  <ChallengeCard
                    key={challenge._id}
                    challenge={challenge}
                    type="outgoing"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
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
