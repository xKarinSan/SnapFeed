"use client";

import { useRef } from "react";
import { useStore } from "@/lib/store/useStore";
import FeedbackPin from "./FeedbackPin";

interface FeedbackCanvasProps {
  onPinClick: (position: { x: number; y: number }) => void;
}

export default function FeedbackCanvas({ onPinClick }: FeedbackCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    feedbacks,
    selectedFeedbackId,
    setSelectedFeedbackId,
    isAddingFeedback,
  } = useStore();

  const uiFeedbacks = feedbacks.filter((f) => f.type === "ui");

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingFeedback || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onPinClick({ x, y });
  };

  return (
    <div
      ref={canvasRef}
      className={`absolute inset-0 z-10 ${
        isAddingFeedback ? "cursor-crosshair" : ""
      }`}
      onClick={handleCanvasClick}
    >
      {/* Overlay hint when adding feedback */}
      {isAddingFeedback && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg text-sm z-30">
          Click anywhere to place a feedback pin
        </div>
      )}

      {/* Render all UI feedback pins */}
      {uiFeedbacks.map((feedback, index) => (
        <FeedbackPin
          key={feedback.id}
          feedback={feedback}
          isSelected={selectedFeedbackId === feedback.id}
          index={index}
          onClick={() => setSelectedFeedbackId(feedback.id)}
        />
      ))}
    </div>
  );
}
