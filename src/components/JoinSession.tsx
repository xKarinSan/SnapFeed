"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store/useStore";
import { v4 as uuidv4 } from "uuid";

interface JoinSessionProps {
  projectId: string;
  onJoin: (session: { id: string; displayName: string }) => void;
}

const SESSION_STORAGE_KEY = "feedback-collector-session";

export default function JoinSession({ projectId, onJoin }: JoinSessionProps) {
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { session, setSession } = useStore();

  useEffect(() => {
    // Check for existing session in localStorage
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const parsedSession = JSON.parse(stored);
        setSession(parsedSession);
        onJoin(parsedSession);
      } catch {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, [setSession, onJoin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    const newSession = {
      id: uuidv4(),
      displayName: displayName.trim(),
      projectId,
    };

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
    setSession(newSession);
    onJoin(newSession);
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Join Session
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Enter your name to start providing feedback
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!displayName.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
