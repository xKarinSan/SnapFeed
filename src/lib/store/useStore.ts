import { create } from "zustand";

export interface Feedback {
  id: string;
  projectId: string;
  type: "ui" | "non-ui";
  content: string;
  author: string;
  posX?: number | null;
  posY?: number | null;
  viewportW?: number | null;
  viewportH?: number | null;
  selector?: string | null;
  createdAt: string;
  resolved: boolean;
}

export interface Project {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  feedbacks?: Feedback[];
  _count?: {
    feedbacks: number;
    sessions?: number;
  };
}

export interface Session {
  id: string;
  displayName: string;
  projectId?: string;
}

interface AppState {
  // Session
  session: Session | null;
  setSession: (session: Session | null) => void;

  // Projects
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  removeProject: (id: string) => void;

  // Current project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Feedbacks
  feedbacks: Feedback[];
  setFeedbacks: (feedbacks: Feedback[]) => void;
  addFeedback: (feedback: Feedback) => void;
  updateFeedback: (id: string, updates: Partial<Feedback>) => void;
  removeFeedback: (id: string) => void;

  // UI state
  selectedFeedbackId: string | null;
  setSelectedFeedbackId: (id: string | null) => void;
  isAddingFeedback: boolean;
  setIsAddingFeedback: (value: boolean) => void;
  pendingPinPosition: { x: number; y: number } | null;
  setPendingPinPosition: (position: { x: number; y: number } | null) => void;

  // Participants
  participants: { id: string; displayName: string }[];
  setParticipants: (participants: { id: string; displayName: string }[]) => void;
  addParticipant: (participant: { id: string; displayName: string }) => void;
  removeParticipant: (id: string) => void;
}

export const useStore = create<AppState>((set) => ({
  // Session
  session: null,
  setSession: (session) => set({ session }),

  // Projects
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  removeProject: (id) =>
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

  // Current project
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),

  // Feedbacks
  feedbacks: [],
  setFeedbacks: (feedbacks) => set({ feedbacks }),
  addFeedback: (feedback) =>
    set((state) => ({ feedbacks: [feedback, ...state.feedbacks] })),
  updateFeedback: (id, updates) =>
    set((state) => ({
      feedbacks: state.feedbacks.map((f) =>
        f.id === id ? { ...f, ...updates } : f
      ),
    })),
  removeFeedback: (id) =>
    set((state) => ({ feedbacks: state.feedbacks.filter((f) => f.id !== id) })),

  // UI state
  selectedFeedbackId: null,
  setSelectedFeedbackId: (id) => set({ selectedFeedbackId: id }),
  isAddingFeedback: false,
  setIsAddingFeedback: (value) => set({ isAddingFeedback: value }),
  pendingPinPosition: null,
  setPendingPinPosition: (position) => set({ pendingPinPosition: position }),

  // Participants
  participants: [],
  setParticipants: (participants) => set({ participants }),
  addParticipant: (participant) =>
    set((state) => ({
      participants: [...state.participants, participant],
    })),
  removeParticipant: (id) =>
    set((state) => ({
      participants: state.participants.filter((p) => p.id !== id),
    })),
}));
