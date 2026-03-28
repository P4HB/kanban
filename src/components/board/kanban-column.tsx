"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Column, Task } from "@/lib/types";
import TaskCard from "./task-card";

interface Props {
  column: Column;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function KanbanColumn({ column, tasks, onTaskClick }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  return (
    <div className="flex-shrink-0 w-72">
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: column.color || "#94a3b8" }} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{column.name}</h3>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full">{tasks.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`space-y-2 min-h-[200px] p-2 rounded-lg transition-colors ${
          isOver ? "bg-indigo-50 dark:bg-indigo-950/30" : "bg-gray-100/50 dark:bg-gray-800/30"
        }`}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
