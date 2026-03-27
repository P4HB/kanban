import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db
    .select()
    .from(projects)
    .where(eq(projects.archived, false))
    .orderBy(projects.sortOrder);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = await db.insert(projects).values({
    name: body.name,
    color: body.color || "#6366f1",
    icon: body.icon || null,
  }).returning();
  return NextResponse.json(result[0], { status: 201 });
}
