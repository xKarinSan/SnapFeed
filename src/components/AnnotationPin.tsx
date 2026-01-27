"use client";

import { useState } from "react";

interface AnnotationPinProps {
  number: number;
  x: number;
  y: number;
  content: string;
  isSelected: boolean;
  onClick: () => void;
}

export default function AnnotationPin({
  number,
  x,
  y,
  content,
  isSelected,
  onClick,
}: AnnotationPinProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2 z-10"
      style={{
        left: `${x}%`,
        top: `${y}%`,
      }}
    >
      {/* Pin */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
          isSelected
            ? "bg-blue-600 text-white ring-2 ring-blue-300 scale-110"
            : "bg-orange-500 text-white hover:scale-110"
        }`}
      >
        {number}
      </button>

      {/* Tooltip on hover */}
      {isHovered && !isSelected && (
        <div className="absolute left-8 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg max-w-xs whitespace-pre-wrap shadow-lg z-20">
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
          {content.length > 100 ? content.substring(0, 100) + "..." : content}
        </div>
      )}
    </div>
  );
}
