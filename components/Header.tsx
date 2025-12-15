"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function Header() {
  const pathname = usePathname();
  const { user } = useUser();
  const currentUser = useQuery(
    api.users.getByClerkId,
    user ? { clerkId: user.id } : "skip"
  );

  const isProfileActive = pathname.startsWith("/profile");

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4">
        <div className="flex justify-between items-center gap-4">
          <Link
            href="/"
            className="text-xl md:text-2xl font-bold hover:opacity-80 transition-opacity flex-shrink-0"
          >
            Info Wars
          </Link>

          {/* Profile Button */}
          {currentUser ? (
            <Link
              href={`/profile/${currentUser.username}`}
              className={`p-2 rounded-full transition-colors ${
                isProfileActive
                  ? "bg-blue-100 dark:bg-blue-900"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center overflow-hidden">
                {user?.imageUrl ? (
                  <img
                    src={user.imageUrl}
                    alt={currentUser.username}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <span className="text-white text-xs font-semibold">
                    {(currentUser.displayName || currentUser.username)[0].toUpperCase()}
                  </span>
                )}
              </div>
            </Link>
          ) : (
            <Link
              href="/setup"
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

