"use client";

import { useRef, useCallback, MouseEvent } from "react";
import AnnotationPin from "./AnnotationPin";
import { Annotation } from "./ScreenshotViewer";

interface AnnotationCanvasProps {
  annotations: Annotation[];
  selectedId: string | null;
  pendingPosition: { x: number; y: number } | null;
  isAddingMode: boolean;
  onClick: (x: number, y: number) => void;
  onAnnotationClick: (id: string) => void;
}

export default function AnnotationCanvas({
  annotations,
  selectedId,
  pendingPosition,
  isAddingMode,
  onClick,
  onAnnotationClick,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!isAddingMode || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      onClick(x, y);
    },
    [isAddingMode, onClick]
  );

  return (
    <div
      ref={canvasRef}
      className={`absolute inset-0 ${
        isAddingMode ? "cursor-crosshair" : ""
      }`}
      onClick={handleClick}
    >
      {/* Existing annotations */}
      {annotations.map((annotation, index) => (
        <AnnotationPin
          key={annotation.id}
          number={index + 1}
          x={annotation.posX}
          y={annotation.posY}
          content={annotation.content}
          isSelected={annotation.id === selectedId}
          onClick={() => onAnnotationClick(annotation.id)}
        />
      ))}

      {/* Pending annotation position */}
      {pendingPosition && (
        <div
          className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 bg-blue-500 rounded-full border-2 border-white animate-pulse flex items-center justify-center"
          style={{
            left: `${pendingPosition.x}%`,
            top: `${pendingPosition.y}%`,
          }}
        >
          <span className="text-white text-xs font-bold">+</span>
        </div>
      )}
    </div>
  );
}
