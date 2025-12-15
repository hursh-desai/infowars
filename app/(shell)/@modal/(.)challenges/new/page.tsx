"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { RouteModal } from "@/components/RouteModal";
import { ChallengeCompose } from "@/components/ChallengeCompose";
import { Id } from "@/convex/_generated/dataModel";

export default function NewChallengeModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const recipientId = searchParams.get("userId") as Id<"users"> | null;

  const recipient = useQuery(
    api.users.getById,
    recipientId ? { userId: recipientId } : "skip"
  );

  const { user } = useUser();
  const currentUser = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  if (!recipientId) {
    return (
      <RouteModal>
        <div className="p-6">
          <p>Invalid challenge recipient</p>
        </div>
      </RouteModal>
    );
  }

  if (recipient === undefined || currentUser === undefined) {
    return (
      <RouteModal>
        <div className="p-6">
          <p>Loading...</p>
        </div>
      </RouteModal>
    );
  }

  if (!recipient || !currentUser) {
    return (
      <RouteModal>
        <div className="p-6">
          <p>User not found</p>
        </div>
      </RouteModal>
    );
  }

  return (
    <RouteModal>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Create Challenge</h1>
        <ChallengeCompose
          recipientId={recipientId}
          recipientUsername={recipient.username}
          currentUserId={currentUser._id}
        />
      </div>
    </RouteModal>
  );
}

