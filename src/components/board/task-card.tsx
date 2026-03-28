"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, CheckSquare, AlertTriangle, ArrowUp, ArrowDown, Minus } from "lucide-react";
import type { Task } from "@/lib/types";

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string; icon: typeof AlertTriangle }> = {
  urgent: { label: "Urgent", bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400", icon: AlertTriangle },
  high: { label: "High", bg: "bg-orange-50 dark:bg-orange-950/40", text: "text-orange-600 dark:text-orange-400", icon: ArrowUp },
  medium: { label: "Medium", bg: "bg-yellow-50 dark:bg-yellow-950/40", text: "text-yellow-600 dark:text-yellow-400", icon: Minus },
  low: { label: "Low", bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-600 dark:text-blue-400", icon: ArrowDown },
};

interface Props {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const checkedCount = task.checklistItems?.filter((c) => c.completed).length || 0;
  const totalChecklist = task.checklistItems?.length || 0;
  const priority = task.priority ? PRIORITY_CONFIG[task.priority] : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700/50 p-3.5 cursor-pointer hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-600/50 transition-all duration-200 group ${
        isDragging ? "opacity-50 shadow-xl scale-[1.02]" : "shadow-sm"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 opacity-0 group-hover:opacity-100 text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing transition-opacity">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          {priority && (
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold mb-2 ${priority.bg} ${priority.text}`}>
              <priority.icon className="w-3 h-3" />
              {priority.label}
            </div>
          )}
          <p className="text-[13px] font-medium text-gray-700 dark:text-gray-200 leading-snug">{task.title}</p>
          {task.labels && task.labels.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2.5">
              {task.labels.map((l) => (
                <span key={l.id} className="px-2 py-0.5 text-[10px] rounded-md text-white font-medium" style={{ backgroundColor: l.color }}>
                  {l.name}
                </span>
              ))}
            </div>
          )}
          {(task.dueDate || totalChecklist > 0) && (
            <div className="flex items-center gap-3 mt-2.5 text-xs text-gray-400 dark:text-gray-500">
              {task.dueDate && (
                <span className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date(new Date().toDateString()) ? "text-red-500 font-medium" : ""}`}>
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
          )}
        </div>
      </div>
    </div>
  );
}
