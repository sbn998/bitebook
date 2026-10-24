import type { SQLiteDatabase } from "expo-sqlite";

// One row of the meals table: a meal label like "Breakfast".
export type Meal = {
  id: number;
  name: string;
};

// In the order they were added (ids only go up).
export function getMeals(db: SQLiteDatabase) {
  return db.getAllAsync<Meal>("SELECT * FROM meals ORDER BY id");
}

export function addMeal(db: SQLiteDatabase, name: string) {
  return db.runAsync("INSERT INTO meals (name) VALUES (?)", name);
}

// Past meal entries keep their own copy of the old name.
export function renameMeal(db: SQLiteDatabase, id: number, name: string) {
  return db.runAsync("UPDATE meals SET name = ? WHERE id = ?", name, id);
}

// Past meal entries keep their copied name: their meal_id is set to NULL by the database.
export function deleteMeal(db: SQLiteDatabase, id: number) {
  return db.runAsync("DELETE FROM meals WHERE id = ?", id);
}
