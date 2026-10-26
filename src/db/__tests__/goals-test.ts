import type { SQLiteDatabase } from "expo-sqlite";

import { ensureDay } from "@/db/days";
import { addGoal, deleteGoal, type Goal, getGoal, getGoals, getWeekdayGoals, setWeekdayGoal, updateGoal } from "@/db/goals";
import { openTestDb } from "@/db/test-db";
import { addDays, weekdayOf } from "@/utils/date";

// Three Mondays: the tests pretend today is 26 October 2026.
const pastMonday = "2026-10-19";
const today = "2026-10-26";
const nextMonday = "2026-11-02";

const cut: Omit<Goal, "id"> = { name: "Cut", calories: 1800, protein: 150, carbs: 180, fat: 50 };
const bulk: Omit<Goal, "id"> = { name: "Bulk", calories: 2800, protein: 180, carbs: 350, fat: 80 };

async function saveGoal(db: SQLiteDatabase, goal: Omit<Goal, "id">) {
  return (await addGoal(db, goal)).lastInsertRowId;
}

// Creates a day's row the way its first meal does, copying its weekday's goal.
async function createDay(db: SQLiteDatabase, date: string) {
  await ensureDay(db, date, weekdayOf(date));
}

async function dayGoal(db: SQLiteDatabase, date: string) {
  return db.getFirstAsync<{ goal_id: number | null; goal_name: string | null; goal_calories: number | null }>(
    "SELECT goal_id, goal_name, goal_calories FROM days WHERE date = ?",
    date
  );
}

// Monday uses `goalId`, with a past, a today and a future Monday that already have rows.
async function setUpMondays(db: SQLiteDatabase, goalId: number) {
  await setWeekdayGoal(db, 1, goalId, today);
  for (const date of [pastMonday, today, nextMonday]) await createDay(db, date);
}

describe("goals", () => {
  test("are saved, with or without macro targets", async () => {
    const db = await openTestDb();
    await saveGoal(db, cut);
    await saveGoal(db, { name: "Calories only", calories: 2000, protein: null, carbs: null, fat: null });
    expect(await getGoals(db)).toEqual([
      { id: 1, ...cut },
      { id: 2, name: "Calories only", calories: 2000, protein: null, carbs: null, fat: null },
    ]);
  });
});

describe("editing a goal", () => {
  test("changes the goal", async () => {
    const db = await openTestDb();
    const id = await saveGoal(db, cut);
    await updateGoal(db, id, { ...cut, calories: 1700 }, today);
    expect(await getGoal(db, id)).toEqual({ id, ...cut, calories: 1700 });
  });

  test("updates today and future days, but past days keep their copy", async () => {
    const db = await openTestDb();
    const id = await saveGoal(db, cut);
    await setUpMondays(db, id);

    await updateGoal(db, id, { ...cut, name: "Mini cut", calories: 1700 }, today);

    expect(await dayGoal(db, pastMonday)).toEqual({ goal_id: id, goal_name: "Cut", goal_calories: 1800 });
    expect(await dayGoal(db, today)).toEqual({ goal_id: id, goal_name: "Mini cut", goal_calories: 1700 });
    expect(await dayGoal(db, nextMonday)).toEqual({ goal_id: id, goal_name: "Mini cut", goal_calories: 1700 });
  });

  test("doesn't touch days that use another goal", async () => {
    const db = await openTestDb();
    const cutId = await saveGoal(db, cut);
    const bulkId = await saveGoal(db, bulk);
    await setUpMondays(db, bulkId);

    await updateGoal(db, cutId, { ...cut, calories: 1700 }, today);

    expect(await dayGoal(db, nextMonday)).toEqual({ goal_id: bulkId, goal_name: "Bulk", goal_calories: 2800 });
  });
});

describe("deleting a goal", () => {
  test("removes it from every weekday that uses it", async () => {
    const db = await openTestDb();
    const cutId = await saveGoal(db, cut);
    const bulkId = await saveGoal(db, bulk);
    await setWeekdayGoal(db, 1, cutId, today);
    await setWeekdayGoal(db, 3, cutId, today);
    await setWeekdayGoal(db, 6, bulkId, today);

    await deleteGoal(db, cutId, today);

    expect(await getGoals(db)).toEqual([{ id: bulkId, ...bulk }]);
    expect(await getWeekdayGoals(db)).toEqual([{ weekday: 6, goal_id: bulkId }]);
  });

  test("clears today and future days, but past days keep their copy", async () => {
    const db = await openTestDb();
    const id = await saveGoal(db, cut);
    await setUpMondays(db, id);

    await deleteGoal(db, id, today);

    // The past day loses the link to the deleted goal, but keeps the copy it's shown with.
    expect(await dayGoal(db, pastMonday)).toEqual({ goal_id: null, goal_name: "Cut", goal_calories: 1800 });
    expect(await dayGoal(db, today)).toEqual({ goal_id: null, goal_name: null, goal_calories: null });
    expect(await dayGoal(db, nextMonday)).toEqual({ goal_id: null, goal_name: null, goal_calories: null });
  });
});

