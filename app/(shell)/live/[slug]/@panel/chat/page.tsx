"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SpectatorChat } from "@/components/SpectatorChat";
import { useRouter } from "next/navigation";

export default function ChatPanelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const [username1, username2] = slug.split("+");

  const debate = useQuery(
    api.debates.getBySlug,
    username1 && username2 ? { username1, username2 } : "skip"
  );

  return (
    <>
      {/* Desktop: render normally in sidebar */}
      <div className="hidden lg:block h-full">
        {debate && <SpectatorChat debateId={debate._id} />}
      </div>

      {/* Mobile: full-screen overlay */}
      <div className="lg:hidden fixed inset-0 z-50 bg-white dark:bg-gray-800 flex flex-col">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between z-10">
          <h3 className="font-semibold">Spectator Chat</h3>
          <button
            onClick={() => router.back()}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-hidden">
          {debate && <SpectatorChat debateId={debate._id} />}
        </div>
      </div>
    </>
  );
}

