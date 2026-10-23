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
};

export function getFoods(db: SQLiteDatabase) {
  return db.getAllAsync<Food>("SELECT * FROM foods ORDER BY name COLLATE NOCASE");
}

export function addFood(db: SQLiteDatabase, food: Omit<Food, "id">) {
  // The ? placeholders are filled in safely by SQLite, so user input can't run as SQL.
  return db.runAsync(
    `INSERT INTO foods (name, brand, type, reference_amount, unit, calories, protein, carbs, fat)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    food.name,
    food.brand,
    food.type,
    food.reference_amount,
    food.unit,
    food.calories,
    food.protein,
    food.carbs,
    food.fat
  );
}
