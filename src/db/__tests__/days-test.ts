import { ensureDay, getDayGoal } from "@/db/days";
import { addGoal, type Goal, setWeekdayGoal } from "@/db/goals";
import { openTestDb } from "@/db/test-db";

const today = "2026-10-26"; // A Monday
const cut: Omit<Goal, "id"> = { name: "Cut", calories: 1800, protein: 150, carbs: null, fat: 50 };
const bulk: Omit<Goal, "id"> = { name: "Bulk", calories: 2800, protein: 180, carbs: 350, fat: 80 };

describe("getDayGoal", () => {
  test("uses the weekday's goal for a day that hasn't been saved yet", async () => {
    const db = await openTestDb();
    const { lastInsertRowId: id } = await addGoal(db, cut);
    await setWeekdayGoal(db, 1, id, today);

    expect(await getDayGoal(db, today, 1)).toEqual({ name: "Cut", calories: 1800, protein: 150, carbs: null, fat: 50 });
  });

  test("gives null when the weekday has no goal", async () => {
    const db = await openTestDb();
    expect(await getDayGoal(db, today, 1)).toBeNull();
  });

  test("uses the day's own copy once the day is saved", async () => {
    const db = await openTestDb();
    const { lastInsertRowId: cutId } = await addGoal(db, cut);
    const { lastInsertRowId: bulkId } = await addGoal(db, bulk);
    const pastMonday = "2026-10-19";
    await setWeekdayGoal(db, 1, cutId, pastMonday);
    await ensureDay(db, pastMonday, 1);

    // Monday has used another goal since then, but the past day keeps the one it had.
    await setWeekdayGoal(db, 1, bulkId, today);

    expect(await getDayGoal(db, pastMonday, 1)).toMatchObject({ name: "Cut", calories: 1800 });
  });

  test("gives null for a saved day without a goal, even if its weekday has one now", async () => {
    const db = await openTestDb();
    const { lastInsertRowId: id } = await addGoal(db, cut);
    const pastMonday = "2026-10-19";
    await ensureDay(db, pastMonday, 1);

    await setWeekdayGoal(db, 1, id, today);

    expect(await getDayGoal(db, pastMonday, 1)).toBeNull();
  });
});
