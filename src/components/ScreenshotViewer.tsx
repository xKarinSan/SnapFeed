"use client";

import { useState, useEffect, useCallback } from "react";
import AnnotationCanvas from "./AnnotationCanvas";
import AnnotationList from "./AnnotationList";
import AnnotationForm from "./AnnotationForm";
import { Screenshot } from "./ScreenshotGallery";

export interface Annotation {
  id: string;
  screenshotId: string;
  content: string;
  posX: number;
  posY: number;
  createdAt: string;
  updatedAt: string;
}

interface ScreenshotViewerProps {
  screenshot: Screenshot;
  onClose: () => void;
  onAnnotationCountChange?: (screenshotId: string, count: number) => void;
}

export default function ScreenshotViewer({
  screenshot,
  onClose,
  onAnnotationCountChange,
}: ScreenshotViewerProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    fetchAnnotations();
  }, [screenshot.id]);

  const fetchAnnotations = async () => {
    try {
      const response = await fetch(`/api/screenshots/${screenshot.id}/annotations`);
      const data = await response.json();
      setAnnotations(data);
    } catch (error) {
      console.error("Failed to fetch annotations:", error);
    }
  };

  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (!isAddingAnnotation) return;
      setPendingPosition({ x, y });
      setShowForm(true);
      setIsAddingAnnotation(false);
    },
    [isAddingAnnotation]
  );

  const handleAnnotationSubmit = async (content: string) => {
    if (!pendingPosition) return;

    try {
      const response = await fetch(`/api/screenshots/${screenshot.id}/annotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          posX: pendingPosition.x,
          posY: pendingPosition.y,
        }),
      });

      if (response.ok) {
        const newAnnotation = await response.json();
        setAnnotations((prev) => {
          const updated = [...prev, newAnnotation];
          onAnnotationCountChange?.(screenshot.id, updated.length);
          return updated;
        });
        setShowForm(false);
        setPendingPosition(null);
      }
    } catch (error) {
      console.error("Failed to create annotation:", error);
    }
  };

  const handleAnnotationUpdate = async (id: string, content: string) => {
    try {
      const response = await fetch(
        `/api/screenshots/${screenshot.id}/annotations/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setAnnotations((prev) =>
          prev.map((a) => (a.id === id ? updated : a))
        );
      }
    } catch (error) {
      console.error("Failed to update annotation:", error);
    }
  };

  const handleAnnotationDelete = async (id: string) => {
    try {
      const response = await fetch(
        `/api/screenshots/${screenshot.id}/annotations/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setAnnotations((prev) => {
          const updated = prev.filter((a) => a.id !== id);
          onAnnotationCountChange?.(screenshot.id, updated.length);
          return updated;
        });
        if (selectedAnnotationId === id) {
          setSelectedAnnotationId(null);
        }
      }
    } catch (error) {
      console.error("Failed to delete annotation:", error);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showForm) {
          setShowForm(false);
          setPendingPosition(null);
        } else if (isAddingAnnotation) {
          setIsAddingAnnotation(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showForm, isAddingAnnotation, onClose]);

  return (
    <div className={`fixed inset-0 z-50 bg-white/95 dark:bg-black/90 flex ${isDarkMode ? "dark" : ""}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-between px-4 z-10 border-b border-gray-200 dark:border-transparent">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-700 dark:text-white"
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
          <div>
            <h2 className="text-gray-900 dark:text-white font-medium truncate max-w-md">
              {screenshot.pageTitle || "Screenshot"}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs truncate max-w-md">
              {screenshot.pageUrl}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-colors"
            title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-700 dark:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-gray-700 dark:text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>

          <button
            onClick={() => setIsAddingAnnotation(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isAddingAnnotation
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            }`}
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Note
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex pt-14">
        {/* Screenshot with annotations */}
        <div className="flex-1 relative overflow-auto flex items-center justify-center p-8">
          <div className="relative max-w-full max-h-full">
            <img
              src={`/api/uploads/screenshots/${screenshot.filename}`}
              alt={screenshot.pageTitle || "Screenshot"}
              className="max-w-full max-h-[calc(100vh-8rem)] object-contain shadow-lg rounded"
            />
            <AnnotationCanvas
              annotations={annotations}
              selectedId={selectedAnnotationId}
              pendingPosition={pendingPosition}
              isAddingMode={isAddingAnnotation}
              onClick={handleCanvasClick}
              onAnnotationClick={setSelectedAnnotationId}
            />
          </div>

          {/* Adding mode hint */}
          {isAddingAnnotation && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm">
              Click anywhere on the image to add a note
            </div>
          )}
        </div>

        {/* Annotations sidebar */}
        <div className="w-80 bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 overflow-y-auto">
          <AnnotationList
            annotations={annotations}
            selectedId={selectedAnnotationId}
            onSelect={setSelectedAnnotationId}
            onUpdate={handleAnnotationUpdate}
            onDelete={handleAnnotationDelete}
          />
        </div>
      </div>

      {/* Annotation form modal */}
      {showForm && pendingPosition && (
        <AnnotationForm
          onSubmit={handleAnnotationSubmit}
          onCancel={() => {
            setShowForm(false);
            setPendingPosition(null);
          }}
        />
      )}
    </div>
  );
}
