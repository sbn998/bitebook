import { DATABASE_VERSION, migrateDbIfNeeded } from "@/db/migrations";
import { createTestDb, openTestDb } from "@/db/test-db";

async function userVersion(db: Awaited<ReturnType<typeof openTestDb>>) {
  return (await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version"))?.user_version;
}

describe("a new install", () => {
  test("gets every table and the latest version", async () => {
    const db = await openTestDb();
    const tables = await db.getAllAsync<{ name: string }>(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
    );
    expect(tables.map((table) => table.name)).toEqual([
      "days",
      "food_entries",
      "foods",
      "goals",
      "meal_entries",
      "meals",
      "weekday_goals",
    ]);
    expect(await userVersion(db)).toBe(DATABASE_VERSION);
  });

  test("has foreign keys switched on", async () => {
    const db = await openTestDb();
    expect(await db.getFirstAsync("PRAGMA foreign_keys")).toEqual({ foreign_keys: 1 });
  });

  test("allows goals without macro targets", async () => {
    const db = await openTestDb();
    await db.runAsync("INSERT INTO goals (name, calories) VALUES (?, ?)", "Calories only", 2000);
    expect(await db.getFirstAsync("SELECT protein, carbs, fat FROM goals")).toEqual({
      protein: null,
      carbs: null,
      fat: null,
    });
  });
});

// The foods table the way versions 1 and 2 created it (no barcode), with one food in it.
const FOODS_BEFORE_VERSION_3 = `
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
  INSERT INTO foods VALUES (1, 'Chicken breast', NULL, 'poultry', 100, 'g', 165, 31, 0, 3.6);
`;

describe("an upgrade from version 1", () => {
  // The tables migration 2 deals with, the way version 1 created them (macros were required),
  // with a goal used by Monday and by one day, plus the foods table that migration 3 changes.
  async function openVersion1Db() {
    const db = createTestDb();
    await db.execAsync(`
      PRAGMA foreign_keys = ON;
      ${FOODS_BEFORE_VERSION_3}
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
      INSERT INTO goals VALUES (1, 'Cut', 1800, 150, 180, 50);
      INSERT INTO weekday_goals VALUES (1, 1);
      INSERT INTO days VALUES ('2026-10-26', 1, 'Cut', 1800, 150, 180, 50);
      PRAGMA user_version = 1;
    `);
    return db;
  }

  test("keeps the goals and gets the latest version", async () => {
    const db = await openVersion1Db();
    await migrateDbIfNeeded(db);
    expect(await db.getAllAsync("SELECT * FROM goals")).toEqual([
      { id: 1, name: "Cut", calories: 1800, protein: 150, carbs: 180, fat: 50 },
    ]);
    expect(await userVersion(db)).toBe(DATABASE_VERSION);
  });

  test("makes macro targets optional", async () => {
    const db = await openVersion1Db();
    await migrateDbIfNeeded(db);
    await db.runAsync("INSERT INTO goals (name, calories) VALUES (?, ?)", "Calories only", 2000);
    expect(await db.getFirstAsync("SELECT protein FROM goals WHERE name = ?", "Calories only")).toEqual({
      protein: null,
    });
  });

  test("keeps weekdays and days linked to the rebuilt goals table", async () => {
    const db = await openVersion1Db();
    await migrateDbIfNeeded(db);
    expect(await db.getAllAsync("SELECT * FROM weekday_goals")).toEqual([{ weekday: 1, goal_id: 1 }]);

    // If the links still work, deleting the goal removes Monday's goal and clears the day's link.
    await db.runAsync("DELETE FROM goals WHERE id = ?", 1);
    expect(await db.getAllAsync("SELECT * FROM weekday_goals")).toEqual([]);
    expect(await db.getFirstAsync("SELECT goal_id, goal_name FROM days")).toEqual({ goal_id: null, goal_name: "Cut" });
  });
});

describe("an upgrade from version 2", () => {
  async function openVersion2Db() {
    const db = createTestDb();
    await db.execAsync(`${FOODS_BEFORE_VERSION_3} PRAGMA user_version = 2;`);
    return db;
  }

  test("keeps the foods, without a barcode", async () => {
    const db = await openVersion2Db();
    await migrateDbIfNeeded(db);
    expect(await db.getAllAsync("SELECT name, calories, barcode FROM foods")).toEqual([
      { name: "Chicken breast", calories: 165, barcode: null },
    ]);
    expect(await userVersion(db)).toBe(DATABASE_VERSION);
  });

  test("lets foods have a barcode, but never the same one twice", async () => {
    const db = await openVersion2Db();
    await migrateDbIfNeeded(db);
    await db.runAsync("UPDATE foods SET barcode = ? WHERE id = 1", "8480000123456");
    const sameBarcode = db.runAsync(
      "INSERT INTO foods (name, type, reference_amount, unit, calories, protein, carbs, fat, barcode) VALUES ('Copy', 'poultry', 100, 'g', 1, 0, 0, 0, ?)",
      "8480000123456"
    );
    await expect(sameBarcode).rejects.toThrow("UNIQUE");
  });
});

describe("opening the app again", () => {
  test("doesn't change anything", async () => {
    const db = await openTestDb();
    await db.runAsync("INSERT INTO meals (name) VALUES (?)", "Breakfast");
    await migrateDbIfNeeded(db);
    expect(await db.getAllAsync("SELECT name FROM meals")).toEqual([{ name: "Breakfast" }]);
    expect(await userVersion(db)).toBe(DATABASE_VERSION);
  });
});
