"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowUp, ArrowDown, Minus, Calendar, CheckSquare, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Task, Project, Column } from "@/lib/types";

const PRIORITY_SECTIONS = [
  { key: "urgent", label: "Urgent", icon: AlertTriangle, accent: "border-red-400 dark:border-red-500", badge: "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400", dot: "bg-red-500" },
  { key: "high", label: "High", icon: ArrowUp, accent: "border-orange-400 dark:border-orange-500", badge: "bg-orange-50 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400", dot: "bg-orange-500" },
  { key: "medium", label: "Medium", icon: Minus, accent: "border-yellow-400 dark:border-yellow-500", badge: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400", dot: "bg-yellow-500" },
  { key: "low", label: "Low", icon: ArrowDown, accent: "border-blue-400 dark:border-blue-500", badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400", dot: "bg-blue-500" },
  { key: "none", label: "우선순위 없음", icon: Minus, accent: "border-gray-300 dark:border-gray-600", badge: "bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400", dot: "bg-gray-400" },
] as const;

export default function PriorityView() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getTasks(), api.getProjects(), api.getColumns()])
      .then(([t, p, c]) => {
        setTasks(t);
        setProjects(p);
        setColumns(c);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));
  const columnMap = Object.fromEntries(columns.map((c) => [c.id, c]));

  const grouped: Record<string, Task[]> = {
    urgent: [], high: [], medium: [], low: [], none: [],
  };
  for (const task of tasks) {
    const key = task.priority || "none";
    grouped[key].push(task);
  }

  const isOverdue = (d: string) => new Date(d) < new Date(new Date().toDateString());

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">우선순위 보기</h1>

      <div className="space-y-6">
        {PRIORITY_SECTIONS.map((section) => {
          const items = grouped[section.key];
          if (items.length === 0) return null;

          const Icon = section.icon;

          return (
            <div key={section.key} className={`border-l-4 ${section.accent} rounded-xl bg-white dark:bg-gray-800/50 shadow-sm overflow-hidden`}>
              <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 dark:border-gray-700/50">
                <Icon className="w-4 h-4" />
                <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{section.label}</h2>
                <span className={`ml-1 px-2 py-0.5 text-xs font-medium rounded-full ${section.badge}`}>{items.length}</span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-700/30">
                {items.map((task) => {
                  const project = projectMap[task.projectId];
                  const column = columnMap[task.columnId];
                  const checkedCount = task.checklistItems?.filter((c) => c.completed).length || 0;
                  const totalChecklist = task.checklistItems?.length || 0;

                  return (
                    <div key={task.id} className="px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-gray-700 dark:text-gray-200">{task.title}</p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                            {project && (
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
                                {project.name}
                              </span>
                            )}
                            {column && (
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[11px]">
                                {column.name}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className={`flex items-center gap-1 ${isOverdue(task.dueDate) ? "text-red-500 font-medium" : ""}`}>
                                <Calendar className="w-3 h-3" />
                                {task.dueDate}
                              </span>
                            )}
                            {totalChecklist > 0 && (
                              <span className={`flex items-center gap-1 ${checkedCount === totalChecklist ? "text-green-500" : ""}`}>
                                <CheckSquare className="w-3 h-3" />
                                {checkedCount}/{totalChecklist}
                              </span>
                            )}
                          </div>
                        </div>
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex gap-1 flex-shrink-0">
                            {task.labels.map((l) => (
                              <span key={l.id} className="px-2 py-0.5 text-[10px] rounded-md text-white font-medium" style={{ backgroundColor: l.color }}>
                                {l.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