describe("weekday goals", () => {
  test("can be set, replaced and removed", async () => {
    const db = await openTestDb();
    const cutId = await saveGoal(db, cut);
    const bulkId = await saveGoal(db, bulk);

    await setWeekdayGoal(db, 1, cutId, today);
    await setWeekdayGoal(db, 2, cutId, today);
    await setWeekdayGoal(db, 1, bulkId, today);
    await setWeekdayGoal(db, 2, null, today);

    expect(await getWeekdayGoals(db)).toEqual([{ weekday: 1, goal_id: bulkId }]);
  });

  test("changing one updates today and future days of that weekday, but not past days", async () => {
    const db = await openTestDb();
    const cutId = await saveGoal(db, cut);
    const bulkId = await saveGoal(db, bulk);
    await setUpMondays(db, cutId);

    await setWeekdayGoal(db, 1, bulkId, today);

    expect(await dayGoal(db, pastMonday)).toMatchObject({ goal_id: cutId, goal_name: "Cut" });
    expect(await dayGoal(db, today)).toMatchObject({ goal_id: bulkId, goal_name: "Bulk" });
    expect(await dayGoal(db, nextMonday)).toMatchObject({ goal_id: bulkId, goal_name: "Bulk" });
  });

  test("removing one clears today and future days of that weekday, but not past days", async () => {
    const db = await openTestDb();
    const id = await saveGoal(db, cut);
    await setUpMondays(db, id);

    await setWeekdayGoal(db, 1, null, today);

    expect(await dayGoal(db, pastMonday)).toMatchObject({ goal_name: "Cut" });
    expect(await dayGoal(db, today)).toMatchObject({ goal_id: null, goal_name: null });
    expect(await dayGoal(db, nextMonday)).toMatchObject({ goal_id: null, goal_name: null });
  });

  test("changing one doesn't touch other weekdays", async () => {
    const db = await openTestDb();
    const cutId = await saveGoal(db, cut);
    const bulkId = await saveGoal(db, bulk);
    await setWeekdayGoal(db, 2, cutId, today);
    const nextTuesday = addDays(today, 1);
    await createDay(db, nextTuesday);

    await setWeekdayGoal(db, 1, bulkId, today);

    expect(await dayGoal(db, nextTuesday)).toMatchObject({ goal_id: cutId, goal_name: "Cut" });
  });

  test("land on the right days of the week", async () => {
    const db = await openTestDb();
    // Days from Monday 26 October to Sunday 1 November, still without goals.
    const week = [0, 1, 2, 3, 4, 5, 6].map((days) => addDays(today, days));
    for (const date of week) await createDay(db, date);

    // A different goal for each weekday: "Goal 1" for Monday ... "Goal 7" for Sunday. The days get them
    // through the database's own weekday rule, which must agree with weekdayOf.
    for (let weekday = 1; weekday <= 7; weekday++) {
      const id = await saveGoal(db, { ...cut, name: `Goal ${weekday}` });
      await setWeekdayGoal(db, weekday, id, today);
    }

    for (const date of week) {
      expect(await dayGoal(db, date)).toMatchObject({ goal_name: `Goal ${weekdayOf(date)}` });
    }
  });
});

describe("the past-day \"no goal\" button", () => {
  test("gives a past day without a goal the chosen goal", async () => {
    const db = await openTestDb();
    const id = await saveGoal(db, cut);
    await createDay(db, pastMonday); // Monday had no goal back then

    await setWeekdayGoal(db, 1, id, today, pastMonday);

    expect(await dayGoal(db, pastMonday)).toEqual({ goal_id: id, goal_name: "Cut", goal_calories: 1800 });
    expect(await getWeekdayGoals(db)).toEqual([{ weekday: 1, goal_id: id }]);
  });

  test("never overwrites a past day that already has a goal", async () => {
    const db = await openTestDb();
    const cutId = await saveGoal(db, cut);
    const bulkId = await saveGoal(db, bulk);
    await setUpMondays(db, cutId);

    await setWeekdayGoal(db, 1, bulkId, today, pastMonday);

    expect(await dayGoal(db, pastMonday)).toMatchObject({ goal_id: cutId, goal_name: "Cut" });
  });
});
