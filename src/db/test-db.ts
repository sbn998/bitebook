// Only used by tests, never by the app. expo-sqlite needs the phone, so tests use Node's own SQLite
// behind an object with the same five methods the db functions call. See SPEC.md, "Automated tests".
import type { SQLiteDatabase } from "expo-sqlite";
import { DatabaseSync } from "node:sqlite";

import { migrateDbIfNeeded } from "@/db/migrations";

type Param = string | number | null;

// An empty database in memory, gone when the test ends.
export function createTestDb() {
  const db = new DatabaseSync(":memory:");
  const testDb = {
    async execAsync(sql: string) {
      db.exec(sql);
    },
    async runAsync(sql: string, ...params: Param[]) {
      const result = db.prepare(sql).run(...params);
      return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) };
    },
    // expo-sqlite gives null when there's no row, Node gives undefined.
    async getFirstAsync(sql: string, ...params: Param[]) {
      return db.prepare(sql).get(...params) ?? null;
    },
    async getAllAsync(sql: string, ...params: Param[]) {
      return db.prepare(sql).all(...params);
    },
    // Like expo-sqlite: if anything inside fails, every change made inside is undone.
    async withTransactionAsync(task: () => Promise<void>) {
      db.exec("BEGIN");
      try {
        await task();
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
    },
  };
  // Only these five methods exist, so TypeScript has to be told to treat it as the real thing.
  return testDb as unknown as SQLiteDatabase;
}

// An in-memory database with every table, built by the app's own migrations.
export async function openTestDb() {
  const db = createTestDb();
  await migrateDbIfNeeded(db);
  return db;
}
