"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LiveDebateViewer } from "@/components/LiveDebateViewer";

export default function LiveDebatePage({
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

  if (!username1 || !username2) {
    return <div>Invalid debate URL</div>;
  }

  if (debate === undefined) {
    return <div>Loading debate...</div>;
  }

  if (debate === null) {
    return <div>Debate not found</div>;
  }

  return <LiveDebateViewer debateId={debate._id} />;
}

