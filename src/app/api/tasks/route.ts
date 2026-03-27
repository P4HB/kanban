import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, taskLabels, labels, checklistItems } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query;

  if (from && to) {
    // Calendar mode
    query = await db
      .select()
      .from(tasks)
      .where(and(gte(tasks.dueDate, from), lte(tasks.dueDate, to)));
  } else if (projectId) {
    query = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(tasks.sortOrder);
  } else {
    query = await db.select().from(tasks).orderBy(tasks.sortOrder);
  }

  // Fetch labels and checklist items for each task
  const tasksWithRelations = await Promise.all(
    query.map(async (task) => {
      const tl = await db
        .select({ id: labels.id, name: labels.name, color: labels.color })
        .from(taskLabels)
        .innerJoin(labels, eq(taskLabels.labelId, labels.id))
        .where(eq(taskLabels.taskId, task.id));

      const cl = await db
        .select()
        .from(checklistItems)
        .where(eq(checklistItems.taskId, task.id))
        .orderBy(checklistItems.sortOrder);

      return { ...task, labels: tl, checklistItems: cl };
    })
  );

  return NextResponse.json(tasksWithRelations);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const maxSort = await db
    .select({ sortOrder: tasks.sortOrder })
    .from(tasks)
    .where(eq(tasks.columnId, body.columnId))
    .orderBy(tasks.sortOrder);

  const nextSort = maxSort.length > 0 ? maxSort[maxSort.length - 1].sortOrder + 1 : 0;

  const result = await db
    .insert(tasks)
    .values({
      title: body.title,
      description: body.description || null,
      projectId: body.projectId,
      columnId: body.columnId,
      priority: body.priority || null,
      dueDate: body.dueDate || null,
      sortOrder: nextSort,
    })
    .returning();

  if (body.labelIds?.length) {
    for (const labelId of body.labelIds) {
      await db.insert(taskLabels).values({ taskId: result[0].id, labelId });
    }
  }

  return NextResponse.json(result[0], { status: 201 });
}
