"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Calendar, CheckSquare } from "lucide-react";
import type { Task } from "@/lib/types";

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-blue-400",
};

interface Props {
  task: Task;
  onClick: () => void;
  projectColor?: string;
}

export default function TaskCard({ task, onClick, projectColor }: Props) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group ${
        isDragging ? "opacity-50 shadow-lg" : "shadow-sm"
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-2">
        <button {...attributes} {...listeners} className="mt-0.5 opacity-0 group-hover:opacity-100 text-gray-400 cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {task.priority && (
              <div className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[task.priority]}`} />
            )}
            {projectColor && (
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: projectColor }} />
            )}
          </div>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
          <div className="flex items-center gap-3 mt-2">
            {task.labels && task.labels.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {task.labels.map((l) => (
                  <span key={l.id} className="px-1.5 py-0.5 text-[10px] rounded-full text-white font-medium" style={{ backgroundColor: l.color }}>
                    {l.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date(new Date().toDateString()) ? "text-red-500" : ""}`}>
                <Calendar className="w-3 h-3" />
                {task.dueDate}
              </span>
            )}
            {totalChecklist > 0 && (
              <span className="flex items-center gap-1">
                <CheckSquare className="w-3 h-3" />
                {checkedCount}/{totalChecklist}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
