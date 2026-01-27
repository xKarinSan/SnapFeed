"use client";

import { useEffect, useCallback } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket/client";
import { useStore, Feedback } from "@/lib/store/useStore";

export function useRealtimeFeedback(projectId: string) {
  const {
    session,
    addFeedback,
    updateFeedback,
    removeFeedback,
    setParticipants,
    addParticipant,
    removeParticipant,
  } = useStore();

  const joinRoom = useCallback(() => {
    if (!session?.displayName) return;

    const socket = getSocket();
    socket.emit("room:join", {
      projectId,
      displayName: session.displayName,
    });
  }, [projectId, session?.displayName]);

  useEffect(() => {
    if (!session?.displayName) return;

    const socket = getSocket();

    // Join the room when connected
    socket.on("connect", joinRoom);

    // If already connected, join immediately
    if (socket.connected) {
      joinRoom();
    }

    // Handle feedback events
    socket.on("feedback:created", (feedback: Feedback) => {
      addFeedback(feedback);
    });

    socket.on("feedback:updated", (feedback: Feedback) => {
      updateFeedback(feedback.id, feedback);
    });

    socket.on("feedback:deleted", (feedbackId: string) => {
      removeFeedback(feedbackId);
    });

    // Handle participant events
    socket.on("participants:list", (participants) => {
      setParticipants(participants);
    });

    socket.on("participant:joined", (participant) => {
      addParticipant(participant);
    });

    socket.on("participant:left", (participantId) => {
      removeParticipant(participantId);
    });

    // Cleanup
    return () => {
      socket.emit("room:leave", projectId);
      socket.off("connect", joinRoom);
      socket.off("feedback:created");
      socket.off("feedback:updated");
      socket.off("feedback:deleted");
      socket.off("participants:list");
      socket.off("participant:joined");
      socket.off("participant:left");
    };
  }, [
    projectId,
    session?.displayName,
    joinRoom,
    addFeedback,
    updateFeedback,
    removeFeedback,
    setParticipants,
    addParticipant,
    removeParticipant,
  ]);

  const emitFeedbackCreate = useCallback(
    (feedback: Omit<Feedback, "id" | "createdAt">) => {
      const socket = getSocket();
      socket.emit("feedback:create", feedback);
    },
    []
  );

  const emitFeedbackUpdate = useCallback(
    (id: string, updates: Partial<Feedback>) => {
      const socket = getSocket();
      socket.emit("feedback:update", { id, updates });
    },
    []
  );

  const emitFeedbackDelete = useCallback((feedbackId: string) => {
    const socket = getSocket();
    socket.emit("feedback:delete", feedbackId);
  }, []);

  return {
    emitFeedbackCreate,
    emitFeedbackUpdate,
    emitFeedbackDelete,
    disconnect: disconnectSocket,
  };
}
