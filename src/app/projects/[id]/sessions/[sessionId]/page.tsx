"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store/useStore";
import MiniBrowser from "@/components/MiniBrowser";
import FeedbackPanel from "@/components/FeedbackPanel";
import FeedbackForm from "@/components/FeedbackForm";
import { Screenshot } from "@/components/ScreenshotGallery";
import ScreenshotViewer from "@/components/ScreenshotViewer";
import { useToast } from "@/components/Toast";
import StatusModal from "@/components/StatusModal";

interface Session {
  id: string;
  projectId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    name: string;
    url: string;
  };
}

interface Feedback {
  id: string;
  sessionId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const projectId = params.id as string;
  const sessionId = params.sessionId as string;

  const { currentProject, setCurrentProject, setCurrentSession } = useStore();

  const [session, setSession] = useState<Session | null>(null);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");

  // Screenshot state
  const [screenshots, setScreenshots] = useState<Screenshot[]>([]);
  const [selectedScreenshot, setSelectedScreenshot] = useState<Screenshot | null>(null);

  // Export status state
  const [exportStatus, setExportStatus] = useState<{
    isOpen: boolean;
    status: "loading" | "success" | "error";
    format: "markdown" | "pdf" | null;
  }>({ isOpen: false, status: "loading", format: null });

  useEffect(() => {
    fetchSession();
    fetchFeedbacks();
    fetchScreenshots();

    const handleGeneralFeedback = () => {
      setShowFeedbackForm(true);
    };

    window.addEventListener("openGeneralFeedback", handleGeneralFeedback);
    return () => {
      window.removeEventListener("openGeneralFeedback", handleGeneralFeedback);
      // Clear session when leaving
      setCurrentSession(null);
    };
  }, [projectId, sessionId, setCurrentSession]);

  const fetchSession = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sessions/${sessionId}`);
      if (!response.ok) {
        router.push(`/projects/${projectId}`);
        return;
      }
      const data: Session = await response.json();
      setSession(data);
      // Set current session for navbar
      setCurrentSession({
        id: data.id,
        title: data.title,
        projectId: data.projectId,
      });
      // Also set the project for compatibility
      if (data.project) {
        setCurrentProject({
          id: data.project.id,
          name: data.project.name,
          url: data.project.url,
          createdAt: "",
          updatedAt: "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch session:", error);
      router.push(`/projects/${projectId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sessions/${sessionId}/feedback`);
      const data: Feedback[] = await response.json();
      setFeedbacks(data);
    } catch (error) {
      console.error("Failed to fetch feedbacks:", error);
    }
  };

  const fetchScreenshots = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/sessions/${sessionId}/screenshots`);
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
    showToast("Screenshot captured");
  }, [showToast]);

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

  const handleAnnotationCountChange = useCallback((screenshotId: string, count: number) => {
    setScreenshots(prev => prev.map(s =>
      s.id === screenshotId ? { ...s, _count: { annotations: count } } : s
    ));
  }, []);

  const handleFeedbackSubmit = async (data: { content: string }) => {
    const response = await fetch(`/api/projects/${projectId}/sessions/${sessionId}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: data.content }),
    });

    if (!response.ok) {
      throw new Error("Failed to create feedback");
    }

    const newFeedback: Feedback = await response.json();
    setFeedbacks(prev => [newFeedback, ...prev]);
    setShowFeedbackForm(false);
  };

  const handleDeleteFeedback = async (id: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/sessions/${sessionId}/feedback/${id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setFeedbacks(prev => prev.filter(f => f.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete feedback:", error);
    }
  };

  const handleEditFeedback = async (id: string, content: string) => {
    try {
      const response = await fetch(
        `/api/projects/${projectId}/sessions/${sessionId}/feedback/${id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        }
      );

      if (response.ok) {
        setFeedbacks(prev => prev.map(f =>
          f.id === id ? { ...f, content } : f
        ));
      }
    } catch (error) {
      console.error("Failed to edit feedback:", error);
    }
  };

  const handleRenameSession = async () => {
    const trimmedTitle = editedTitle.trim();
    if (!trimmedTitle || trimmedTitle === session?.title) {
      setIsEditingTitle(false);
      return;
    }
    try {
      const response = await fetch(`/api/projects/${projectId}/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle }),
      });
      if (response.ok) {
        setSession(prev => prev ? { ...prev, title: trimmedTitle } : null);
        // Update navbar session title
        setCurrentSession({
          id: sessionId,
          title: trimmedTitle,
          projectId: projectId,
        });
      }
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
    setIsEditingTitle(false);
  };

  const handleExport = async (format: "markdown" | "pdf") => {
    setExportStatus({ isOpen: true, status: "loading", format });

    try {
      const response = await fetch(`/api/projects/${projectId}/export?format=${format}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = format === "pdf" ? "pdf" : "md";
      a.download = `${session?.title || "feedback"}-export.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setExportStatus({ isOpen: true, status: "success", format });
    } catch (error) {
      console.error("Failed to export:", error);
      setExportStatus({ isOpen: true, status: "error", format });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="h-screen max-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/projects/${projectId}`}
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
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                <Link href={`/projects/${projectId}`} className="hover:text-blue-600 dark:hover:text-blue-400">
                  {session.project?.name}
                </Link>
                <span>/</span>
              </div>
              {isEditingTitle ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  onBlur={handleRenameSession}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleRenameSession();
                    } else if (e.key === "Escape") {
                      setIsEditingTitle(false);
                    }
                  }}
                  autoFocus
                  className="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 outline-none px-0 py-0"
                />
              ) : (
                <button
                  onClick={() => {
                    setEditedTitle(session.title);
                    setIsEditingTitle(true);
                  }}
                  className="group flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  title="Click to rename"
                >
                  {session.title}
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
                {session.project?.url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
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
          <MiniBrowser
            projectId={projectId}
            sessionId={sessionId}
            initialUrl={session.project?.url || ""}
            onScreenshotCaptured={handleScreenshotCaptured}
          />
        </div>

        {/* Feedback panel */}
        <FeedbackPanel
          feedbacks={feedbacks}
          screenshots={screenshots}
          onScreenshotClick={setSelectedScreenshot}
          onScreenshotDelete={handleScreenshotDelete}
          onScreenshotRename={handleScreenshotRename}
          onDelete={handleDeleteFeedback}
          onEdit={handleEditFeedback}
        />
      </div>

      {/* Feedback form modal */}
      {showFeedbackForm && (
        <FeedbackForm
          onSubmit={handleFeedbackSubmit}
          onCancel={() => setShowFeedbackForm(false)}
        />
      )}

      {/* Screenshot viewer modal */}
      {selectedScreenshot && (
        <ScreenshotViewer
          screenshot={selectedScreenshot}
          onClose={() => setSelectedScreenshot(null)}
          onAnnotationCountChange={handleAnnotationCountChange}
        />
      )}

      {/* Export status modal */}
      <StatusModal
        isOpen={exportStatus.isOpen}
        status={exportStatus.status}
        title={
          exportStatus.status === "loading"
            ? "Exporting..."
            : exportStatus.status === "success"
            ? "Export Successful"
            : "Export Failed"
        }
        message={
          exportStatus.status === "loading"
            ? `Preparing ${exportStatus.format === "pdf" ? "PDF" : "Markdown"} export...`
            : exportStatus.status === "success"
            ? `Your ${exportStatus.format === "pdf" ? "PDF" : "Markdown"} file has been saved.`
            : "An error occurred while exporting. Please try again."
        }
        onClose={() => setExportStatus({ isOpen: false, status: "loading", format: null })}
      />
    </div>
  );
}
