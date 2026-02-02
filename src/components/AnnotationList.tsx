"use client";

import { useState } from "react";
import { Annotation } from "./ScreenshotViewer";

interface AnnotationListProps {
  annotations: Annotation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export default function AnnotationList({
  annotations,
  selectedId,
  onSelect,
  onUpdate,
  onDelete,
}: AnnotationListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const startEditing = (annotation: Annotation) => {
    setEditingId(annotation.id);
    setEditContent(annotation.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = (id: string) => {
    if (editContent.trim()) {
      onUpdate(id, editContent.trim());
      setEditingId(null);
      setEditContent("");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this note?")) {
      onDelete(id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (annotations.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-400 text-sm">
          No notes yet. Click &quot;Add Note&quot; to annotate this screenshot.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="text-white font-medium mb-4">
        Notes ({annotations.length})
      </h3>
      <div className="space-y-3">
        {annotations.map((annotation, index) => (
          <div
            key={annotation.id}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedId === annotation.id
                ? "bg-blue-600/20 border border-blue-500"
                : "bg-gray-800 hover:bg-gray-750 border border-transparent"
            }`}
            onClick={() => onSelect(annotation.id)}
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                {index + 1}
              </span>
              <span className="text-gray-500 text-xs ml-auto">
                {formatDate(annotation.createdAt)}
              </span>
            </div>

            {/* Content */}
            {editingId === annotation.id ? (
              <div className="mt-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm bg-gray-700 border border-gray-600 rounded text-white resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelEditing();
                    }}
                    className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveEdit(annotation.id);
                    }}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-200 text-sm whitespace-pre-wrap">
                  {annotation.content}
                </p>

                {/* Actions */}
                {selectedId === annotation.id && (
                  <div className="flex gap-2 mt-3 pt-2 border-t border-gray-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(annotation);
                      }}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(annotation.id);
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
