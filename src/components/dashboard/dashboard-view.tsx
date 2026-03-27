"use client";

import { useState, useEffect } from "react";
import { ListTodo, Clock, AlertTriangle, CalendarDays } from "lucide-react";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">대시보드</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<ListTodo className="w-5 h-5" />} label="전체 태스크" value={stats.totalTasks} color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-950" />
        <StatCard icon={<CalendarDays className="w-5 h-5" />} label="오늘 마감" value={stats.todayDue} color="text-blue-500" bg="bg-blue-50 dark:bg-blue-950" />
        <StatCard icon={<Clock className="w-5 h-5" />} label="이번 주 마감" value={stats.weekDue} color="text-amber-500" bg="bg-amber-50 dark:bg-amber-950" />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="지연됨" value={stats.overdue} color="text-red-500" bg="bg-red-50 dark:bg-red-950" />
      </div>

      {/* Column distribution */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">컬럼별 분포</h3>
        <div className="space-y-3">
          {stats.byColumn.map((col) => (
            <div key={col.slug} className="flex items-center gap-3">
              <div className="w-24 text-sm text-gray-600 dark:text-gray-400">{col.name}</div>
              <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${stats.totalTasks > 0 ? (col.count / stats.totalTasks) * 100 : 0}%`,
                    backgroundColor: col.color || "#94a3b8",
                    minWidth: col.count > 0 ? "24px" : "0",
                  }}
                />
              </div>
              <span className="text-sm font-medium text-gray-500 w-8 text-right">{col.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Project progress */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
        <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">프로젝트별 진행률</h3>
        {stats.byProject.length === 0 ? (
          <p className="text-sm text-gray-400">프로젝트가 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {stats.byProject.map((proj) => {
              const pct = proj.total > 0 ? Math.round((proj.done / proj.total) * 100) : 0;
              return (
                <div key={proj.id}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: proj.color }} />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{proj.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{proj.done}/{proj.total} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: proj.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }: { icon: React.ReactNode; label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 border border-gray-200 dark:border-gray-800`}>
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold text-gray-800 dark:text-gray-200">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}
