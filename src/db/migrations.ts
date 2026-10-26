import type { SQLiteDatabase } from "expo-sqlite";

// Also used to refuse backup files made by a newer version of the app.
export const DATABASE_VERSION = 4;

// Runs every time the app opens the database, before any screen is shown.
export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  // Foreign key rules are off by default and must be enabled on every open.
  await db.execAsync("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");

  const result = await db.getFirstAsync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const currentDbVersion = result?.user_version ?? 0;
  if (currentDbVersion >= DATABASE_VERSION) {
    return;
  }

  // Migration 1: create all tables. See DATABASE.md.
  if (currentDbVersion === 0) {
    await db.execAsync(`
      CREATE TABLE foods (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT,
        type TEXT NOT NULL,
        reference_amount REAL NOT NULL,
        unit TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL
      );

      CREATE TABLE meals (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE COLLATE NOCASE
      );

      CREATE TABLE goals (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL
      );

      CREATE TABLE weekday_goals (
        weekday INTEGER PRIMARY KEY,
        goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE
      );

      CREATE TABLE days (
        date TEXT PRIMARY KEY,
        goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
        goal_name TEXT,
        goal_calories REAL,
        goal_protein REAL,
        goal_carbs REAL,
        goal_fat REAL
      );

      CREATE TABLE meal_entries (
        id INTEGER PRIMARY KEY,
        date TEXT NOT NULL REFERENCES days(date),
        meal_id INTEGER REFERENCES meals(id) ON DELETE SET NULL,
        meal_name TEXT NOT NULL
      );

      CREATE TABLE food_entries (
        id INTEGER PRIMARY KEY,
        meal_entry_id INTEGER NOT NULL REFERENCES meal_entries(id) ON DELETE CASCADE,
        food_id INTEGER REFERENCES foods(id) ON DELETE SET NULL,
        quantity REAL NOT NULL,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        reference_amount REAL NOT NULL,
        calories REAL NOT NULL,
        protein REAL NOT NULL,
        carbs REAL NOT NULL,
        fat REAL NOT NULL
      );

      CREATE INDEX meal_entries_date ON meal_entries(date);
      CREATE INDEX food_entries_meal_entry_id ON food_entries(meal_entry_id);
    `);
  }

  // Migration 2: make goal macro targets optional (empty = no target).
  // SQLite can't remove NOT NULL from a column, so the goals table is rebuilt:
  // create the new version, copy the rows over, then swap it in. Foreign keys are
  // switched off meanwhile so dropping the old table doesn't touch weekday_goals or days.
  if (currentDbVersion < 2) {
    await db.execAsync(`
      PRAGMA foreign_keys = OFF;
      BEGIN;

      CREATE TABLE goals_new (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        calories REAL NOT NULL,
        protein REAL,
        carbs REAL,
        fat REAL
      );
      INSERT INTO goals_new (id, name, calories, protein, carbs, fat)
        SELECT id, name, calories, protein, carbs, fat FROM goals;
      DROP TABLE goals;
      ALTER TABLE goals_new RENAME TO goals;

      COMMIT;
      PRAGMA foreign_keys = ON;
    `);
  }

  // Migration 3: foods can remember the barcode they were scanned from (empty = none).
  // SQLite can't add a UNIQUE column, so a unique index does it: no two foods share a barcode,
  // but any number of foods can have none.
  if (currentDbVersion < 3) {
    await db.execAsync(`
      ALTER TABLE foods ADD COLUMN barcode TEXT;
      CREATE UNIQUE INDEX foods_barcode ON foods(barcode);
    `);
  }

  // Migration 4: the same product can be saved more than once (e.g. per 100 g and per serving),
  // so barcodes no longer have to be unique. A plain index still makes finding foods by barcode fast.
  if (currentDbVersion < 4) {
    await db.execAsync(`
      DROP INDEX foods_barcode;
      CREATE INDEX foods_barcode ON foods(barcode);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
