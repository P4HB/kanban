import { create } from "zustand";
import type { Project, Column, Task, Label } from "@/lib/types";

interface AppState {
  projects: Project[];
  columns: Column[];
  tasks: Task[];
  labels: Label[];
  selectedProjectId: string | null;

  setProjects: (projects: Project[]) => void;
  setColumns: (columns: Column[]) => void;
  setTasks: (tasks: Task[]) => void;
  setLabels: (labels: Label[]) => void;
  setSelectedProjectId: (id: string | null) => void;

  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  removeProject: (id: string) => void;

  addTask: (task: Task) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  removeTask: (id: string) => void;
  moveTask: (taskId: string, columnId: string, sortOrder: number) => void;
}

export const useStore = create<AppState>((set) => ({
  projects: [],
  columns: [],
  tasks: [],
  labels: [],
  selectedProjectId: null,

  setProjects: (projects) => set({ projects }),
  setColumns: (columns) => set({ columns }),
  setTasks: (tasks) => set({ tasks }),
  setLabels: (labels) => set({ labels }),
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),

  addProject: (project) =>
    set((s) => ({ projects: [...s.projects, project] })),
  updateProject: (id, data) =>
    set((s) => ({
      projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),
  removeProject: (id) =>
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),

  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (id, data) =>
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
    })),
  removeTask: (id) =>
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  moveTask: (taskId, columnId, sortOrder) =>
    set((s) => ({
      tasks: s.tasks.map((t) =>
        t.id === taskId ? { ...t, columnId, sortOrder } : t
      ),
    })),
}));
