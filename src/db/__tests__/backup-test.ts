import type { SQLiteDatabase } from "expo-sqlite";

import {
  type Backup,
  BACKUP_FORMAT,
  BackupError,
  countBackup,
  countCurrentData,
  createBackup,
  parseBackup,
  restoreBackup,
} from "@/db/backup";
import { addMealEntry, getDayEntries } from "@/db/entries";
import { addFood, getFood } from "@/db/foods";
import { addGoal, setWeekdayGoal } from "@/db/goals";
import { addMeal } from "@/db/meals";
import { DATABASE_VERSION } from "@/db/migrations";
import { openTestDb } from "@/db/test-db";

const today = "2026-10-26"; // A Monday

// A bit of everything: two foods, two meal names, a goal used on Mondays, and a Monday with lunch.
async function fillDb(db: SQLiteDatabase) {
  const food = { brand: null, type: "poultry", reference_amount: 100, unit: "g" } as const;
  const chicken = (await addFood(db, { ...food, name: "Chicken breast", calories: 165, protein: 31, carbs: 0, fat: 3.6 }))
    .lastInsertRowId;
  await addFood(db, { ...food, name: "Turkey", brand: "Mercadona", calories: 104, protein: 24, carbs: 0, fat: 1 });
  const lunch = (await addMeal(db, "Lunch")).lastInsertRowId;
  await addMeal(db, "Dinner");
  const goal = (await addGoal(db, { name: "Cut", calories: 1800, protein: 150, carbs: null, fat: 50 })).lastInsertRowId;
  await setWeekdayGoal(db, 1, goal, today);
  await addMealEntry(db, today, 1, { id: lunch, name: "Lunch" }, [
    { food: (await getFood(db, chicken))!, quantity: 150 },
  ]);
}

// The text of an exported file, the way it's saved to the phone.
async function exportText(db: SQLiteDatabase) {
  return JSON.stringify(await createBackup(db));
}

// Why parseBackup refuses a text, or null if it accepts it.
function refusal(text: string) {
  try {
    parseBackup(text);
    return null;
  } catch (error) {
    if (error instanceof BackupError) return error.reason;
    throw error;
  }
}

// A valid backup file's contents, with every table empty.
const emptyBackup = {
  app: "macro-tracker",
  format: BACKUP_FORMAT,
  databaseVersion: DATABASE_VERSION,
  exportedAt: "2026-10-26T10:00:00.000Z",
  data: { foods: [], meals: [], goals: [], weekday_goals: [], days: [], meal_entries: [], food_entries: [] },
};

describe("parseBackup", () => {
  test("accepts an exported file", async () => {
    const db = await openTestDb();
    await fillDb(db);
    const text = await exportText(db);
    expect(parseBackup(text)).toEqual(JSON.parse(text));
  });

  test("accepts a file made by an older version of the app", () => {
    expect(refusal(JSON.stringify({ ...emptyBackup, databaseVersion: 1 }))).toBeNull();
  });

  test("refuses files that aren't Bitebook backups", () => {
    expect(refusal("not a backup")).toBe("invalid");
    expect(refusal("[]")).toBe("invalid");
    expect(refusal(JSON.stringify({ ...emptyBackup, app: "another-app" }))).toBe("invalid");
    expect(refusal(JSON.stringify({ ...emptyBackup, format: "1" }))).toBe("invalid");
  });

  test("refuses damaged files", () => {
    // JSON.stringify leaves out undefined values, so the file has no foods table.
    const withoutFoods = { ...emptyBackup.data, foods: undefined };
    expect(refusal(JSON.stringify({ ...emptyBackup, data: withoutFoods }))).toBe("invalid");
    // A value that's a list instead of plain text or a number
    const nested = { ...emptyBackup.data, meals: [{ id: 1, name: ["Lunch"] }] };
    expect(refusal(JSON.stringify({ ...emptyBackup, data: nested }))).toBe("invalid");
  });

  test("refuses files made by a newer version of the app", () => {
    expect(refusal(JSON.stringify({ ...emptyBackup, databaseVersion: DATABASE_VERSION + 1 }))).toBe("newer");
    expect(refusal(JSON.stringify({ ...emptyBackup, format: BACKUP_FORMAT + 1 }))).toBe("newer");
  });
});

describe("exporting and importing", () => {
  test("gives back exactly the same data in another database", async () => {
    const phone = await openTestDb();
    await fillDb(phone);
    const newPhone = await openTestDb();

    await restoreBackup(newPhone, parseBackup(await exportText(phone)));

    expect((await createBackup(newPhone)).data).toEqual((await createBackup(phone)).data);
    // The links still work: the day shows its lunch with the chicken.
    expect(await getDayEntries(newPhone, today)).toEqual(await getDayEntries(phone, today));
  });

  test("replaces all existing data", async () => {
    const phone = await openTestDb();
    await addMeal(phone, "Breakfast");
    const text = await exportText(phone);
    const newPhone = await openTestDb();
    await fillDb(newPhone);

    await restoreBackup(newPhone, parseBackup(text));

    expect((await createBackup(newPhone)).data).toEqual({ ...emptyBackup.data, meals: [{ id: 1, name: "Breakfast" }] });
  });

  test("changes nothing if a row can't be imported", async () => {
    const db = await openTestDb();
    await fillDb(db);
    const before = (await createBackup(db)).data;
    // A food eaten in a meal entry that isn't in the file.
    const broken: Backup = {
      ...(emptyBackup as Backup),
      data: { ...emptyBackup.data, food_entries: [{ ...before.food_entries[0], meal_entry_id: 99 }] },
    };

    await expect(restoreBackup(db, broken)).rejects.toThrow("FOREIGN KEY");
    expect((await createBackup(db)).data).toEqual(before);
  });

  test("ignores columns the app doesn't know", async () => {
    const db = await openTestDb();
    const withExtra: Backup = {
      ...(emptyBackup as Backup),
      data: { ...emptyBackup.data, meals: [{ id: 1, name: "Lunch", colour: "red" }] },
    };

    await restoreBackup(db, withExtra);

    expect((await createBackup(db)).data.meals).toEqual([{ id: 1, name: "Lunch" }]);
  });
});

describe("the counts shown before importing", () => {
  test("are the same for a database and its backup", async () => {
    const db = await openTestDb();
    await fillDb(db);
    const counts = { foods: 2, meals: 2, goals: 1, days: 1 };
    expect(await countCurrentData(db)).toEqual(counts);
    expect(countBackup(parseBackup(await exportText(db)))).toEqual(counts);
  });
});
