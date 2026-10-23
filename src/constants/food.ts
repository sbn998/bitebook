// Fixed lists from DATABASE.md. The database stores the key; the app shows the label.
// Labels are English only for now, until translations are added.

export const FOOD_TYPES = [
  { key: "beef", label: "Beef" },
  { key: "pork", label: "Pork" },
  { key: "poultry", label: "Poultry" },
  { key: "lamb", label: "Lamb" },
  { key: "fish", label: "Fish" },
  { key: "seafood", label: "Seafood" },
  { key: "eggs", label: "Eggs" },
  { key: "dairy", label: "Dairy" },
  { key: "grains", label: "Grains, bread & pasta" },
  { key: "legumes", label: "Legumes" },
  { key: "vegetables", label: "Vegetables" },
  { key: "fruit", label: "Fruit" },
  { key: "nuts_seeds", label: "Nuts & seeds" },
  { key: "fats_oils", label: "Fats & oils" },
  { key: "sweets_snacks", label: "Sweets & snacks" },
  { key: "drinks", label: "Drinks" },
  { key: "sauces", label: "Sauces & condiments" },
  { key: "prepared", label: "Prepared meals" },
  { key: "other", label: "Other" },
] as const;

export const UNITS = [
  { key: "g", label: "g" },
  { key: "ml", label: "ml" },
  { key: "serving", label: "serving" },
  { key: "piece", label: "piece" },
  { key: "slice", label: "slice" },
  { key: "cup", label: "cup" },
  { key: "tbsp", label: "tablespoon" },
  { key: "tsp", label: "teaspoon" },
] as const;

export type FoodType = (typeof FOOD_TYPES)[number]["key"];
export type Unit = (typeof UNITS)[number]["key"];

export function foodTypeLabel(key: FoodType) {
  return FOOD_TYPES.find((type) => type.key === key)?.label ?? key;
}

export function unitLabel(key: Unit) {
  return UNITS.find((unit) => unit.key === key)?.label ?? key;
}
