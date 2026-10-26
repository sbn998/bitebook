import type { SQLiteDatabase } from "expo-sqlite";

import type { FoodType, Unit } from "@/constants/food";

// One row of the foods table. Nutrition values are per reference_amount of unit.
export type Food = {
  id: number;
  name: string;
  brand: string | null;
  type: FoodType;
  reference_amount: number;
  unit: Unit;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  barcode: string | null; // As text, so leading zeros are kept. No two foods share one.
};

// What the food form edits. The barcode is only set when a food is added, never edited.
export type FoodDetails = Omit<Food, "id" | "barcode">;

export function getFoods(db: SQLiteDatabase) {
  return db.getAllAsync<Food>("SELECT * FROM foods ORDER BY name COLLATE NOCASE");
}

export function getFood(db: SQLiteDatabase, id: number) {
  return db.getFirstAsync<Food>("SELECT * FROM foods WHERE id = ?", id);
}

export function addFood(db: SQLiteDatabase, food: Omit<Food, "id">) {
  // The ? placeholders are filled in safely by SQLite, so user input can't run as SQL.
  return db.runAsync(
    `INSERT INTO foods (name, brand, type, reference_amount, unit, calories, protein, carbs, fat, barcode)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    food.name,
    food.brand,
    food.type,
    food.reference_amount,
    food.unit,
    food.calories,
    food.protein,
    food.carbs,
    food.fat,
    food.barcode
  );
}

// Leaves the barcode as it is.
export function updateFood(db: SQLiteDatabase, id: number, food: FoodDetails) {
  return db.runAsync(
    `UPDATE foods
     SET name = ?, brand = ?, type = ?, reference_amount = ?, unit = ?,
         calories = ?, protein = ?, carbs = ?, fat = ?
     WHERE id = ?`,
    food.name,
    food.brand,
    food.type,
    food.reference_amount,
    food.unit,
    food.calories,
    food.protein,
    food.carbs,
    food.fat,
    id
  );
}

// Past food entries keep their copied values: their food_id is set to NULL by the database.
export function deleteFood(db: SQLiteDatabase, id: number) {
  return db.runAsync("DELETE FROM foods WHERE id = ?", id);
}
