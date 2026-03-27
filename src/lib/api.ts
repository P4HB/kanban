import type { Project, Task, Column, Label, DashboardStats } from "./types";

const f = async (url: string, opts?: RequestInit) => {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export const api = {
  // Projects
  getProjects: (): Promise<Project[]> => f("/api/projects"),
  createProject: (data: { name: string; color?: string; icon?: string }): Promise<Project> =>
    f("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  updateProject: (id: string, data: Partial<Project>): Promise<Project> =>
    f(`/api/projects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  deleteProject: (id: string) =>
    f(`/api/projects/${id}`, { method: "DELETE" }),

  // Tasks
  getTasks: (projectId?: string): Promise<Task[]> =>
    f(projectId ? `/api/tasks?projectId=${projectId}` : "/api/tasks"),
  getCalendarTasks: (from: string, to: string): Promise<Task[]> =>
    f(`/api/tasks?from=${from}&to=${to}`),
  createTask: (data: Partial<Task> & { labelIds?: string[] }): Promise<Task> =>
    f("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  updateTask: (id: string, data: Partial<Task> & { labelIds?: string[]; checklistItems?: { content: string; completed: boolean }[] }): Promise<Task> =>
    f(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  moveTask: (id: string, columnId: string, sortOrder: number): Promise<Task> =>
    f(`/api/tasks/${id}/move`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ columnId, sortOrder }) }),
  deleteTask: (id: string) =>
    f(`/api/tasks/${id}`, { method: "DELETE" }),

  // Labels
  getLabels: (): Promise<Label[]> => f("/api/labels"),
  createLabel: (data: { name: string; color?: string }): Promise<Label> =>
    f("/api/labels", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }),
  deleteLabel: (id: string) =>
    f(`/api/labels/${id}`, { method: "DELETE" }),

  // Columns
  getColumns: (): Promise<Column[]> => f("/api/columns"),

  // Dashboard
  getDashboard: (): Promise<DashboardStats> => f("/api/dashboard"),
};
