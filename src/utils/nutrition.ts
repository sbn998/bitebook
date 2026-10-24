export type MacroKey = "protein" | "carbs" | "fat";

export const MACRO_FIELDS: { key: MacroKey; label: string }[] = [
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fat", label: "Fat (g)" },
];

// Accepts both "12.5" and "12,5". Returns null if the text isn't a number.
export function parseNumber(text: string) {
  const normalized = text.trim().replace(",", ".");
  if (normalized === "") return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

// Standard estimate: 4 kcal per gram of protein or carbs, 9 kcal per gram of fat.
export function caloriesFromMacros(protein: number, carbs: number, fat: number) {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}
