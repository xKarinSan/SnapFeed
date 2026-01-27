"use client";

import { useState } from "react";
import { Screenshot } from "./ScreenshotGallery";

interface ScreenshotThumbnailProps {
  screenshot: Screenshot;
  onClick: () => void;
  onDelete: () => void;
}

export default function ScreenshotThumbnail({
  screenshot,
  onClick,
  onDelete,
}: ScreenshotThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this screenshot?")) {
      onDelete();
    }
  };

  return (
    <div
      className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 dark:bg-gray-900">
        {imageError ? (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
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
          </div>
        ) : (
          <img
            src={`/api/uploads/screenshots/${screenshot.filename}`}
            alt={screenshot.pageTitle || "Screenshot"}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>

      {/* Overlay on hover */}
      {isHovered && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <span className="text-white text-sm font-medium">View & Annotate</span>
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={handleDelete}
        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        title="Delete screenshot"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Annotation count badge */}
      {screenshot._count && screenshot._count.annotations > 0 && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
          {screenshot._count.annotations} note{screenshot._count.annotations !== 1 ? "s" : ""}
        </div>
      )}

      {/* Info */}
      <div className="p-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
          {screenshot.pageTitle || screenshot.pageUrl}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {formatDate(screenshot.createdAt)}
        </p>
      </div>
    </div>
  );
}
