import { foodEntryNutrition, sumNutrition } from "@/db/entries";

// Chicken breast: 165 kcal, 31 g protein, 0 g carbs, 3.6 g fat per 100 g.
const chicken = { reference_amount: 100, calories: 165, protein: 31, carbs: 0, fat: 3.6 };
// Rice: 130 kcal, 2.7 g protein, 28 g carbs, 0.3 g fat per 100 g.
const rice = { reference_amount: 100, calories: 130, protein: 2.7, carbs: 28, fat: 0.3 };

describe("foodEntryNutrition", () => {
  test("scales the values from the reference amount to the amount eaten", () => {
    // 150 g of chicken = 1.5 × the values per 100 g
    const nutrition = foodEntryNutrition({ ...chicken, quantity: 150 });
    expect(nutrition.calories).toBeCloseTo(247.5);
    expect(nutrition.protein).toBeCloseTo(46.5);
    expect(nutrition.carbs).toBe(0);
    expect(nutrition.fat).toBeCloseTo(5.4);
  });

  test("works with a reference amount of one serving", () => {
    // 2 servings of a yoghurt with 90 kcal per serving
    const yoghurt = { reference_amount: 1, calories: 90, protein: 10, carbs: 4, fat: 3 };
    expect(foodEntryNutrition({ ...yoghurt, quantity: 2 }).calories).toBe(180);
  });
});

describe("sumNutrition", () => {
  test("adds up several food entries, like a meal", () => {
    // 150 g chicken (247.5 kcal) + 200 g rice (260 kcal)
    const total = sumNutrition([
      { ...chicken, quantity: 150 },
      { ...rice, quantity: 200 },
    ]);
    expect(total.calories).toBeCloseTo(507.5);
    expect(total.protein).toBeCloseTo(46.5 + 5.4);
    expect(total.carbs).toBeCloseTo(56);
    expect(total.fat).toBeCloseTo(5.4 + 0.6);
  });

  test("gives zeros for a meal without foods", () => {
    expect(sumNutrition([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});
