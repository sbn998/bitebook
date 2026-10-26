import { en } from "@/i18n/en";
import { es } from "@/i18n/es";
import { errorMessages, type FoodFormFields, type GoalFormFields, readFoodForm, readGoalForm } from "@/utils/forms";

// A filled-in food form; each test changes only what it's about.
const chickenForm: FoodFormFields = {
  name: "Chicken breast",
  brand: "",
  type: "poultry",
  unit: "g",
  referenceAmount: "100",
  calories: "165",
  macros: { protein: "31", carbs: "0", fat: "3.6" },
};

// A goal form typed in grams; each test changes only what it's about.
const cutForm: GoalFormFields = {
  name: "Cut",
  calories: "1800",
  macros: { protein: "150", carbs: "180", fat: "50" },
  units: { protein: "g", carbs: "g", fat: "g" },
};
const allPercent = { protein: "%", carbs: "%", fat: "%" } as const;

describe("readFoodForm", () => {
  test("turns the typed text into a food, with a dot or a comma for decimals", () => {
    const { value, errors } = readFoodForm({
      ...chickenForm,
      name: "  Chicken breast ",
      macros: { ...chickenForm.macros, fat: "3,6" },
    });
    expect(errors).toEqual({});
    expect(value).toEqual({
      name: "Chicken breast",
      brand: null,
      type: "poultry",
      reference_amount: 100,
      unit: "g",
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    });
  });

  test("saves empty macros as 0", () => {
    const { value } = readFoodForm({ ...chickenForm, macros: { protein: "31", carbs: "", fat: "" } });
    expect(value).toMatchObject({ protein: 31, carbs: 0, fat: 0 });
  });

  test("calculates empty calories from the macros", () => {
    // 10 × 4 + 20 × 4 + 5 × 9 = 165
    const { value } = readFoodForm({ ...chickenForm, calories: "", macros: { protein: "10", carbs: "20", fat: "5" } });
    expect(value).toMatchObject({ calories: 165 });
  });

  test("keeps typed calories, even when the macros add up to something else", () => {
    // The macros add up to 159 kcal, but labels often round differently.
    const { value } = readFoodForm(chickenForm);
    expect(value).toMatchObject({ calories: 165 });
  });

  test("allows foods with 0 calories", () => {
    const water = { ...chickenForm, name: "Water", calories: "0", macros: { protein: "", carbs: "", fat: "" } };
    expect(readFoodForm(water).value).toMatchObject({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  test("needs calories or at least one macro", () => {
    const empty = { ...chickenForm, calories: "", macros: { protein: "", carbs: "", fat: "" } };
    expect(readFoodForm(empty)).toEqual({ value: null, errors: { calories: "caloriesOrMacro" } });
  });

  test("says what's wrong with each field", () => {
    const { value, errors } = readFoodForm({
      ...chickenForm,
      name: " ",
      type: null,
      referenceAmount: "0",
      calories: "-5",
      macros: { protein: "abc", carbs: "-1", fat: "" },
    });
    expect(value).toBeNull();
    expect(errors).toEqual({
      name: "required",
      type: "chooseType",
      reference_amount: "moreThanZero",
      calories: "notNegative",
      protein: "validNumber",
      carbs: "notNegative",
    });
  });

  test("needs a reference amount that's a number", () => {
    expect(readFoodForm({ ...chickenForm, referenceAmount: "" }).errors).toEqual({ reference_amount: "required" });
    expect(readFoodForm({ ...chickenForm, referenceAmount: "a lot" }).errors).toEqual({
      reference_amount: "validNumber",
    });
  });
});

describe("readGoalForm", () => {
  test("turns the typed text into a goal", () => {
    expect(readGoalForm({ ...cutForm, name: " Cut " })).toEqual({
      value: { name: "Cut", calories: 1800, protein: 150, carbs: 180, fat: 50 },
      errors: {},
    });
  });

  test("saves empty macros as no target", () => {
    const { value } = readGoalForm({ ...cutForm, macros: { protein: "150", carbs: "", fat: "" } });
    expect(value).toMatchObject({ protein: 150, carbs: null, fat: null });
  });

  test("saves percentages as whole grams", () => {
    const { value } = readGoalForm({
      ...cutForm,
      calories: "1500",
      macros: { protein: "25", carbs: "", fat: "35" },
      units: { protein: "%", carbs: "g", fat: "%" },
    });
    // 25% of 1500 = 375 kcal ÷ 4 = 93.75 g → 94; 35% of 1500 = 525 kcal ÷ 9 = 58.33 g → 58
    expect(value).toMatchObject({ protein: 94, carbs: null, fat: 58 });
  });

  test("calculates empty calories from macros in grams", () => {
    // 150 × 4 + 200 × 4 + 50 × 9 = 600 + 800 + 450
    const { value } = readGoalForm({ ...cutForm, calories: "", macros: { protein: "150", carbs: "200", fat: "50" } });
    expect(value).toMatchObject({ calories: 1850 });
  });

  test("needs calories when a macro is a percentage", () => {
    const form = { ...cutForm, calories: "", units: { ...cutForm.units, fat: "%" as const } };
    expect(readGoalForm(form)).toEqual({ value: null, errors: { calories: "caloriesForPercent" } });
  });

  test("needs calories or at least one macro", () => {
    const empty = { ...cutForm, calories: "", macros: { protein: "", carbs: "", fat: "" } };
    expect(readGoalForm(empty).errors).toEqual({ calories: "caloriesOrMacro" });
  });

  test("needs calories above 0", () => {
    const noMacros = { protein: "", carbs: "", fat: "" };
    expect(readGoalForm({ ...cutForm, calories: "0", macros: noMacros }).errors).toEqual({ calories: "moreThanZero" });
    expect(readGoalForm({ ...cutForm, calories: "lots", macros: noMacros }).errors).toEqual({
      calories: "validNumber",
    });
  });

  test("says what's wrong with each macro", () => {
    const { value, errors } = readGoalForm({
      ...cutForm,
      name: "",
      macros: { protein: "x", carbs: "-10", fat: "120" },
      units: { protein: "g", carbs: "g", fat: "%" },
    });
    expect(value).toBeNull();
    expect(errors).toEqual({ name: "required", protein: "validNumber", carbs: "notNegative", fat: "maxPercent" });
  });

  test("can't save macros that add up to more than the calories", () => {
    // 150 × 4 + 180 × 4 + 50 × 9 = 1770 kcal, more than 1700
    expect(readGoalForm({ ...cutForm, calories: "1700" })).toEqual({ value: null, errors: { total: "over" } });
  });

  test("can save a 30/40/30 split typed as percentages", () => {
    // The fat rounds up to 67 g (603 kcal instead of 600), but the check uses the exact grams.
    const { value } = readGoalForm({
      ...cutForm,
      calories: "2000",
      macros: { protein: "30", carbs: "40", fat: "30" },
      units: allPercent,
    });
    expect(value).toEqual({ name: "Cut", calories: 2000, protein: 150, carbs: 200, fat: 67 });
  });
});

describe("errorMessages", () => {
  test("shows each field's error in the app's language", () => {
    const errors = { name: "required", fat: "maxPercent" } as const;
    expect(errorMessages(en, errors)).toEqual({ name: en.common.required, fat: en.goalForm.maxPercent });
    expect(errorMessages(es, errors)).toEqual({ name: es.common.required, fat: es.goalForm.maxPercent });
  });
});
