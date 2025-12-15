"use client";

import { useEffect, useState } from "react";

interface DebateCountdownProps {
  scheduledStartTime: number;
  title: string;
  participant1Username?: string;
  participant2Username?: string;
}

export function DebateCountdown({
  scheduledStartTime,
  title,
  participant1Username,
  participant2Username,
}: DebateCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, scheduledStartTime - now);
      setTimeRemaining(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [scheduledStartTime]);

  const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

  const formatTime = (value: number) => value.toString().padStart(2, "0");

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
        {(participant1Username || participant2Username) && (
          <div className="text-lg text-gray-600 dark:text-gray-400">
            {participant1Username || "Loading..."} vs {participant2Username || "Loading..."}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Debate Starts In
        </div>
        
        <div className="flex gap-4 md:gap-6">
          {days > 0 && (
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
                {formatTime(days)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1">
                {days === 1 ? "Day" : "Days"}
              </div>
            </div>
          )}
          <div className="flex flex-col items-center">
            <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
              {formatTime(hours)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1">
              {hours === 1 ? "Hour" : "Hours"}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
              {formatTime(minutes)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1">
              {minutes === 1 ? "Minute" : "Minutes"}
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100">
              {formatTime(seconds)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase mt-1">
              {seconds === 1 ? "Second" : "Seconds"}
            </div>
          </div>
        </div>

        {timeRemaining === 0 && (
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400 mt-4">
            Debate starting soon...
          </div>
        )}
      </div>
    </div>
  );
}

