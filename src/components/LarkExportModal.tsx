"use client";

import { useState, useEffect } from "react";

interface LarkExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
  sessionId: string;
  sessionTitle: string;
}

interface Folder {
  token: string;
  name: string;
}

interface Chat {
  id: string;
  name: string;
  avatar: string;
  type: string;
}

type ExportStatus = "idle" | "loading" | "exporting" | "success" | "error";

export default function LarkExportModal({
  isOpen,
  onClose,
  projectId,
  projectName,
  sessionId,
  sessionTitle,
}: LarkExportModalProps) {
  const [status, setStatus] = useState<ExportStatus>("idle");
  const [error, setError] = useState<string>("");
  const [documentUrl, setDocumentUrl] = useState<string>("");

  // Form state
  const [documentTitle, setDocumentTitle] = useState("");
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [rootFolderToken, setRootFolderToken] = useState<string>("");
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [shareEnabled, setShareEnabled] = useState(false);

  // Check if authenticated
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDocumentTitle(`${projectName} - ${sessionTitle}`);
      setStatus("loading");
      checkAuthAndLoadData();
    } else {
      // Reset state when closing
      setStatus("idle");
      setError("");
      setDocumentUrl("");
      setSelectedChats([]);
      setShareEnabled(false);
    }
  }, [isOpen, projectName, sessionTitle]);

  const checkAuthAndLoadData = async () => {
    try {
      // Check auth by trying to load folders
      const foldersRes = await fetch("/api/lark/folders");

      if (foldersRes.status === 401) {
        setIsAuthenticated(false);
        setStatus("idle");
        return;
      }

      setIsAuthenticated(true);

      const foldersData = await foldersRes.json();
      setFolders(foldersData.folders || []);
      setRootFolderToken(foldersData.rootToken || "");

      // Load chats
      const chatsRes = await fetch("/api/lark/chats");
      if (chatsRes.ok) {
        const chatsData = await chatsRes.json();
        setChats(chatsData.chats || []);
      }

      setStatus("idle");
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load Lark data");
      setStatus("error");
    }
  };

  const handleExport = async () => {
    setStatus("exporting");
    setError("");

    try {
      const response = await fetch("/api/lark/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          sessionId,
          folderToken: selectedFolder || rootFolderToken,
          title: documentTitle,
          chatIds: shareEnabled ? selectedChats : [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Export failed");
      }

      setDocumentUrl(data.documentUrl);
      setStatus("success");
    } catch (err) {
      console.error("Export error:", err);
      setError(err instanceof Error ? err.message : "Export failed");
      setStatus("error");
    }
  };

  const toggleChat = (chatId: string) => {
    setSelectedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            Export to Lark
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {status === "loading" && (
            <div className="flex items-center justify-center py-12">
              <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}

          {isAuthenticated === false && status !== "loading" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Not Connected to Lark
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Please connect your Lark account in Settings first.
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {status === "success" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Export Successful!
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Your feedback has been exported to Lark.
              </p>
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Open Document
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Export Failed
              </h3>
              <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={() => setStatus("idle")}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {isAuthenticated && status === "idle" && (
            <div className="space-y-5">
              {/* Document Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Folder Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Save to Folder
                </label>
                <select
                  value={selectedFolder}
                  onChange={(e) => setSelectedFolder(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">My Drive (Root)</option>
                  {folders.map((folder) => (
                    <option key={folder.token} value={folder.token}>
                      {folder.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Share to Chats */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Share to Chats
                  </label>
                  <button
                    type="button"
                    onClick={() => setShareEnabled(!shareEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      shareEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        shareEnabled ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {shareEnabled && (
                  <div className="max-h-48 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                    {chats.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                        No chats available
                      </p>
                    ) : (
                      chats.map((chat) => (
                        <label
                          key={chat.id}
                          className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                        >
                          <input
                            type="checkbox"
                            checked={selectedChats.includes(chat.id)}
                            onChange={() => toggleChat(chat.id)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          {chat.avatar ? (
                            <img
                              src={chat.avatar}
                              alt={chat.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                              {chat.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm text-gray-900 dark:text-white truncate">
                            {chat.name}
                          </span>
                          {chat.type === "group" && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Group
                            </span>
                          )}
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {isAuthenticated && (status === "idle" || status === "exporting") && (
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              disabled={status === "exporting"}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={status === "exporting" || !documentTitle}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-2"
            >
              {status === "exporting" ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                  Export
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
