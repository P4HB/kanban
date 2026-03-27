"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, addMonths, subMonths, isSameDay, parseISO, addWeeks, subWeeks, startOfWeek as sow, endOfWeek as eow } from "date-fns";
import { ko } from "date-fns/locale";
import { api } from "@/lib/api";
import { useStore } from "@/store/use-store";
import type { Task } from "@/lib/types";

type ViewMode = "month" | "week";

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const projects = useStore((s) => s.projects);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    let from: string, to: string;
    if (viewMode === "month") {
      const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
      const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
      from = format(start, "yyyy-MM-dd");
      to = format(end, "yyyy-MM-dd");
    } else {
      const start = sow(currentDate, { weekStartsOn: 0 });
      const end = eow(currentDate, { weekStartsOn: 0 });
      from = format(start, "yyyy-MM-dd");
      to = format(end, "yyyy-MM-dd");
    }
    try {
      const result = await api.getCalendarTasks(from, to);
      setTasks(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    if (projects.length === 0) {
      api.getProjects().then(useStore.getState().setProjects).catch(console.error);
    }
  }, [projects.length]);

  const navigate = (dir: number) => {
    if (viewMode === "month") {
      setCurrentDate(dir > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else {
      setCurrentDate(dir > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    }
  };

  const getProjectColor = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.color || "#6366f1";
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }

    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
        {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
          <div key={d} className="bg-gray-50 dark:bg-gray-800 p-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
            {d}
          </div>
        ))}
        {days.map((d, i) => {
          const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), d));
          const today = isToday(d);
          const sameMonth = isSameMonth(d, currentDate);
          const overdue = d < new Date(new Date().toDateString());

          return (
            <div
              key={i}
              className={`bg-white dark:bg-gray-900 p-2 min-h-[100px] ${!sameMonth ? "opacity-40" : ""}`}
            >
              <div className={`text-sm mb-1 ${today ? "w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold" : "text-gray-600 dark:text-gray-400"}`}>
                {format(d, "d")}
              </div>
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className={`text-[11px] px-1.5 py-0.5 rounded truncate text-white font-medium ${overdue && sameMonth ? "opacity-70" : ""}`}
                    style={{ backgroundColor: getProjectColor(t.projectId) }}
                    title={t.title}
                  >
                    {t.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-[10px] text-gray-400 pl-1">+{dayTasks.length - 3}개</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = sow(currentDate, { weekStartsOn: 0 });
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) days.push(addDays(weekStart, i));

    return (
      <div className="grid grid-cols-7 gap-3">
        {days.map((d, i) => {
          const dayTasks = tasks.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), d));
          const today = isToday(d);
          return (
            <div key={i} className={`rounded-lg border p-3 min-h-[300px] ${today ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20" : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"}`}>
              <div className="text-center mb-3">
                <div className="text-xs text-gray-400">{format(d, "EEE", { locale: ko })}</div>
                <div className={`text-lg font-bold ${today ? "text-indigo-500" : "text-gray-700 dark:text-gray-300"}`}>
                  {format(d, "d")}
                </div>
              </div>
              <div className="space-y-2">
                {dayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="text-xs p-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: getProjectColor(t.projectId) }}
                  >
                    {t.title}
                    {t.priority && (
                      <span className="ml-1 opacity-75">({t.priority})</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {viewMode === "month"
              ? format(currentDate, "yyyy년 M월", { locale: ko })
              : `${format(sow(currentDate, { weekStartsOn: 0 }), "M/d")} - ${format(eow(currentDate, { weekStartsOn: 0 }), "M/d")}`}
          </h2>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-xs font-medium text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg"
            >
              오늘
            </button>
            <button onClick={() => navigate(1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === "month" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm" : "text-gray-500"}`}
          >
            월간
          </button>
          <button
            onClick={() => setViewMode("week")}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${viewMode === "week" ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-sm" : "text-gray-500"}`}
          >
            주간
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : viewMode === "month" ? renderMonthView() : renderWeekView()}
    </div>
  );
}
