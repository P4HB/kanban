export type Priority = "urgent" | "high" | "medium" | "low";

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  archived: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  color: string | null;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  projectId: string;
  columnId: string;
  priority: Priority | null;
  dueDate: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  labels?: Label[];
  checklistItems?: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  taskId: string;
  content: string;
  completed: boolean;
  sortOrder: number;
}

export interface DashboardStats {
  totalTasks: number;
  todayDue: number;
  weekDue: number;
  overdue: number;
  byColumn: { name: string; slug: string; count: number; color: string | null }[];
  byProject: { id: string; name: string; color: string; total: number; done: number }[];
}
