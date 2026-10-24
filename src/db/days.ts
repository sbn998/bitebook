import type { SQLiteDatabase } from "expo-sqlite";

// The goal a day is compared against. A null macro means "no target" for it.
export type DayGoal = {
  name: string;
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

// The goal for a date (YYYY-MM-DD) with its weekday (1 = Monday ... 7 = Sunday), or null if it has none.
// A day that already has a row uses its own copy; otherwise it uses its weekday's current goal.
export async function getDayGoal(db: SQLiteDatabase, date: string, weekday: number): Promise<DayGoal | null> {
  const day = await db.getFirstAsync<{
    goal_name: string | null;
    goal_calories: number | null;
    goal_protein: number | null;
    goal_carbs: number | null;
    goal_fat: number | null;
  }>("SELECT goal_name, goal_calories, goal_protein, goal_carbs, goal_fat FROM days WHERE date = ?", date);

  if (day) {
    if (day.goal_name === null || day.goal_calories === null) return null;
    return {
      name: day.goal_name,
      calories: day.goal_calories,
      protein: day.goal_protein,
      carbs: day.goal_carbs,
      fat: day.goal_fat,
    };
  }

  return db.getFirstAsync<DayGoal>(
    `SELECT goals.name, goals.calories, goals.protein, goals.carbs, goals.fat
     FROM weekday_goals JOIN goals ON goals.id = weekday_goals.goal_id
     WHERE weekday_goals.weekday = ?`,
    weekday
  );
}

// Creates the day's row if it doesn't exist yet, copying its weekday's goal (or no goal).
// Called when a day gets its first meal entry. Does nothing if the day already exists.
export function ensureDay(db: SQLiteDatabase, date: string, weekday: number) {
  return db.runAsync(
    `INSERT OR IGNORE INTO days (date, goal_id, goal_name, goal_calories, goal_protein, goal_carbs, goal_fat)
     SELECT ?, goals.id, goals.name, goals.calories, goals.protein, goals.carbs, goals.fat
     FROM (SELECT 1)
     LEFT JOIN weekday_goals ON weekday_goals.weekday = ?
     LEFT JOIN goals ON goals.id = weekday_goals.goal_id`,
    date,
    weekday
  );
}
