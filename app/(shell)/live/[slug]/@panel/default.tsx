"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SpectatorChat } from "@/components/SpectatorChat";

export default function DefaultChatPanel({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const [username1, username2] = slug.split("+");

  const debate = useQuery(
    api.debates.getBySlug,
    username1 && username2 ? { username1, username2 } : "skip"
  );

  // On desktop, show chat by default
  // On mobile, return null (chat opens via route)
  if (!debate) return null;

  return (
    <div className="hidden lg:block h-full">
      <SpectatorChat debateId={debate._id} />
    </div>
  );
}

