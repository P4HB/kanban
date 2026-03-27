"use client";

import { useState, useEffect, useCallback } from "react";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, closestCorners } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { useStore } from "@/store/use-store";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";
import KanbanColumn from "./kanban-column";
import TaskModal from "./task-modal";

interface Props {
  projectId: string;
}

export default function KanbanBoard({ projectId }: Props) {
  const { columns, tasks, setColumns, setTasks, labels, setLabels } = useStore();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [loading, setLoading] = useState(true);
  const project = useStore((s) => s.projects.find((p) => p.id === projectId));

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cols, tks, lbls] = await Promise.all([
        api.getColumns(),
        api.getTasks(projectId),
        api.getLabels(),
      ]);
      setColumns(cols);
      setTasks(tks);
      setLabels(lbls);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId, setColumns, setTasks, setLabels]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    let targetColumnId: string;
    let targetSortOrder: number;

    const overData = over.data.current;

    if (overData?.type === "column") {
      targetColumnId = over.id as string;
      const colTasks = tasks.filter((t) => t.columnId === targetColumnId && t.id !== taskId);
      targetSortOrder = colTasks.length;
    } else if (overData?.type === "task") {
      const overTask = overData.task as Task;
      targetColumnId = overTask.columnId;
      targetSortOrder = overTask.sortOrder;
    } else {
      targetColumnId = over.id as string;
      const colTasks = tasks.filter((t) => t.columnId === targetColumnId && t.id !== taskId);
      targetSortOrder = colTasks.length;
    }

    // Optimistic update
    useStore.getState().moveTask(taskId, targetColumnId, targetSortOrder);

    try {
      await api.moveTask(taskId, targetColumnId, targetSortOrder);
    } catch (err) {
      console.error(err);
      loadData(); // Revert on error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {project && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: project.color }} />}
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{project?.name || "보드"}</h2>
        </div>
        <button
          onClick={() => setShowNewTask(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          새 태스크
        </button>
      </div>

      <div className="flex-1 overflow-x-auto px-4 pb-4">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 h-full">
            {columns.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                tasks={tasks.filter((t) => t.columnId === col.id).sort((a, b) => a.sortOrder - b.sortOrder)}
                onTaskClick={setSelectedTask}
                projectColor={project?.color}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {(selectedTask || showNewTask) && (
        <TaskModal
          task={showNewTask ? null : selectedTask}
          columns={columns}
          labels={labels}
          projectId={projectId}
          onClose={() => { setSelectedTask(null); setShowNewTask(false); }}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
