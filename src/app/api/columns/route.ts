import { NextResponse } from "next/server";
import { db } from "@/db";
import { columns } from "@/db/schema";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await db.select().from(columns).orderBy(columns.sortOrder);
  return NextResponse.json(result);
}
