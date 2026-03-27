import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { columns } from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DEFAULT_COLUMNS = [
  { name: "Backlog", slug: "backlog", sortOrder: 0, color: "#94a3b8" },
  { name: "Todo", slug: "todo", sortOrder: 1, color: "#3b82f6" },
  { name: "In Progress", slug: "in_progress", sortOrder: 2, color: "#f59e0b" },
  { name: "On Hold", slug: "on_hold", sortOrder: 3, color: "#ef4444" },
  { name: "Review", slug: "review", sortOrder: 4, color: "#8b5cf6" },
  { name: "Done", slug: "done", sortOrder: 5, color: "#22c55e" },
];

async function seed() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("Seeding columns...");
  for (const col of DEFAULT_COLUMNS) {
    await db.insert(columns).values(col).onConflictDoNothing();
  }
  console.log("Done!");
}

seed().catch(console.error);
