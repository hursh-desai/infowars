"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DebateCard } from "@/components/DebateCard";
import Link from "next/link";

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const [searchTerm, setSearchTerm] = useState(queryParam);
  
  // Sync local state with URL param
  useEffect(() => {
    setSearchTerm(queryParam);
  }, [queryParam]);
  
  const searchResults = useQuery(
    api.search.search,
    queryParam ? { searchTerm: queryParam } : "skip"
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-8">
        <div className="relative max-w-2xl">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users, debates, or #hashtags..."
            className="w-full px-4 py-3 pl-12 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
          />
          <svg
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchTerm && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                router.push("/search");
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-5 h-5"
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
          )}
        </div>
      </form>

      {queryParam && (
        <h2 className="text-xl font-semibold mb-6 text-gray-700 dark:text-gray-300">
          Results for "{queryParam}"
        </h2>
      )}

      {!queryParam ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Enter a search term above to find users, debates, or hashtags
        </div>
      ) : searchResults === undefined ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Searching...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Users Section */}
          {searchResults.users.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">Users</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({searchResults.users.length} result{searchResults.users.length !== 1 ? "s" : ""})
                </span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.users.map((user) => (
                  <Link
                    key={user._id}
                    href={`/profile/${user.username}`}
                    className="block p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      @{user.username}
                    </div>
                    {user.displayName && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {user.displayName}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Debates Section */}
          {searchResults.debates.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">Debates</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({searchResults.debates.length} result{searchResults.debates.length !== 1 ? "s" : ""})
                </span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.debates.map((debate) => (
                  <DebateCard
                    key={debate._id}
                    debate={{
                      _id: debate._id,
                      title: debate.title,
                      participant1: debate.participant1,
                      participant2: debate.participant2,
                      viewerCount: debate.viewerCount,
                      status: debate.status,
                      scheduledStartTime: debate.scheduledStartTime,
                      actualStartTime: debate.actualStartTime,
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Hashtags Section */}
          {searchResults.hashtags.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">Hashtags</span>
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({searchResults.hashtags.length} result{searchResults.hashtags.length !== 1 ? "s" : ""})
                </span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {searchResults.hashtags.map((hashtag) => (
                  <Link
                    key={hashtag.tag}
                    href={`/search?q=${encodeURIComponent("#" + hashtag.tag)}`}
                    className="block p-6 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                      #{hashtag.tag}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {hashtag.count} user{hashtag.count !== 1 ? "s" : ""} with this tag
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* No Results */}
          {searchResults.users.length === 0 &&
            searchResults.debates.length === 0 &&
            searchResults.hashtags.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                No results found for "{queryParam}"
              </div>
            )}
        </div>
      )}
    </main>
  );
}

