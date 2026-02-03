"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Session {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    feedbacks: number;
    screenshots: number;
  };
}

interface SessionCardProps {
  session: Session;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export default function SessionCard({ session, onDelete, onRename }: SessionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);
  const feedbackCount = session._count?.feedbacks ?? 0;
  const screenshotCount = session._count?.screenshots ?? 0;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedTitle = editedTitle.trim();
    if (trimmedTitle && trimmedTitle !== session.title) {
      onRename(session.id, trimmedTitle);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(session.title);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 mr-2">
            <input
              ref={inputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="flex-1 px-2 py-1 text-lg font-semibold border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {session.title}
            </h3>
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsEditing(true);
              }}
              className="text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
              title="Rename session"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
          </div>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            if (confirm("Are you sure you want to delete this session?")) {
              onDelete(session.id);
            }
          }}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Delete session"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Created {formatDate(session.createdAt)}
      </p>

      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-300">
          <span>
            {feedbackCount} feedback{feedbackCount !== 1 ? "s" : ""}
          </span>
          <span>
            {screenshotCount} screenshot{screenshotCount !== 1 ? "s" : ""}
          </span>
        </div>
        <Link
          href={`/projects/${session.projectId}/sessions/${session.id}`}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          Open &rarr;
        </Link>
      </div>
    </div>
  );
}
