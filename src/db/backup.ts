import type { SQLiteDatabase } from "expo-sqlite";

import { DATABASE_VERSION } from "@/db/migrations";

// The layout of the backup file itself. Raise it if the file's structure changes.
export const BACKUP_FORMAT = 1;

// Every table, parents first: a row only links to tables listed before it,
// so importing in this order never points at a row that isn't there yet.
export const BACKUP_TABLES = [
  "foods",
  "meals",
  "goals",
  "weekday_goals",
  "days",
  "meal_entries",
  "food_entries",
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];

// What an exported file contains. `app` marks it as ours; `databaseVersion` is the migration
// version it was made with, so a newer app version can still read older files.
export type Backup = {
  app: "macro-tracker";
  format: number;
  databaseVersion: number;
  exportedAt: string;
  data: Record<BackupTable, Record<string, unknown>[]>;
};

// Reads every row of every table, keeping their ids so the links between them still work after importing.
export async function createBackup(db: SQLiteDatabase): Promise<Backup> {
  const version = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const data = {} as Backup["data"];
  for (const table of BACKUP_TABLES) {
    // The table names come from the fixed list above, never from user input.
    data[table] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table} ORDER BY rowid`);
  }
  return {
    app: "macro-tracker",
    format: BACKUP_FORMAT,
    databaseVersion: version?.user_version ?? 0,
    exportedAt: new Date().toISOString(),
    data,
  };
}

// Why a file can't be imported: "invalid" = not a Macro Tracker backup (or damaged),
// "newer" = made by a newer version of the app than this one.
export class BackupError extends Error {
  reason: "invalid" | "newer";

  constructor(reason: "invalid" | "newer") {
    super(`Backup file is ${reason}`);
    this.reason = reason;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Checks a picked file's text before anything is changed, and returns it as a Backup.
// A file is treated as untrusted input: anything unexpected throws a BackupError.
export function parseBackup(text: string): Backup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError("invalid");
  }
  if (!isRecord(parsed) || parsed.app !== "macro-tracker") throw new BackupError("invalid");
  if (typeof parsed.format !== "number" || typeof parsed.databaseVersion !== "number") {
    throw new BackupError("invalid");
  }
  if (parsed.format > BACKUP_FORMAT || parsed.databaseVersion > DATABASE_VERSION) throw new BackupError("newer");

  const data = parsed.data;
  if (!isRecord(data)) throw new BackupError("invalid");
  for (const table of BACKUP_TABLES) {
    const rows = data[table];
    if (!Array.isArray(rows) || !rows.every(isRecord)) throw new BackupError("invalid");
    // Only plain values can be stored; nested objects or lists mean the file isn't ours.
    const plain = (value: unknown) =>
      value === null || typeof value === "string" || (typeof value === "number" && Number.isFinite(value));
    if (!rows.every((row) => Object.values(row).every(plain))) throw new BackupError("invalid");
  }
  return parsed as Backup;
}

// How many foods, meal labels, goals and days there are, for the "Replace all your data?" summary.
export type BackupCounts = { foods: number; meals: number; goals: number; days: number };

export function countBackup(backup: Backup): BackupCounts {
  const { foods, meals, goals, days } = backup.data;
  return { foods: foods.length, meals: meals.length, goals: goals.length, days: days.length };
}

export async function countCurrentData(db: SQLiteDatabase): Promise<BackupCounts> {
  const count = async (table: BackupTable) =>
    (await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) AS count FROM ${table}`))?.count ?? 0;
  return { foods: await count("foods"), meals: await count("meals"), goals: await count("goals"), days: await count("days") };
}

// Replaces all data with the backup's, keeping its ids so every link still works. All in one transaction:
// if any row fails (a missing required value, a link to a row that doesn't exist), nothing is changed.
export async function restoreBackup(db: SQLiteDatabase, backup: Backup) {
  await db.withTransactionAsync(async () => {
    // Children first, so nothing is left pointing at a deleted row.
    for (const table of [...BACKUP_TABLES].reverse()) {
      await db.runAsync(`DELETE FROM ${table}`);
    }
    // Parents first, so every link points at a row that's already there.
    for (const table of BACKUP_TABLES) {
      // Only this table's real columns are used: a column name from the file never reaches the SQL.
      const columns = (await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)).map((c) => c.name);
      const placeholders = columns.map(() => "?").join(", ");
      const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
      for (const row of backup.data[table]) {
        const values = columns.map((column) => (row[column] ?? null) as string | number | null);
        await db.runAsync(sql, ...values);
      }
    }
  });
}
