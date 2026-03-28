"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Kanban, Calendar, Plus, Trash2, AlertTriangle } from "lucide-react";
import { useStore } from "@/store/use-store";
import { api } from "@/lib/api";

const COLORS = ["#6366f1", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6"];

export default function Sidebar() {
  const pathname = usePathname();
  const { projects, setProjects } = useStore();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);

  useEffect(() => {
    api.getProjects().then(setProjects).catch(console.error);
  }, [setProjects]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const proj = await api.createProject({ name: newName.trim(), color: newColor });
    useStore.getState().addProject(proj);
    setNewName("");
    setShowAdd(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("이 프로젝트를 삭제하시겠습니까?")) return;
    await api.deleteProject(id);
    useStore.getState().removeProject(id);
  };

  return (
    <aside className="w-64 h-screen bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col flex-shrink-0">
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Kanban className="w-5 h-5" />
          프로젝트 매니저
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <Link
          href="/"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          대시보드
        </Link>

        <Link
          href="/calendar"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/calendar" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <Calendar className="w-4 h-4" />
          캘린더
        </Link>

        <Link
          href="/priority"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === "/priority" ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          우선순위
        </Link>

        <div className="pt-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">프로젝트</span>
            <button onClick={() => setShowAdd(!showAdd)} className="text-gray-400 hover:text-indigo-500 transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showAdd && (
            <div className="mx-2 mb-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="프로젝트 이름"
                className="w-full px-2 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                autoFocus
              />
              <div className="flex gap-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={`w-5 h-5 rounded-full border-2 ${newColor === c ? "border-gray-800 dark:border-white" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="px-3 py-1 text-xs bg-indigo-500 text-white rounded hover:bg-indigo-600">추가</button>
                <button onClick={() => setShowAdd(false)} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700">취소</button>
              </div>
            </div>
          )}

          {projects.map((proj) => (
            <Link
              key={proj.id}
              href={`/board/${proj.id}`}
              className={`group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                pathname === `/board/${proj.id}` ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: proj.color }} />
              <span className="truncate flex-1">{proj.name}</span>
              <button
                onClick={(e) => handleDelete(proj.id, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
}
