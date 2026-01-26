"use client";

import { useState } from "react";
import { useStore } from "@/lib/store/useStore";

interface FeedbackFormProps {
  projectId: string;
  position?: { x: number; y: number } | null;
  onSubmit: (data: {
    type: "ui" | "non-ui";
    content: string;
    posX?: number;
    posY?: number;
    viewportW?: number;
    viewportH?: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function FeedbackForm({
  position,
  onSubmit,
  onCancel,
}: FeedbackFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setIsAddingFeedback, setPendingPinPosition } = useStore();

  const isUIFeedback = position !== null && position !== undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        type: isUIFeedback ? "ui" : "non-ui",
        content: content.trim(),
        posX: position?.x,
        posY: position?.y,
        viewportW: typeof window !== "undefined" ? window.innerWidth : undefined,
        viewportH: typeof window !== "undefined" ? window.innerHeight : undefined,
      });
      setContent("");
      setIsAddingFeedback(false);
      setPendingPinPosition(null);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent("");
    setIsAddingFeedback(false);
    setPendingPinPosition(null);
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {isUIFeedback ? "Add UI Feedback" : "Add General Feedback"}
        </h2>

        {isUIFeedback && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Position: ({position?.x.toFixed(1)}%, {position?.y.toFixed(1)}%)
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="content"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Your Feedback
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your feedback..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
