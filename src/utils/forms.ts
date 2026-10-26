import type { FoodType, Unit } from "@/constants/food";
import type { FoodDetails } from "@/db/foods";
import type { Goal } from "@/db/goals";
import type { Strings } from "@/i18n";
import {
  caloriesFromMacros,
  gramsFromPercent,
  isOverGoal,
  KCAL_PER_GRAM,
  MACRO_FIELDS,
  type MacroKey,
  type MacroUnit,
  parseNumber,
} from "@/utils/nutrition";
import type { ScannedFood } from "@/utils/open-food-facts";

// Why a form field can't be saved. The forms show each one as a message in the app's language.
export type FieldError =
  | "required"
  | "chooseType"
  | "validNumber"
  | "moreThanZero"
  | "notNegative"
  | "caloriesOrMacro"
  | "caloriesForPercent"
  | "maxPercent"
  | "over";

// What a form's Save reads: the thing to save, or null and what's wrong with each field (by field name).
type FormResult<T> = { value: T | null; errors: Record<string, FieldError> };

// The food form's fields, as typed.
export type FoodFormFields = {
  name: string;
  brand: string;
  type: FoodType | null;
  unit: Unit;
  referenceAmount: string;
  calories: string;
  macros: Record<MacroKey, string>;
};

// The food form filled in from a scanned product, per 100 g (or ml). A value Open Food Facts doesn't
// have stays an empty field, so it's clear it's missing. Calories stay empty too: Save calculates them
// from the macros, because labels' calories often don't match their macros. Only when every macro is 0
// (like water) are calories filled in as 0, so they don't depend on the macros at all.
export function scannedFoodFields(food: ScannedFood): FoodFormFields {
  const text = (value: number | null) => (value === null ? "" : String(value));
  const noMacros = food.protein === 0 && food.carbs === 0 && food.fat === 0;
  return {
    name: food.name,
    brand: food.brand ?? "",
    type: food.type,
    unit: food.unit,
    referenceAmount: "100",
    calories: noMacros ? "0" : "",
    macros: { protein: text(food.protein), carbs: text(food.carbs), fat: text(food.fat) },
  };
}

// Checks the food form and turns it into a food to save. Empty macros count as 0, and empty calories
// are calculated from the macros, if there are any.
export function readFoodForm(fields: FoodFormFields): FormResult<FoodDetails> {
  const errors: Record<string, FieldError> = {};

  if (fields.name.trim() === "") errors.name = "required";
  if (!fields.type) errors.type = "chooseType";

  const amount = parseNumber(fields.referenceAmount);
  if (fields.referenceAmount.trim() === "") errors.reference_amount = "required";
  else if (amount === null) errors.reference_amount = "validNumber";
  else if (amount <= 0) errors.reference_amount = "moreThanZero";

  const macros = { protein: 0, carbs: 0, fat: 0 };
  for (const { key } of MACRO_FIELDS) {
    if (fields.macros[key].trim() === "") continue;
    const value = parseNumber(fields.macros[key]);
    if (value === null) errors[key] = "validNumber";
    else if (value < 0) errors[key] = "notNegative";
    else macros[key] = value;
  }

  let calories = parseNumber(fields.calories);
  if (fields.calories.trim() === "") {
    const hasMacros = MACRO_FIELDS.some(({ key }) => fields.macros[key].trim() !== "");
    if (hasMacros) calories = caloriesFromMacros(macros.protein, macros.carbs, macros.fat);
    else errors.calories = "caloriesOrMacro";
  } else if (calories === null) errors.calories = "validNumber";
  else if (calories < 0) errors.calories = "notNegative";

  if (Object.keys(errors).length > 0 || !fields.type || amount === null || calories === null) {
    return { value: null, errors };
  }
  const food = {
    name: fields.name.trim(),
    brand: fields.brand.trim() || null,
    type: fields.type,
    reference_amount: amount,
    unit: fields.unit,
    calories,
    ...macros,
  };
  return { value: food, errors };
}

// The goal form's fields, as typed, with the unit each macro is typed in.
export type GoalFormFields = {
  name: string;
  calories: string;
  macros: Record<MacroKey, string>;
  units: Record<MacroKey, MacroUnit>;
};

// Checks the goal form and turns it into a goal to save. Empty macros mean "no target" (null),
// percentages are saved as whole grams, and empty calories are calculated from the macros,
// unless any macro is a percentage of them.
export function readGoalForm(fields: GoalFormFields): FormResult<Omit<Goal, "id">> {
  const errors: Record<string, FieldError> = {};

  if (fields.name.trim() === "") errors.name = "required";

  const anyPercent = MACRO_FIELDS.some(({ key }) => fields.units[key] === "%");
  const hasMacros = MACRO_FIELDS.some(({ key }) => fields.macros[key].trim() !== "");

  let calories = parseNumber(fields.calories);
  if (fields.calories.trim() === "") {
    if (anyPercent) errors.calories = "caloriesForPercent";
    else if (hasMacros) {
      const grams = (key: MacroKey) => parseNumber(fields.macros[key]) ?? 0;
      calories = caloriesFromMacros(grams("protein"), grams("carbs"), grams("fat"));
    } else errors.calories = "caloriesOrMacro";
  } else if (calories === null) errors.calories = "validNumber";
  else if (calories <= 0) errors.calories = "moreThanZero";

  const macros: Record<MacroKey, number | null> = { protein: null, carbs: null, fat: null };
  let exactMacroKcal = 0;
  for (const { key } of MACRO_FIELDS) {
    if (fields.macros[key].trim() === "") continue;
    const value = parseNumber(fields.macros[key]);
    if (value === null) errors[key] = "validNumber";
    else if (value < 0) errors[key] = "notNegative";
    else if (fields.units[key] === "%" && value > 100) errors[key] = "maxPercent";
    else if (fields.units[key] === "g") {
      macros[key] = value;
      exactMacroKcal += value * KCAL_PER_GRAM[key];
    } else if (calories !== null && !errors.calories) {
      const grams = gramsFromPercent(key, value, calories);
      macros[key] = Math.round(grams);
      exactMacroKcal += grams * KCAL_PER_GRAM[key];
    }
  }

  // Typed-in calories can't be less than the macros add up to.
  if (fields.calories.trim() !== "" && calories !== null && isOverGoal(exactMacroKcal, calories)) {
    errors.total = "over";
  }

  if (Object.keys(errors).length > 0 || calories === null) return { value: null, errors };
  return { value: { name: fields.name.trim(), calories, ...macros }, errors };
}

// The message shown under each field, in the app's language.
export function errorMessages(t: Strings, errors: Record<string, FieldError>) {
  const messages: Record<FieldError, string> = {
    required: t.common.required,
    chooseType: t.foodForm.chooseType,
    validNumber: t.common.validNumber,
    moreThanZero: t.common.moreThanZero,
    notNegative: t.common.notNegative,
    caloriesOrMacro: t.foodForm.caloriesOrMacro,
    caloriesForPercent: t.goalForm.caloriesForPercent,
    maxPercent: t.goalForm.maxPercent,
    over: "", // Never shown: the goal form's red box explains it and Save is greyed out.
  };
  return Object.fromEntries(Object.entries(errors).map(([field, error]) => [field, messages[error]]));
}
