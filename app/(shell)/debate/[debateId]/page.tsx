"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { DebateViewer } from "@/components/DebateViewer";

export default function DebatePage({
  params,
}: {
  params: Promise<{ debateId: string }>;
}) {
  const { debateId } = use(params);
  const debate = useQuery(api.debates.getById, {
    debateId: debateId as Id<"debates">,
  });

  if (debate === undefined) {
    return <div className="p-8 text-center">Loading debate...</div>;
  }

  if (debate === null) {
    return <div className="p-8 text-center">Debate not found</div>;
  }

  return <DebateViewer debateId={debate._id} />;
}

