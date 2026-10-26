import { caloriesFromMacros } from "@/utils/nutrition";

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
