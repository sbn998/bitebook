// Fixed lists from DATABASE.md, in display order. The database stores these keys;
// the labels shown for them are in the translation files (t.foodTypes and t.units).

export const FOOD_TYPE_KEYS = [
  "beef",
  "pork",
  "poultry",
  "lamb",
  "fish",
  "seafood",
  "eggs",
  "dairy",
  "grains",
  "legumes",
  "vegetables",
  "fruit",
  "nuts_seeds",
  "fats_oils",
  "sweets_snacks",
  "drinks",
  "sauces",
  "prepared",
  "other",
] as const;

export const UNIT_KEYS = ["g", "ml", "serving", "piece", "slice", "cup", "tbsp", "tsp"] as const;

export type FoodType = (typeof FOOD_TYPE_KEYS)[number];
export type Unit = (typeof UNIT_KEYS)[number];
