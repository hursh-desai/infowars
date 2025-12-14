"use client";

import { useEffect, useState } from "react";

interface DebateTimerProps {
  roundStartTime?: number;
  currentRound: string;
  currentTurn: "participant1" | "participant2";
}

const ROUND_DURATION = 60 * 1000; // 1 minute

export function DebateTimer({
  roundStartTime,
  currentRound,
  currentTurn,
}: DebateTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  useEffect(() => {
    if (!roundStartTime) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const elapsed = Date.now() - roundStartTime;
      const remaining = Math.max(0, ROUND_DURATION - elapsed);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100);

    return () => clearInterval(interval);
  }, [roundStartTime]);

  const seconds = Math.floor(timeRemaining / 1000);
  const isLowTime = seconds < 10;

  const roundNames: Record<string, string> = {
    openingRemarks: "Opening Remarks",
    point1: "Point 1",
    point2: "Point 2",
    point3: "Point 3",
    closingRemarks: "Closing Remarks",
  };

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {roundNames[currentRound]} - {currentTurn === "participant1" ? "Participant 1" : "Participant 2"}
      </div>
      <div
        className={`text-4xl font-bold ${
          isLowTime ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-gray-100"
        }`}
      >
        {Math.floor(seconds / 60)}:{(seconds % 60).toString().padStart(2, "0")}
      </div>
    </div>
  );
}
