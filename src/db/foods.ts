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
