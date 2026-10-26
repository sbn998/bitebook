import {
  caloriesFromMacros,
  fillEmptyMacro,
  formatNumber,
  gramsFromPercent,
  isOverGoal,
  macroCalories,
  macroLine,
  parseNumber,
  percentFromGrams,
} from "@/utils/nutrition";

describe("parseNumber", () => {
  test("reads numbers with a dot or a comma", () => {
    expect(parseNumber("12.5")).toBe(12.5);
    expect(parseNumber("12,5")).toBe(12.5);
  });

  test("ignores spaces around the number", () => {
    expect(parseNumber("  7 ")).toBe(7);
  });

  test("gives null for empty or non-number text", () => {
    expect(parseNumber("")).toBeNull();
    expect(parseNumber("   ")).toBeNull();
    expect(parseNumber("abc")).toBeNull();
    expect(parseNumber("Infinity")).toBeNull();
  });
});

describe("caloriesFromMacros", () => {
  test("counts 4 kcal per gram of protein or carbs and 9 per gram of fat", () => {
    // 10 × 4 + 20 × 4 + 5 × 9 = 40 + 80 + 45
    expect(caloriesFromMacros(10, 20, 5)).toBe(165);
  });

  test("rounds to whole calories", () => {
    // 1.1 × 4 + 0 + 0.1 × 9 = 4.4 + 0.9 = 5.3
    expect(caloriesFromMacros(1.1, 0, 0.1)).toBe(5);
  });

  test("gives 0 when there are no macros", () => {
    expect(caloriesFromMacros(0, 0, 0)).toBe(0);
  });
});

describe("gramsFromPercent and percentFromGrams", () => {
  test("turn a percentage of the calories into grams", () => {
    // 2000 × 25% = 500 kcal of protein, ÷ 4 = 125 g
    expect(gramsFromPercent("protein", 25, 2000)).toBe(125);
    // 1500 × 35% = 525 kcal of fat, ÷ 9 ≈ 58.33 g
    expect(gramsFromPercent("fat", 35, 1500)).toBeCloseTo(58.33, 2);
  });

  test("turn grams into a percentage of the calories", () => {
    // 100 g × 4 = 400 kcal of 1500 ≈ 26.67%
    expect(percentFromGrams("protein", 100, 1500)).toBeCloseTo(26.67, 2);
  });

  test("give back the starting value when converted there and back", () => {
    const grams = gramsFromPercent("carbs", 40, 1800);
    expect(percentFromGrams("carbs", grams, 1800)).toBeCloseTo(40);
  });
});

describe("formatNumber", () => {
  test("rounds to whole numbers by default", () => {
    expect(formatNumber(58.333)).toBe("58");
    expect(formatNumber(2.5)).toBe("3");
  });

  test("keeps up to the given decimals and drops trailing zeros", () => {
    expect(formatNumber(26.666, 1)).toBe("26.7");
    expect(formatNumber(58.0, 1)).toBe("58");
  });
});

describe("macroLine", () => {
  test("lists the rounded macros with the language's short letters", () => {
    const letters = { proteinShort: "P", carbsShort: "C", fatShort: "F" };
    expect(macroLine({ protein: 47.4, carbs: 0, fat: 5.5 }, letters)).toBe("P 47 g · C 0 g · F 6 g");
  });
});

describe("macroCalories", () => {
  test("adds up the calories of the macro targets", () => {
    // 100 × 4 + 200 × 4 + 50 × 9 = 400 + 800 + 450
    expect(macroCalories({ protein: 100, carbs: 200, fat: 50 })).toBe(1650);
  });

  test("counts macros without a target as 0", () => {
    expect(macroCalories({ protein: 100, carbs: null, fat: null })).toBe(400);
    expect(macroCalories({ protein: null, carbs: null, fat: null })).toBe(0);
  });

  test("doesn't round", () => {
    // 58.33… g × 9 = 525 kcal, not 58 × 9 = 522
    expect(macroCalories({ protein: null, carbs: null, fat: 525 / 9 })).toBeCloseTo(525);
  });
});

describe("isOverGoal", () => {
  test("isn't over when the macros match or stay under the calories", () => {
    expect(isOverGoal(1650, 1650)).toBe(false);
    expect(isOverGoal(1500, 1650)).toBe(false);
  });

  test("allows up to half a calorie over, for rounding", () => {
    expect(isOverGoal(1650.5, 1650)).toBe(false);
    expect(isOverGoal(1650.6, 1650)).toBe(true);
  });

  test("isn't over for a 30/40/30 split typed as percentages", () => {
    // 30% protein + 40% carbs + 30% fat of 2000 kcal. The fat grams (66.66…) can't be stored
    // exactly, so the total lands a tiny bit off 2000, which the tolerance absorbs.
    const grams = {
      protein: gramsFromPercent("protein", 30, 2000),
      carbs: gramsFromPercent("carbs", 40, 2000),
      fat: gramsFromPercent("fat", 30, 2000),
    };
    expect(isOverGoal(macroCalories(grams), 2000)).toBe(false);
  });
});

describe("fillEmptyMacro", () => {
  test("fills grams with the calories left", () => {
    // 90 kcal ÷ 9 = 10 g of fat
    expect(fillEmptyMacro("fat", "g", 90, 1500)).toBe(10);
  });

  test("rounds grams down, so the total never goes over", () => {
    // 95 kcal ÷ 9 = 10.55… g, rounded down to 10
    expect(fillEmptyMacro("fat", "g", 95, 1500)).toBe(10);
  });

  test("fills a percentage with one decimal, rounded down", () => {
    // 90 kcal of 1500 = 6%
    expect(fillEmptyMacro("protein", "%", 90, 1500)).toBe(6);
    // 100 kcal of 1500 = 6.66…%, rounded down to 6.6
    expect(fillEmptyMacro("protein", "%", 100, 1500)).toBe(6.6);
  });
});
