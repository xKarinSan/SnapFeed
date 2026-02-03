"use client";

import { useState } from "react";
import Link from "next/link";
import { Project } from "@/lib/store/useStore";
import ConfirmModal from "./ConfirmModal";

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const sessionCount = project._count?.sessions ?? 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {project.name}
        </h3>
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
