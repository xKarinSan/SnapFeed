import { create } from "zustand";

export interface Project {
  id: string;
  name: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sessions: number;
  };
}

export interface Session {
  id: string;
  title: string;
  projectId: string;
}

interface AppState {
  // Projects
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;

  // Current project
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;
  updateCurrentProject: (updates: Partial<Project>) => void;

  // Current session
  currentSession: Session | null;
  setCurrentSession: (session: Session | null) => void;

  // Theme
  isDarkMode: boolean;
  setIsDarkMode: (isDarkMode: boolean) => void;
  toggleDarkMode: () => void;
}

export const useStore = create<AppState>((set) => ({
  // Projects
  projects: [],
  setProjects: (projects) => set({ projects }),
  addProject: (project) =>
    set((state) => ({ projects: [project, ...state.projects] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  removeProject: (id) =>
    set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

  // Current project
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
  updateCurrentProject: (updates) =>
    set((state) => ({
      currentProject: state.currentProject
        ? { ...state.currentProject, ...updates }
        : null,
    })),

  // Current session
  currentSession: null,
  setCurrentSession: (session) => set({ currentSession: session }),

  // Theme
  isDarkMode: true,
  setIsDarkMode: (isDarkMode) => set({ isDarkMode }),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
}));
