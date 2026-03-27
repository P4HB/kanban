"use client";

import { useState } from "react";
import { X, Trash2, Plus, CheckSquare, Square } from "lucide-react";
import type { Task, Label, Column } from "@/lib/types";
import { api } from "@/lib/api";
import { useStore } from "@/store/use-store";

interface Props {
  task: Task | null;
  columns: Column[];
  labels: Label[];
  projectId: string;
  onClose: () => void;
  onSaved: () => void;
}

const PRIORITIES = [
  { value: "", label: "없음" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "low", label: "Low", color: "bg-blue-400" },
];

export default function TaskModal({ task, columns, labels, projectId, onClose, onSaved }: Props) {
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [columnId, setColumnId] = useState(task?.columnId || columns[0]?.id || "");
  const [priority, setPriority] = useState(task?.priority || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>(task?.labels?.map((l) => l.id) || []);
  const [checklist, setChecklist] = useState<{ content: string; completed: boolean }[]>(
    task?.checklistItems?.map((c) => ({ content: c.content, completed: c.completed })) || []
  );
  const [newCheckItem, setNewCheckItem] = useState("");
  const [saving, setSaving] = useState(false);

  const isNew = !task;

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      if (isNew) {
        const created = await api.createTask({
          title: title.trim(),
          description: description || null,
          projectId,
          columnId,
          priority: (priority || null) as Task["priority"],
          dueDate: dueDate || null,
          labelIds: selectedLabelIds,
        });
        useStore.getState().addTask(created);
      } else {
        const updated = await api.updateTask(task.id, {
          title: title.trim(),
          description: description || null,
          columnId,
          priority: (priority || null) as Task["priority"],
          dueDate: dueDate || null,
          labelIds: selectedLabelIds,
          checklistItems: checklist as Task["checklistItems"],
        });
        useStore.getState().updateTask(task.id, updated);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task || !confirm("이 태스크를 삭제하시겠습니까?")) return;
    await api.deleteTask(task.id);
    useStore.getState().removeTask(task.id);
    onSaved();
    onClose();
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist([...checklist, { content: newCheckItem.trim(), completed: false }]);
    setNewCheckItem("");
  };

  const toggleLabel = (id: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            {isNew ? "새 태스크" : "태스크 수정"}
          </h2>
          <div className="flex items-center gap-2">
            {!isNew && (
              <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">제목 *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">상태</label>
              <select
                value={columnId}
                onChange={(e) => setColumnId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                {columns.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">우선순위</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">마감일</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
            />
          </div>

          {labels.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">라벨</label>
              <div className="flex flex-wrap gap-2">
                {labels.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => toggleLabel(l.id)}
                    className={`px-2 py-1 text-xs rounded-full border-2 transition-colors ${
                      selectedLabelIds.includes(l.id)
                        ? "border-current text-white"
                        : "border-transparent text-white opacity-50 hover:opacity-75"
                    }`}
                    style={{ backgroundColor: l.color }}
                  >
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isNew && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">체크리스트</label>
              <div className="space-y-1">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const updated = [...checklist];
                        updated[i].completed = !updated[i].completed;
                        setChecklist(updated);
                      }}
                      className="text-gray-400 hover:text-indigo-500"
                    >
                      {item.completed ? <CheckSquare className="w-4 h-4 text-green-500" /> : <Square className="w-4 h-4" />}
                    </button>
                    <span className={`text-sm ${item.completed ? "line-through text-gray-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {item.content}
                    </span>
                    <button
                      onClick={() => setChecklist(checklist.filter((_, j) => j !== i))}
                      className="ml-auto text-gray-300 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  value={newCheckItem}
                  onChange={(e) => setNewCheckItem(e.target.value)}
                  placeholder="항목 추가..."
                  className="flex-1 px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
                />
                <button onClick={addCheckItem} className="p-1 text-gray-400 hover:text-indigo-500">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 rounded-lg">
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
          >
            {saving ? "저장 중..." : isNew ? "생성" : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
