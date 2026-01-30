"use client";

import { useState } from "react";
import Image from "next/image";
import { useStore, Feedback } from "@/lib/store/useStore";
import { Screenshot } from "@/components/ScreenshotGallery";

interface FeedbackPanelProps {
  screenshots: Screenshot[];
  onScreenshotClick: (screenshot: Screenshot) => void;
  onScreenshotDelete: (id: string) => void;
  onScreenshotRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
}

export default function FeedbackPanel({
  screenshots,
  onScreenshotClick,
  onScreenshotDelete,
  onScreenshotRename,
  onDelete,
  onEdit,
}: FeedbackPanelProps) {
  const {
    feedbacks,
    setIsAddingFeedback,
  } = useStore();

  // Screenshot rename state
  const [renamingScreenshotId, setRenamingScreenshotId] = useState<string | null>(null);
  const [screenshotRenameValue, setScreenshotRenameValue] = useState("");

  // Feedback edit state
  const [editingFeedbackId, setEditingFeedbackId] = useState<string | null>(null);
  const [feedbackEditValue, setFeedbackEditValue] = useState("");

  // Only show general feedback (non-ui)
  const generalFeedbacks = feedbacks.filter((f) => f.type === "non-ui");

  const handleStartScreenshotRename = (screenshot: Screenshot) => {
    setRenamingScreenshotId(screenshot.id);
    setScreenshotRenameValue(screenshot.pageTitle || "");
  };

  const handleFinishScreenshotRename = (id: string) => {
    if (screenshotRenameValue.trim()) {
      onScreenshotRename(id, screenshotRenameValue.trim());
    }
    setRenamingScreenshotId(null);
    setScreenshotRenameValue("");
  };

  const handleStartFeedbackEdit = (feedback: Feedback) => {
    setEditingFeedbackId(feedback.id);
    setFeedbackEditValue(feedback.content);
  };

  const handleFinishFeedbackEdit = (id: string) => {
    if (feedbackEditValue.trim() && feedbackEditValue.trim() !== feedbacks.find(f => f.id === id)?.content) {
      onEdit(id, feedbackEditValue.trim());
    }
    setEditingFeedbackId(null);
    setFeedbackEditValue("");
  };

  const FeedbackItem = ({ feedback }: { feedback: Feedback }) => (
    <div className="group p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
      {editingFeedbackId === feedback.id ? (
        <textarea
          value={feedbackEditValue}
          onChange={(e) => setFeedbackEditValue(e.target.value)}
          onBlur={() => handleFinishFeedbackEdit(feedback.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleFinishFeedbackEdit(feedback.id);
            } else if (e.key === "Escape") {
              setEditingFeedbackId(null);
            }
          }}
          autoFocus
          className="w-full text-sm bg-white dark:bg-gray-600 border border-blue-500 rounded p-2 outline-none text-gray-900 dark:text-white resize-none"
          rows={3}
        />
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p
            className="text-sm text-gray-900 dark:text-white flex-1 cursor-text hover:text-blue-600 dark:hover:text-blue-400"
            onClick={() => handleStartFeedbackEdit(feedback)}
            title="Click to edit"
          >
            {feedback.content}
          </p>
          <button
            onClick={() => {
              if (confirm("Delete this feedback?")) {
                onDelete(feedback.id);
              }
            }}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
            title="Delete"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Feedback
        </h2>
      </div>

      {/* Action button */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={() => {
            setIsAddingFeedback(false);
            const event = new CustomEvent("openGeneralFeedback");
            window.dispatchEvent(event);
          }}
          className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add Feedback
        </button>
      </div>

      {/* Content - two sections, each 50% height */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* General Feedback Section - 50% */}
        <div className="flex-1 flex flex-col min-h-0 border-b border-gray-200 dark:border-gray-700">
          <div className="p-4 pb-2 flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              General Feedback ({generalFeedbacks.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {generalFeedbacks.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                No feedback yet.
              </p>
            ) : (
              <div className="space-y-2">
                {generalFeedbacks.map((feedback) => (
                  <FeedbackItem key={feedback.id} feedback={feedback} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Screenshots Section - 50% */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-4 pb-2 flex-shrink-0">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Screenshots ({screenshots.length})
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {screenshots.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-4">
                No screenshots yet.
              </p>
            ) : (
              <div className="space-y-2">
                {screenshots.map((screenshot) => (
                  <div
                    key={screenshot.id}
                    className="group relative bg-gray-50 dark:bg-gray-700/50 rounded-lg overflow-hidden cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => onScreenshotClick(screenshot)}
                  >
                    <div className="flex items-center gap-3 p-2">
                      {/* Thumbnail */}
                      <div className="relative w-16 h-12 flex-shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-600">
                        <Image
                          src={`/api/uploads/screenshots/${screenshot.filename}`}
                          alt={screenshot.pageTitle || "Screenshot"}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {renamingScreenshotId === screenshot.id ? (
                          <input
                            type="text"
                            value={screenshotRenameValue}
                            onChange={(e) => setScreenshotRenameValue(e.target.value)}
                            onBlur={() => handleFinishScreenshotRename(screenshot.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleFinishScreenshotRename(screenshot.id);
                              } else if (e.key === "Escape") {
                                setRenamingScreenshotId(null);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="w-full text-sm bg-transparent border-b border-blue-500 outline-none text-gray-900 dark:text-white"
                          />
                        ) : (
                          <p
                            className="text-sm text-gray-900 dark:text-white truncate cursor-text hover:text-blue-600 dark:hover:text-blue-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartScreenshotRename(screenshot);
                            }}
                            title="Click to rename"
                          >
                            {screenshot.pageTitle || "Untitled"}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {screenshot._count?.annotations || 0} annotations
                        </p>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm("Delete this screenshot?")) {
                            onScreenshotDelete(screenshot.id);
                          }
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
