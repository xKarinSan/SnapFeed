"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import SessionCard from "@/components/SessionCard";
import CreateSessionModal from "@/components/CreateSessionModal";

interface Project {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
}

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

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  useEffect(() => {
    fetchProject();
    fetchSessions();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        router.push("/");
        return;
      }
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error("Failed to fetch project:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sessions`);
      const data: Session[] = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    }
  };

  const handleCreateSession = async (title: string) => {
    const response = await fetch(`/api/projects/${projectId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      throw new Error("Failed to create session");
    }

    const newSession = await response.json();
    // Navigate to the new session
    router.push(`/projects/${projectId}/sessions/${newSession.id}`);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sessions/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const handleRenameSession = async (id: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
      }
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  };

  const handleRenameProject = async () => {
    const trimmedName = editedName.trim();
    if (!trimmedName || trimmedName === project?.name) {
      setIsEditingName(false);
      return;
    }
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      if (response.ok) {
        setProject(prev => prev ? { ...prev, name: trimmedName } : null);
      }
    } catch (error) {
      console.error("Failed to rename project:", error);
    }
    setIsEditingName(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                {isEditingName ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onBlur={handleRenameProject}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRenameProject();
                      } else if (e.key === "Escape") {
                        setIsEditingName(false);
                      }
                    }}
                    autoFocus
                    className="text-xl font-semibold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 outline-none px-0 py-0"
                  />
                ) : (
                  <button
                    onClick={() => {
                      setEditedName(project.name);
                      setIsEditingName(true);
                    }}
                    className="group flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Click to rename"
                  >
                    {project.name}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">
                  {project.url}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              New Session
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Feedback Sessions
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No sessions yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Create your first feedback session to start collecting feedback.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Session
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onDelete={handleDeleteSession}
                onRename={handleRenameSession}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create session modal */}
      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateSession}
      />
    </div>
  );
}
