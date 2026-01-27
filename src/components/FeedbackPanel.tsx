"use client";

import { useStore, Feedback } from "@/lib/store/useStore";

interface FeedbackPanelProps {
  onToggleResolved: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function FeedbackPanel({
  onToggleResolved,
  onDelete,
}: FeedbackPanelProps) {
  const {
    feedbacks,
    selectedFeedbackId,
    setSelectedFeedbackId,
    setIsAddingFeedback,
  } = useStore();

  const uiFeedbacks = feedbacks.filter((f) => f.type === "ui");
  const nonUIFeedbacks = feedbacks.filter((f) => f.type === "non-ui");

  const FeedbackItem = ({
    feedback,
    index,
  }: {
    feedback: Feedback;
    index?: number;
  }) => (
    <div
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        selectedFeedbackId === feedback.id
          ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
          : "bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700"
      }`}
      onClick={() => setSelectedFeedbackId(feedback.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {index !== undefined && (
            <span
              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white mr-2 ${
                feedback.resolved ? "bg-green-500" : "bg-red-500"
              }`}
            >
              {index + 1}
            </span>
          )}
          <p className="text-sm text-gray-900 dark:text-white inline">
            {feedback.content}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          — {feedback.author}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleResolved(feedback.id);
            }}
            className={`text-xs px-2 py-1 rounded ${
              feedback.resolved
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300"
            }`}
          >
            {feedback.resolved ? "Resolved" : "Open"}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Delete this feedback?")) {
                onDelete(feedback.id);
              }
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
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
    </div>
  );

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Feedback ({feedbacks.length})
        </h2>
      </div>

      {/* Action buttons */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setIsAddingFeedback(false);
            const event = new CustomEvent("openGeneralFeedback");
            window.dispatchEvent(event);
          }}
          className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          + General
        </button>
      </div>

      {/* Feedback list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {feedbacks.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm py-8">
            No feedback yet. Click on the preview to add UI feedback or use the
            buttons above.
          </p>
        ) : (
          <>
            {/* UI Feedback Section */}
            {uiFeedbacks.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  UI Feedback ({uiFeedbacks.length})
                </h3>
                <div className="space-y-2">
                  {uiFeedbacks.map((feedback, index) => (
                    <FeedbackItem
                      key={feedback.id}
                      feedback={feedback}
                      index={index}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* General Feedback Section */}
            {nonUIFeedbacks.length > 0 && (
              <div className={uiFeedbacks.length > 0 ? "mt-6" : ""}>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  General Feedback ({nonUIFeedbacks.length})
                </h3>
                <div className="space-y-2">
                  {nonUIFeedbacks.map((feedback) => (
                    <FeedbackItem key={feedback.id} feedback={feedback} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
