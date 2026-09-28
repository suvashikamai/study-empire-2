// Database access layer using Node's built-in `node:sqlite` (stable enough
// for this MVP as of Node 22; flagged experimental upstream — see
// docs/architecture.md for the Postgres migration path at real scale).
//
// No external binary download is required (unlike better-sqlite3's
// prebuilt-binary fetch or Prisma's engine download), which matters in
// network-restricted environments. Everything here is synchronous, which is
// fine for a single-process Next.js dev/small-prod deployment; a move to
// Postgres for multi-instance cloud scale would replace this file's
// internals without touching repo call sites much.

import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = process.env.DATABASE_URL?.replace(/^file:/, "") ?? "./dev.db";

function resolveDbPath(): string {
  const resolved = path.isAbsolute(DB_PATH) ? DB_PATH : path.join(process.cwd(), DB_PATH);
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return resolved;
}

declare global {
  // eslint-disable-next-line no-var
  var __studyEmpireDb: DatabaseSync | undefined;
}

function createConnection(): DatabaseSync {
  const db = new DatabaseSync(resolveDbPath());
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA journal_mode = WAL;");
  return db;
}

// Reuse a single connection across hot-reloads in dev (Next.js reloads
// modules but not the Node process).
export const db: DatabaseSync = globalThis.__studyEmpireDb ?? createConnection();
if (process.env.NODE_ENV !== "production") {
  globalThis.__studyEmpireDb = db;
}

/** Run `fn` inside a SQLite transaction, rolling back on throw. */
export function transaction<T>(fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}
