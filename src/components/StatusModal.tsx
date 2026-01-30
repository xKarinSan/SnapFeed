"use client";

interface StatusModalProps {
  isOpen: boolean;
  status: "loading" | "success" | "error";
  title: string;
  message?: string;
  onClose?: () => void;
}

export default function StatusModal({
  isOpen,
  status,
  title,
  message,
  onClose,
}: StatusModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={status !== "loading" ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full mx-4 overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center">
          {/* Icon */}
          {status === "loading" && (
            <div className="w-12 h-12 mb-4">
              <svg
                className="animate-spin w-12 h-12 text-blue-600"
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
          )}
          {status === "success" && (
            <div className="w-12 h-12 mb-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          )}
          {status === "error" && (
            <div className="w-12 h-12 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
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
            </div>
          )}

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            {title}
          </h3>
          {message && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {message}
            </p>
          )}
        </div>

        {/* Close button for non-loading states */}
        {status !== "loading" && onClose && (
          <div className="flex justify-center px-6 py-4 bg-gray-50 dark:bg-gray-700/50">
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              OK
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
