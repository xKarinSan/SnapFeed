"use client";

import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";

// Extension ID - update this after loading the extension in Chrome
const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID || "";

interface Screenshot {
  id: string;
  filename: string;
  pageUrl: string;
  pageTitle: string;
  createdAt: string;
}

interface MiniBrowserProps {
  projectId: string;
  initialUrl?: string;
  onScreenshotCaptured?: (screenshot: Screenshot) => void;
}

// Check if Chrome extension APIs are available
const isChromeExtensionAvailable = () => {
  return (
    typeof chrome !== "undefined" &&
    chrome.runtime &&
    typeof chrome.runtime.sendMessage === "function"
  );
};

export default function MiniBrowser({
  projectId,
  initialUrl = "",
  onScreenshotCaptured,
}: MiniBrowserProps) {
  const [url, setUrl] = useState(initialUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl);
  const [isCapturing, setIsCapturing] = useState(false);
  const [extensionAvailable, setExtensionAvailable] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Check if extension is available on mount
  useEffect(() => {
    if (!EXTENSION_ID || !isChromeExtensionAvailable()) {
      setExtensionAvailable(false);
      return;
    }

    chrome.runtime.sendMessage(
      EXTENSION_ID,
      { action: "ping" },
      (response: { status?: string } | undefined) => {
        if (chrome.runtime.lastError) {
          setExtensionAvailable(false);
        } else {
          setExtensionAvailable(response?.status === "ok");
        }
      }
    );
  }, []);

  const normalizeUrl = (input: string): string => {
    if (!input.trim()) return "";
    if (input.startsWith("http://") || input.startsWith("https://")) {
      return input;
    }
    const isInternal =
      input.startsWith("localhost") ||
      input.startsWith("127.0.0.1") ||
      input.startsWith("192.168.") ||
      input.startsWith("10.");
    return isInternal ? `http://${input}` : `https://${input}`;
  };

  const handleNavigate = (e: FormEvent) => {
    e.preventDefault();
    const normalized = normalizeUrl(inputUrl);
    if (normalized) {
      setUrl(normalized);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleNavigate(e);
    }
  };

  const handleReload = () => {
    if (iframeRef.current && url) {
      iframeRef.current.src = url;
    }
  };

  // Capture using Chrome extension (no dialog)
  const captureViaExtension = async (
    rect: DOMRect
  ): Promise<string | null> => {
    console.log("captureViaExtension | EXTENSION_ID",EXTENSION_ID)
    if (!EXTENSION_ID || !isChromeExtensionAvailable()) {
      return null;
    }

    return new Promise((resolve) => {
      const scale = window.devicePixelRatio || 1;
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        {
          action: "captureScreenshot",
          crop: {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
            scale,
          },
        },
        (response: { dataUrl?: string; error?: string } | undefined) => {
          if (chrome.runtime.lastError || response?.error) {
            console.error(
              "Extension capture failed:",
              chrome.runtime.lastError?.message || response?.error
            );
            resolve(null);
          } else {
            resolve(response?.dataUrl || null);
          }
        }
      );
    });
  };

  // Capture using Screen Capture API (shows dialog)
  const captureViaScreenCapture = async (rect: DOMRect): Promise<string> => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        displaySurface: "browser",
      },
      preferCurrentTab: true,
    } as DisplayMediaStreamOptions);

    const video = document.createElement("video");
    video.srcObject = stream;
    video.muted = true;
    await video.play();

    await new Promise((resolve) => requestAnimationFrame(resolve));

    const scaleX = video.videoWidth / window.innerWidth;
    const scaleY = video.videoHeight / window.innerHeight;

    const cropX = rect.left * scaleX;
    const cropY = rect.top * scaleY;
    const cropWidth = rect.width * scaleX;
    const cropHeight = rect.height * scaleY;

    const canvas = document.createElement("canvas");
    canvas.width = cropWidth;
    canvas.height = cropHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get canvas context");
    ctx.drawImage(
      video,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    stream.getTracks().forEach((t) => t.stop());
    video.srcObject = null;

    return canvas.toDataURL("image/png");
  };

  const handleScreenshot = async () => {
    if (!url || isCapturing || !viewportRef.current) return;

    setIsCapturing(true);
    try {
      const rect = viewportRef.current.getBoundingClientRect();
      let dataUrl: string | null = null;

      // Try extension first (no dialog), fallback to Screen Capture API
      if (extensionAvailable) {
        dataUrl = await captureViaExtension(rect);
      }

      if (!dataUrl) {
        dataUrl = await captureViaScreenCapture(rect);
      }

      // Send to API
      const response = await fetch(`/api/projects/${projectId}/screenshots`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataUrl,
          pageUrl: url,
          sessionId: "user",
        }),
      });

      if (response.ok) {
        const screenshot = await response.json();
        onScreenshotCaptured?.(screenshot);
      } else {
        const error = await response.json();
        console.error("Screenshot failed:", error);
      }
    } catch (error) {
      if ((error as Error).name !== "NotAllowedError") {
        console.error("Screenshot failed:", error);
      }
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-700">
      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 bg-gray-800 border-b border-gray-700">
        <button
          onClick={handleReload}
          className="p-2 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="Reload"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        <form onSubmit={handleNavigate} className="flex-1">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter URL (e.g., localhost:3000)"
            className="w-full px-3 py-1.5 text-sm bg-gray-900 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
          />
        </form>

        <button
          onClick={handleScreenshot}
          disabled={!url || isCapturing}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={
            extensionAvailable
              ? "Take screenshot"
              : "Take screenshot (will show share dialog)"
          }
        >
          {isCapturing ? (
            <svg
              className="animate-spin h-4 w-4"
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
          ) : (
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
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          )}
          Screenshot
        </button>
      </div>

      {/* Iframe container */}
      <div ref={viewportRef} className="flex-1 bg-white">
        {url ? (
          <iframe
            ref={iframeRef}
            src={url}
            className="w-full h-full border-0"
            title="Mini Browser"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-900 text-gray-500">
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-3 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
              <p className="text-sm">Enter a URL above to browse</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
