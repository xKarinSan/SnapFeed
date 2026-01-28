"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore, Project, Feedback } from "@/lib/store/useStore";
import MiniBrowser from "@/components/MiniBrowser";
import FeedbackPanel from "@/components/FeedbackPanel";
import FeedbackForm from "@/components/FeedbackForm";
import ScreenshotGallery, { Screenshot } from "@/components/ScreenshotGallery";
import ScreenshotViewer from "@/components/ScreenshotViewer";

type ViewMode = "browser" | "screenshots";

export default function ProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const {
    currentProject,
    setCurrentProject,
    updateCurrentProject,
    feedbacks,
    setFeedbacks,
    addFeedback,
    updateFeedback,
    removeFeedback,
    pendingPinPosition,
    setPendingPinPosition,
    setIsAddingFeedback,
  } = useStore();

  const [isLoading, setIsLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isGeneralFeedback, setIsGeneralFeedback] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  // Screenshot state
  const [viewMode, setViewMode] = useState<ViewMode>("browser");
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);

  useEffect(() => {
    fetchProject();
    fetchFeedbacks();
    fetchScreenshots();

    const handleGeneralFeedback = () => {
      setIsGeneralFeedback(true);
      setShowFeedbackForm(true);
    };

    window.addEventListener("openGeneralFeedback", handleGeneralFeedback);
    return () => {
      window.removeEventListener("openGeneralFeedback", handleGeneralFeedback);
    };
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) {
        router.push("/");
        return;
      }
      const data: Project = await response.json();
      setCurrentProject(data);
    } catch (error) {
      console.error("Failed to fetch project:", error);
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/feedback`);
      const data: Feedback[] = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
    }
  };

  const fetchScreenshots = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/screenshots`);
      const data: Screenshot[] = await response.json();
      setScreenshots(data);
    } catch (error) {
      console.error("Failed to fetch screenshots:", error);
    }
  };

  const handleScreenshotCaptured = useCallback((screenshot: {
    id: string;
    filename: string;
    pageUrl: string;
    pageTitle: string;
    createdAt: string;
  }) => {
    setScreenshots(prev => [{
      ...screenshot,
      pageTitle: screenshot.pageTitle || null,
      _count: { annotations: 0 },
    }, ...prev]);
  }, []);

  const handleScreenshotDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/screenshots/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setScreenshots(prev => prev.filter(s => s.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete screenshot:", error);
    }
  };

  const handleScreenshotRename = async (id: string, newTitle: string) => {
    try {
      const response = await fetch(`/api/screenshots/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageTitle: newTitle }),
      });
      if (response.ok) {
        setScreenshots(prev => prev.map(s =>
          s.id === id ? { ...s, pageTitle: newTitle } : s
        ));
      }
    } catch (error) {
      console.error("Failed to rename screenshot:", error);
    }
  };

  const handlePinClick = useCallback(
    (position: { x: number; y: number }) => {
      setPendingPinPosition(position);
      setIsGeneralFeedback(false);
      setShowFeedbackForm(true);
      setIsAddingFeedback(false);
    },
    [setPendingPinPosition, setIsAddingFeedback]
  );

  const handleFeedbackSubmit = async (data: {
    type: "ui" | "non-ui";
    content: string;
    posX?: number;
    posY?: number;
    viewportW?: number;
    viewportH?: number;
  }) => {
    const response = await fetch(`/api/projects/${projectId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        author: "User",
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create feedback");
    }

    const newFeedback: Feedback = await response.json();
    addFeedback(newFeedback);
    setShowFeedbackForm(false);
    setPendingPinPosition(null);
  };

  const handleToggleResolved = async (id: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/feedback/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toggleResolved: true }),
        }
      );

      if (response.ok) {
        const updated: Feedback = await response.json();
        updateFeedback(id, { resolved: updated.resolved });
      }
    } catch (error) {
      console.error("Failed to toggle resolved:", error);
    }
  };

  const handleDeleteFeedback = async (id: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/feedback/${id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        removeFeedback(id);
      }
    } catch (error) {
      console.error("Failed to delete feedback:", error);
    }
  };

  const handleRenameProject = async () => {
    const trimmedName = editedName.trim();
    if (!trimmedName || trimmedName === currentProject?.name) {
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
        updateCurrentProject({ name: trimmedName });
      }
    } catch (error) {
      console.error("Failed to rename project:", error);
    }
    setIsEditingName(false);
  };

  const handleExport = async (format: "markdown" | "pdf") => {
    try {
      const response = await fetch(`/api/projects/${projectId}/export?format=${format}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "pdf" ? "pdf" : "md";
      a.download = `${currentProject?.name || "feedback"}-export.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentProject) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
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
                  className="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 outline-none px-0 py-0"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditedName(currentProject.name);
                    setIsEditingName(true);
                  }}
                  className="group flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Click to rename"
                >
                  {currentProject.name}
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
                {currentProject.url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View mode toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setViewMode("browser")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  viewMode === "browser"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Browser
              </button>
              <button
                onClick={() => setViewMode("screenshots")}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === "screenshots"
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                Screenshots
                {screenshots.length > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {screenshots.length}
                  </span>
                )}
              </button>
            </div>

            <button
              onClick={() => handleExport("markdown")}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export (.md)
            </button>
            <button
              onClick={() => handleExport("pdf")}
              className="px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
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
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export (.pdf)
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main view area */}
        <div className="flex-1 relative">
          {viewMode === "browser" ? (
            <MiniBrowser
              projectId={projectId}
              initialUrl={currentProject.url}
              onScreenshotCaptured={handleScreenshotCaptured}
            />
          ) : (
            <ScreenshotGallery
              projectId={projectId}
              screenshots={screenshots}
              onScreenshotClick={setSelectedScreenshot}
              onScreenshotDelete={handleScreenshotDelete}
              onScreenshotRename={handleScreenshotRename}
            />
          )}
        </div>

        {/* Feedback panel */}
        <FeedbackPanel
          onToggleResolved={handleToggleResolved}
          onDelete={handleDeleteFeedback}
        />
      </div>

      {/* Feedback form modal */}
      {showFeedbackForm && (
        <FeedbackForm
          projectId={projectId}
          position={isGeneralFeedback ? null : pendingPinPosition}
          onSubmit={handleFeedbackSubmit}
          onCancel={() => {
            setShowFeedbackForm(false);
            setIsGeneralFeedback(false);
            setPendingPinPosition(null);
          }}
        />
      )}

      {/* Screenshot viewer modal */}
      {selectedScreenshot && (
        <ScreenshotViewer
          screenshot={selectedScreenshot}
          author="User"
          onClose={() => setSelectedScreenshot(null)}
        />
      )}
    </div>
  );
}
