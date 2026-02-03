"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Project } from "@/lib/store/useStore";
import ConfirmModal from "./ConfirmModal";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export default function ProjectCard({ project, onDelete, onRename }: ProjectCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(project.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const sessionCount = project._count?.sessions ?? 0;

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    const trimmedName = editedName.trim();
    if (trimmedName && trimmedName !== project.name) {
      onRename(project.id, trimmedName);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(project.name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 mr-2">
            <input
              ref={inputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="flex-1 px-2 py-1 text-lg font-semibold border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {project.name}
            </h3>
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsEditing(true);
              }}
              className="text-gray-400 hover:text-blue-500 transition-colors flex-shrink-0"
              title="Rename project"
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
            setShowDeleteModal(true);
          }}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Delete project"
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

        <ConfirmModal
          isOpen={showDeleteModal}
          title="Delete Project"
          message={`Are you sure you want to delete "${project.name}"? This will also delete all sessions and feedback associated with this project.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={() => {
            onDelete(project.id);
            setShowDeleteModal(false);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 truncate">
        {project.url}
      </p>

      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          {sessionCount} session{sessionCount !== 1 ? "s" : ""}
        </span>
        <Link
          href={`/projects/${project.id}`}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
        >
          Open &rarr;
        </Link>
      </div>
    </div>
  );
}
