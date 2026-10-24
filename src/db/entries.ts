import type { SQLiteDatabase } from "expo-sqlite";

import { ensureDay } from "@/db/days";
import type { Food } from "@/db/foods";
import type { Meal } from "@/db/meals";

// A food eaten in a meal entry. Its name and nutrition values (per reference_amount) are copies
// made when it was added, so editing or deleting the saved food later doesn't change it.
export type FoodEntry = {
  id: number;
  meal_entry_id: number;
  food_id: number | null;
  quantity: number;
  name: string;
  unit: Food["unit"];
  reference_amount: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

// A meal on a day, with its foods in the order they were added.
export type MealEntry = {
  id: number;
  date: string;
  meal_id: number | null;
  meal_name: string;
  foods: FoodEntry[];
};

export type Nutrition = { calories: number; protein: number; carbs: number; fat: number };

// What a food entry adds up to: its values scaled from the reference amount to the quantity eaten.
// e.g. 150 g of a food with 165 kcal per 100 g = 150 / 100 × 165 = 247.5 kcal
export function foodEntryNutrition(entry: FoodEntry): Nutrition {
  const scale = entry.quantity / entry.reference_amount;
  return {
    calories: entry.calories * scale,
    protein: entry.protein * scale,
    carbs: entry.carbs * scale,
    fat: entry.fat * scale,
  };
}

// The sum of several food entries, e.g. a meal or a whole day.
export function sumNutrition(entries: FoodEntry[]): Nutrition {
  return entries.reduce(
    (total, entry) => {
      const nutrition = foodEntryNutrition(entry);
      return {
        calories: total.calories + nutrition.calories,
        protein: total.protein + nutrition.protein,
        carbs: total.carbs + nutrition.carbs,
        fat: total.fat + nutrition.fat,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// All meal entries of a date (YYYY-MM-DD) with their foods, in the order they were added.
export async function getDayEntries(db: SQLiteDatabase, date: string): Promise<MealEntry[]> {
  const meals = await db.getAllAsync<Omit<MealEntry, "foods">>(
    "SELECT * FROM meal_entries WHERE date = ? ORDER BY id",
    date
  );
  const foods = await db.getAllAsync<FoodEntry>(
    `SELECT food_entries.* FROM food_entries
     JOIN meal_entries ON meal_entries.id = food_entries.meal_entry_id
     WHERE meal_entries.date = ?
     ORDER BY food_entries.id`,
    date
  );
  return meals.map((meal) => ({ ...meal, foods: foods.filter((food) => food.meal_entry_id === meal.id) }));
}

function insertFoodEntry(db: SQLiteDatabase, mealEntryId: number, food: Food, quantity: number) {
  return db.runAsync(
    `INSERT INTO food_entries
       (meal_entry_id, food_id, quantity, name, unit, reference_amount, calories, protein, carbs, fat)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    mealEntryId,
    food.id,
    quantity,
    food.name,
    food.unit,
    food.reference_amount,
    food.calories,
    food.protein,
    food.carbs,
    food.fat
  );
}

// Adds a meal to a day with its foods (which can be none, to fill in later). If it's the day's first
// meal, the day is created with a copy of its weekday's goal. All in one transaction: all or nothing.
export function addMealEntry(
  db: SQLiteDatabase,
  date: string,
  weekday: number,
  meal: Meal,
  foods: { food: Food; quantity: number }[]
) {
  return db.withTransactionAsync(async () => {
    await ensureDay(db, date, weekday);
    const result = await db.runAsync(
      "INSERT INTO meal_entries (date, meal_id, meal_name) VALUES (?, ?, ?)",
      date,
      meal.id,
      meal.name
    );
    for (const { food, quantity } of foods) {
      await insertFoodEntry(db, result.lastInsertRowId, food, quantity);
    }
  });
}

// Adds a food to a meal that's already on a day.
export function addFoodEntry(db: SQLiteDatabase, mealEntryId: number, food: Food, quantity: number) {
  return insertFoodEntry(db, mealEntryId, food, quantity);
}

export function updateFoodEntryQuantity(db: SQLiteDatabase, id: number, quantity: number) {
  return db.runAsync("UPDATE food_entries SET quantity = ? WHERE id = ?", quantity, id);
}

export function deleteFoodEntry(db: SQLiteDatabase, id: number) {
  return db.runAsync("DELETE FROM food_entries WHERE id = ?", id);
}

// The database also deletes the meal's food entries.
export function deleteMealEntry(db: SQLiteDatabase, id: number) {
  return db.runAsync("DELETE FROM meal_entries WHERE id = ?", id);
}
