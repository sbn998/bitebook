import type { SQLiteDatabase } from "expo-sqlite";

// One row of the goals table. A null macro means "no target" for it.
export type Goal = {
  id: number;
  name: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

// Which goal a weekday uses. Weekdays without a goal have no row.
export type WeekdayGoal = {
  weekday: number; // 1 = Monday ... 7 = Sunday
  goal_id: number;
};

// Turns a YYYY-MM-DD date into our weekday number. SQLite's %w gives 0 = Sunday ... 6 = Saturday.
const WEEKDAY_OF_DATE = "((CAST(strftime('%w', date) AS INTEGER) + 6) % 7) + 1";

// Clears the goal copy on a day.
const CLEAR_DAY_GOAL =
  "goal_id = NULL, goal_name = NULL, goal_calories = NULL, goal_protein = NULL, goal_carbs = NULL, goal_fat = NULL";

// The functions that change goals take `today` (YYYY-MM-DD, local time): days before it are
// never touched, so past days keep the goal they had. See DATABASE.md.

export function getGoals(db: SQLiteDatabase) {
  return db.getAllAsync<Goal>("SELECT * FROM goals ORDER BY id");
}

export function getGoal(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Goal>("SELECT * FROM goals WHERE id = ?", id);
}

export function addGoal(db: SQLiteDatabase, goal: Omit<Goal, "id">) {
  return db.runAsync(
    "INSERT INTO goals (name, calories, protein, carbs, fat) VALUES (?, ?, ?, ?, ?)",
    goal.name,
    goal.calories,
    goal.protein,
    goal.carbs,
    goal.fat
  );
}

// Updates the goal, and the copy on today and future days that use it.
// The transaction makes both changes happen together, or neither.
export function updateGoal(db: SQLiteDatabase, id: number, goal: Omit<Goal, "id">, today: string) {
  return db.withTransactionAsync(async () => {
    await db.runAsync(
      "UPDATE goals SET name = ?, calories = ?, protein = ?, carbs = ?, fat = ? WHERE id = ?",
      goal.name,
      goal.calories,
      goal.protein,
      goal.carbs,
      goal.fat,
      id
    );
    await db.runAsync(
      `UPDATE days
       SET goal_name = ?, goal_calories = ?, goal_protein = ?, goal_carbs = ?, goal_fat = ?
       WHERE goal_id = ? AND date >= ?`,
      goal.name,
      goal.calories,
      goal.protein,
      goal.carbs,
      goal.fat,
      id,
      today
    );
  });
}

// Clears the goal from today and future days, then deletes it. The database removes it from
// any weekday that uses it, and past days keep their copy.
export function deleteGoal(db: SQLiteDatabase, id: number, today: string) {
  return db.withTransactionAsync(async () => {
    await db.runAsync(`UPDATE days SET ${CLEAR_DAY_GOAL} WHERE goal_id = ? AND date >= ?`, id, today);
    await db.runAsync("DELETE FROM goals WHERE id = ?", id);
  });
}

export function getWeekdayGoals(db: SQLiteDatabase) {
  return db.getAllAsync<WeekdayGoal>("SELECT * FROM weekday_goals ORDER BY weekday");
}

// Sets (or with null, removes) a weekday's goal, and updates today and future days of that weekday.
export function setWeekdayGoal(db: SQLiteDatabase, weekday: number, goalId: number | null, today: string) {
  return db.withTransactionAsync(async () => {
    if (goalId === null) {
      await db.runAsync("DELETE FROM weekday_goals WHERE weekday = ?", weekday);
      await db.runAsync(`UPDATE days SET ${CLEAR_DAY_GOAL} WHERE date >= ? AND ${WEEKDAY_OF_DATE} = ?`, today, weekday);
      return;
    }
    await db.runAsync(
      `INSERT INTO weekday_goals (weekday, goal_id) VALUES (?, ?)
       ON CONFLICT (weekday) DO UPDATE SET goal_id = excluded.goal_id`,
      weekday,
      goalId
    );
    await db.runAsync(
      `UPDATE days
       SET (goal_id, goal_name, goal_calories, goal_protein, goal_carbs, goal_fat) =
           (SELECT id, name, calories, protein, carbs, fat FROM goals WHERE id = ?)
       WHERE date >= ? AND ${WEEKDAY_OF_DATE} = ?`,
      goalId,
      today,
      weekday
    );
  });
}
