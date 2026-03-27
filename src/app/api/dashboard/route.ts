import { NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, projects, columns } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const today = new Date().toISOString().split("T")[0];
  const weekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const allTasks = await db.select().from(tasks);
  const allColumns = await db.select().from(columns).orderBy(columns.sortOrder);
  const allProjects = await db.select().from(projects).where(eq(projects.archived, false));

  const doneColumn = allColumns.find((c) => c.slug === "done");

  const totalTasks = allTasks.length;
  const todayDue = allTasks.filter((t) => t.dueDate === today).length;
  const weekDue = allTasks.filter((t) => t.dueDate && t.dueDate >= today && t.dueDate <= weekEnd).length;
  const overdue = allTasks.filter(
    (t) => t.dueDate && t.dueDate < today && (!doneColumn || t.columnId !== doneColumn.id)
  ).length;

  const byColumn = allColumns.map((col) => ({
    name: col.name,
    slug: col.slug,
    count: allTasks.filter((t) => t.columnId === col.id).length,
    color: col.color,
  }));

  const byProject = allProjects.map((proj) => {
    const projTasks = allTasks.filter((t) => t.projectId === proj.id);
    return {
      id: proj.id,
      name: proj.name,
      color: proj.color,
      total: projTasks.length,
      done: doneColumn ? projTasks.filter((t) => t.columnId === doneColumn.id).length : 0,
    };
  });

  return NextResponse.json({ totalTasks, todayDue, weekDue, overdue, byColumn, byProject });
}
