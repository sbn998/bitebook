import type { SQLiteDatabase } from "expo-sqlite";

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
