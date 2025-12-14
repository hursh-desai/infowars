"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DebateCard } from "@/components/DebateCard";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";

export default function Home() {
  const { isSignedIn } = useUser();
  const [sortBy, setSortBy] = useState<"hot" | "recent">("hot");
  const debates = useQuery(api.debates.getActive, { sortBy });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold hover:opacity-80 transition-opacity">
            Info Wars
          </Link>
          <nav className="flex items-center gap-4">
            {isSignedIn ? (
              <>
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
              </>
            ) : (
              <>
                <SignInButton mode="modal">
                  <button className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Sign Up
                  </button>
                </SignUpButton>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">Live Debates</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy("hot")}
              className={`px-4 py-2 rounded-md ${
                sortBy === "hot"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Hot
            </button>
            <button
              onClick={() => setSortBy("recent")}
              className={`px-4 py-2 rounded-md ${
                sortBy === "recent"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              Recent
            </button>
          </div>
        </div>

        {debates === undefined ? (
          <div>Loading debates...</div>
        ) : debates.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No active debates at the moment. Check back soon!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {debates.map((debate) => (
              <DebateCard key={debate._id} debate={debate} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
