export type MacroKey = "protein" | "carbs" | "fat";

// `label` includes the unit, for forms that only use grams; `name` is without it.
export const MACRO_FIELDS: { key: MacroKey; label: string; name: string }[] = [
  { key: "protein", label: "Protein (g)", name: "Protein" },
  { key: "carbs", label: "Carbs (g)", name: "Carbs" },
  { key: "fat", label: "Fat (g)", name: "Fat" },
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

export const KCAL_PER_GRAM: Record<MacroKey, number> = { protein: 4, carbs: 4, fat: 9 };

// e.g. 35% fat of 1500 kcal = 1500 × 0.35 ÷ 9 ≈ 58.3 g
export function gramsFromPercent(key: MacroKey, percent: number, calories: number) {
  return (calories * percent) / 100 / KCAL_PER_GRAM[key];
}

// e.g. 100 g protein of 1500 kcal = 100 × 4 ÷ 1500 ≈ 26.7%
export function percentFromGrams(key: MacroKey, grams: number, calories: number) {
  return ((grams * KCAL_PER_GRAM[key]) / calories) * 100;
}

// Rounds to at most `decimals` decimals and drops trailing zeros: 26.666 -> "26.7", 58.0 -> "58".
export function formatNumber(value: number, decimals = 0) {
  const factor = 10 ** decimals;
  return String(Math.round(value * factor) / factor);
}

// "P 47 g · C 0 g · F 5 g"
export function macroLine(macros: Record<MacroKey, number>) {
  return `P ${formatNumber(macros.protein)} g · C ${formatNumber(macros.carbs)} g · F ${formatNumber(macros.fat)} g`;
}
