// Checks that the test database behaves like expo-sqlite where the db functions rely on it.
import { openTestDb } from "@/db/test-db";

describe("test database", () => {
  test("runAsync gives the new row's id and how many rows changed", async () => {
    const db = await openTestDb();
    const first = await db.runAsync("INSERT INTO meals (name) VALUES (?)", "Breakfast");
    const second = await db.runAsync("INSERT INTO meals (name) VALUES (?)", "Lunch");
    expect(first).toEqual({ lastInsertRowId: 1, changes: 1 });
    expect(second.lastInsertRowId).toBe(2);
  });

  test("getFirstAsync gives null when there's no row", async () => {
    const db = await openTestDb();
    expect(await db.getFirstAsync("SELECT * FROM meals WHERE id = ?", 99)).toBeNull();
  });

  test("a transaction keeps its changes when nothing fails", async () => {
    const db = await openTestDb();
    await db.withTransactionAsync(async () => {
      await db.runAsync("INSERT INTO meals (name) VALUES (?)", "Breakfast");
      await db.runAsync("INSERT INTO meals (name) VALUES (?)", "Lunch");
    });
    expect(await db.getAllAsync("SELECT name FROM meals")).toEqual([{ name: "Breakfast" }, { name: "Lunch" }]);
  });

  test("a transaction undoes everything when something fails halfway", async () => {
    const db = await openTestDb();
    const transaction = db.withTransactionAsync(async () => {
      await db.runAsync("INSERT INTO meals (name) VALUES (?)", "Breakfast");
      // Meal names must be unique, so this fails.
      await db.runAsync("INSERT INTO meals (name) VALUES (?)", "Breakfast");
    });
    await expect(transaction).rejects.toThrow("UNIQUE");
    expect(await db.getAllAsync("SELECT * FROM meals")).toEqual([]);
  });
});
