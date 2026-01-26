import { Feedback } from "@/lib/store/useStore";

export interface ServerToClientEvents {
  "feedback:created": (feedback: Feedback) => void;
  "feedback:updated": (feedback: Feedback) => void;
  "feedback:deleted": (feedbackId: string) => void;
  "participant:joined": (participant: { id: string; displayName: string }) => void;
  "participant:left": (participantId: string) => void;
  "participants:list": (participants: { id: string; displayName: string }[]) => void;
}

export interface ClientToServerEvents {
  "room:join": (data: { projectId: string; displayName: string }) => void;
  "room:leave": (projectId: string) => void;
  "feedback:create": (feedback: Omit<Feedback, "id" | "createdAt">) => void;
  "feedback:update": (data: { id: string; updates: Partial<Feedback> }) => void;
  "feedback:delete": (feedbackId: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  projectId?: string;
  displayName?: string;
}
