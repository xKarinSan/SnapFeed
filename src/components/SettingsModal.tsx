"use client";

import { useState, useEffect, useCallback } from "react";
import { useStore } from "@/lib/store/useStore";

interface LarkSettings {
  appId: string;
  appSecret: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: number;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

interface AppSettings {
  extensionId: string;
  lark?: LarkSettings;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { setLarkAuth } = useStore();

  const [extensionId, setExtensionId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showExtensionId, setShowExtensionId] = useState(false);

  // Lark settings
  const [larkExpanded, setLarkExpanded] = useState(false);
  const [larkAppId, setLarkAppId] = useState("");
  const [larkAppSecret, setLarkAppSecret] = useState("");
  const [showLarkAppSecret, setShowLarkAppSecret] = useState(false);
  const [larkConnected, setLarkConnected] = useState(false);
  const [larkUserName, setLarkUserName] = useState("");
  const [larkUserAvatar, setLarkUserAvatar] = useState("");
  const [isConnectingLark, setIsConnectingLark] = useState(false);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings");
      if (response.ok) {
        const settings: AppSettings = await response.json();
        setExtensionId(settings.extensionId || "");

        // Lark settings
        if (settings.lark) {
          setLarkAppId(settings.lark.appId || "");
          setLarkAppSecret(settings.lark.appSecret || "");
          setLarkConnected(!!settings.lark.accessToken);
          setLarkUserName(settings.lark.userName || "");
          setLarkUserAvatar(settings.lark.userAvatar || "");

          // Update global store
          setLarkAuth({
            isConnected: !!settings.lark.accessToken,
            userName: settings.lark.userName,
            userAvatar: settings.lark.userAvatar,
            appConfigured: !!(settings.lark.appId && settings.lark.appSecret),
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setIsLoading(false);
    }
  }, [setLarkAuth]);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen, fetchSettings]);

  // Listen for OAuth callback message
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "lark-oauth-success") {
        setIsConnectingLark(false);
        fetchSettings(); // Refresh to get updated user info
      } else if (event.data?.type === "lark-oauth-error") {
        setIsConnectingLark(false);
        alert("Failed to connect Lark: " + event.data.error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extensionId,
          lark: {
            appId: larkAppId,
            appSecret: larkAppSecret,
          },
        }),
      });

      if (response.ok) {
        onClose();
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConnectLark = async () => {
    if (!larkAppId || !larkAppSecret) {
      alert("Please enter Lark App ID and App Secret first, then save settings.");
      return;
    }

    setIsConnectingLark(true);

    try {
      // First save the credentials
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          extensionId,
          lark: {
            appId: larkAppId,
            appSecret: larkAppSecret,
          },
        }),
      });

      // Get OAuth URL
      const response = await fetch("/api/lark/auth");
      const data = await response.json();

      if (data.url) {
        // Open OAuth popup
        const popup = window.open(
          data.url,
          "lark-oauth",
          "width=600,height=700,scrollbars=yes"
        );

        // Check if popup was blocked
        if (!popup) {
          alert("Popup was blocked. Please allow popups for this site.");
          setIsConnectingLark(false);
        }
      } else {
        throw new Error(data.error || "Failed to get OAuth URL");
      }
    } catch (error) {
      console.error("Failed to connect Lark:", error);
      alert("Failed to connect Lark. Please check your App ID and Secret.");
      setIsConnectingLark(false);
    }
  };

  const handleDisconnectLark = async () => {
    try {
      const response = await fetch("/api/lark/auth", {
        method: "DELETE",
      });

      if (response.ok) {
        setLarkConnected(false);
        setLarkUserName("");
        setLarkUserAvatar("");

        // Update global store
        setLarkAuth({
          isConnected: false,
          userName: undefined,
          userAvatar: undefined,
          appConfigured: !!(larkAppId && larkAppSecret),
        });
      }
    } catch (error) {
      console.error("Failed to disconnect Lark:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
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
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="animate-spin w-8 h-8 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Chrome Extension ID */}
              <div>
                <label
                  htmlFor="extensionId"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Chrome Extension ID
                </label>
                <div className="relative">
                  <input
                    type={showExtensionId ? "text" : "password"}
                    id="extensionId"
                    value={extensionId}
                    onChange={(e) => setExtensionId(e.target.value)}
                    placeholder="e.g., abcdefghijklmnopqrstuvwxyz123456"
                    className="w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowExtensionId(!showExtensionId)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title={showExtensionId ? "Hide extension ID" : "Show extension ID"}
                  >
                    {showExtensionId ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  The extension ID is shown in Chrome when you load the unpacked extension at chrome://extensions
                </p>
              </div>

              {/* Lark Integration Section */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setLarkExpanded(!larkExpanded)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    <span className="font-medium text-gray-900 dark:text-white">Lark Integration</span>
                    {larkConnected && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
                        Connected
                      </span>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${larkExpanded ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {larkExpanded && (
                  <div className="p-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                    {/* App ID */}
                    <div>
                      <label
                        htmlFor="larkAppId"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        App ID
                      </label>
                      <input
                        type="text"
                        id="larkAppId"
                        value={larkAppId}
                        onChange={(e) => setLarkAppId(e.target.value)}
                        placeholder="cli_xxxxxxxx"
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                      />
                    </div>

                    {/* App Secret */}
                    <div>
                      <label
                        htmlFor="larkAppSecret"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        App Secret
                      </label>
                      <div className="relative">
                        <input
                          type={showLarkAppSecret ? "text" : "password"}
                          id="larkAppSecret"
                          value={larkAppSecret}
                          onChange={(e) => setLarkAppSecret(e.target.value)}
                          placeholder="Enter your App Secret"
                          className="w-full px-3 py-2 pr-10 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLarkAppSecret(!showLarkAppSecret)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                          {showLarkAppSecret ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        Get your App ID and Secret from the{" "}
                        <a
                          href="https://open.larksuite.com/app"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Lark Developer Console
                        </a>
                      </p>
                    </div>

                    {/* Connection Status / Connect Button */}
                    <div className="pt-2">
                      {larkConnected ? (
                        <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-3">
                            {larkUserAvatar ? (
                              <img
                                src={larkUserAvatar}
                                alt={larkUserName}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                                {larkUserName?.charAt(0) || "L"}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {larkUserName || "Connected"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                Lark account connected
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={handleDisconnectLark}
                            className="px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleConnectLark}
                          disabled={isConnectingLark || !larkAppId || !larkAppSecret}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
                        >
                          {isConnectingLark ? (
                            <>
                              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Connecting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                              </svg>
                              Connect Lark Account
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && (
          <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors flex items-center gap-2"
            >
              {isSaving && (
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              Save
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
