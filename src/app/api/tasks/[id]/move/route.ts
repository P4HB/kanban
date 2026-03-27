import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { columnId, sortOrder } = await req.json();

  const result = await db
    .update(tasks)
    .set({ columnId, sortOrder, updatedAt: new Date() })
    .where(eq(tasks.id, params.id))
    .returning();

  return NextResponse.json(result[0]);
}
