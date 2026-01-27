"use client";

import { useState } from "react";
import { Feedback } from "@/lib/store/useStore";

interface FeedbackPinProps {
  feedback: Feedback;
  isSelected: boolean;
  index: number;
  onClick: () => void;
}

export default function FeedbackPin({
  feedback,
  isSelected,
  index,
  onClick,
}: FeedbackPinProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (feedback.type !== "ui" || !feedback.posX || !feedback.posY) {
    return null;
  }

  return (
    <div
      className="absolute transform -translate-x-1/2 -translate-y-full cursor-pointer z-20"
      style={{
        left: `${feedback.posX}%`,
        top: `${feedback.posY}%`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Pin marker */}
      <div
        className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all ${
          isSelected
            ? "bg-blue-600 scale-110"
            : feedback.resolved
            ? "bg-green-500"
            : "bg-red-500 hover:scale-110"
        }`}
      >
        <span className="text-white text-sm font-bold">{index + 1}</span>
        {/* Pin tail */}
        <div
          className={`absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-8 border-l-transparent border-r-transparent ${
            isSelected
              ? "border-t-blue-600"
              : feedback.resolved
              ? "border-t-green-500"
              : "border-t-red-500"
          }`}
        />
      </div>

      {/* Tooltip on hover */}
      {(isHovered || isSelected) && (
        <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 z-30">
          <p className="text-sm text-gray-900 dark:text-white line-clamp-2">
            {feedback.content}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            — {feedback.author}
          </p>
          {feedback.resolved && (
            <span className="inline-block mt-1 text-xs text-green-600 font-medium">
              Resolved
            </span>
          )}
        </div>
      )}
    </div>
  );
}
