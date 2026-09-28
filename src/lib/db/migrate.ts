// Applies schema.sql to the configured SQLite database. Idempotent (every
// statement is CREATE TABLE/INDEX IF NOT EXISTS), so it's safe to run on
// every `npm run dev` / `npm run build` via the predev/prebuild hooks.
import fs from "node:fs";
import path from "node:path";
import { db } from "./client";

function main() {
  const schemaPath = path.join(process.cwd(), "src/lib/db/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  db.exec(sql);
  console.log(`[db:migrate] schema applied to ${process.env.DATABASE_URL ?? "./dev.db"}`);
}

main();
