import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks, taskLabels, checklistItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { labelIds, checklistItems: clItems, ...taskData } = body;

  const result = await db
    .update(tasks)
    .set({ ...taskData, updatedAt: new Date() })
    .where(eq(tasks.id, params.id))
    .returning();

  if (labelIds !== undefined) {
    await db.delete(taskLabels).where(eq(taskLabels.taskId, params.id));
    for (const labelId of labelIds) {
      await db.insert(taskLabels).values({ taskId: params.id, labelId });
    }
  }

  if (clItems !== undefined) {
    await db.delete(checklistItems).where(eq(checklistItems.taskId, params.id));
    for (let i = 0; i < clItems.length; i++) {
      await db.insert(checklistItems).values({
        taskId: params.id,
        content: clItems[i].content,
        completed: clItems[i].completed || false,
        sortOrder: i,
      });
    }
  }

  return NextResponse.json(result[0]);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.delete(tasks).where(eq(tasks.id, params.id));
  return NextResponse.json({ ok: true });
}
