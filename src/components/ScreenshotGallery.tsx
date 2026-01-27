"use client";

import { useState, useEffect } from "react";
import ScreenshotThumbnail from "./ScreenshotThumbnail";

export interface Screenshot {
  id: string;
  filename: string;
  pageUrl: string;
  pageTitle: string | null;
  createdAt: string;
  _count?: {
    annotations: number;
  };
}

interface ScreenshotGalleryProps {
  projectId: string;
  screenshots: Screenshot[];
  onScreenshotClick: (screenshot: Screenshot) => void;
  onScreenshotDelete: (id: string) => void;
}

export default function ScreenshotGallery({
  projectId,
  screenshots,
  onScreenshotClick,
  onScreenshotDelete,
}: ScreenshotGalleryProps) {
  if (screenshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
          No Screenshots Yet
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Browse a website and click the Screenshot button to capture
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Screenshots ({screenshots.length})
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {screenshots.map((screenshot) => (
          <ScreenshotThumbnail
            key={screenshot.id}
            screenshot={screenshot}
            onClick={() => onScreenshotClick(screenshot)}
            onDelete={() => onScreenshotDelete(screenshot.id)}
          />
        ))}
      </div>
    </div>
  );
}
