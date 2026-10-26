import type { SQLiteDatabase } from "expo-sqlite";

import {
  addFoodEntry,
  addMealEntry,
  deleteFoodEntry,
  deleteMealEntry,
  foodEntryNutrition,
  getDayEntries,
  sumNutrition,
  updateFoodEntryQuantity,
} from "@/db/entries";
import { addFood, type Food, getFood } from "@/db/foods";
import { addMeal } from "@/db/meals";
import { openTestDb } from "@/db/test-db";

// Chicken breast: 165 kcal, 31 g protein, 0 g carbs, 3.6 g fat per 100 g.
const chicken: Omit<Food, "id"> = {
  name: "Chicken breast",
  brand: null,
  type: "poultry",
  reference_amount: 100,
  unit: "g",
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  barcode: null,
};
// Rice: 130 kcal, 2.7 g protein, 28 g carbs, 0.3 g fat per 100 g.
const rice: Omit<Food, "id"> = {
  name: "Rice",
  brand: null,
  type: "grains",
  reference_amount: 100,
  unit: "g",
  calories: 130,
  protein: 2.7,
  carbs: 28,
  fat: 0.3,
  barcode: null,
};

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

// Saves the "Lunch" and "Dinner" meal names and the chicken and rice foods.
async function setUp(db: SQLiteDatabase) {
  const lunch = { id: (await addMeal(db, "Lunch")).lastInsertRowId, name: "Lunch" };
  const dinner = { id: (await addMeal(db, "Dinner")).lastInsertRowId, name: "Dinner" };
  const savedChicken = (await getFood(db, (await addFood(db, chicken)).lastInsertRowId))!;
  const savedRice = (await getFood(db, (await addFood(db, rice)).lastInsertRowId))!;
  return { lunch, dinner, chicken: savedChicken, rice: savedRice };
}

// Saves a goal and makes it Monday's goal. Gives back its id.
async function setMondayGoal(db: SQLiteDatabase, name: string, calories: number) {
  const { lastInsertRowId: id } = await db.runAsync(
    "INSERT INTO goals (name, calories) VALUES (?, ?)",
    name,
    calories
  );
  await db.runAsync("INSERT OR REPLACE INTO weekday_goals (weekday, goal_id) VALUES (1, ?)", id);
  return id;
}

const monday = "2026-10-26";

describe("meal entries", () => {
  test("are saved with their foods and amounts", async () => {
    const db = await openTestDb();
    const { lunch, chicken, rice } = await setUp(db);

    await addMealEntry(db, monday, 1, lunch, [
      { food: chicken, quantity: 150 },
      { food: rice, quantity: 200 },
    ]);

    const [meal] = await getDayEntries(db, monday);
    expect(meal.meal_name).toBe("Lunch");
    expect(meal.foods.map((food) => [food.name, food.quantity])).toEqual([
      ["Chicken breast", 150],
      ["Rice", 200],
    ]);
  });

  test("can be saved without foods", async () => {
    const db = await openTestDb();
    const { lunch } = await setUp(db);
    await addMealEntry(db, monday, 1, lunch, []);
    expect(await getDayEntries(db, monday)).toEqual([expect.objectContaining({ meal_name: "Lunch", foods: [] })]);
  });

  test("are shown on their own day only, in the order they were added", async () => {
    const db = await openTestDb();
    const { lunch, dinner } = await setUp(db);
    await addMealEntry(db, monday, 1, dinner, []);
    await addMealEntry(db, monday, 1, lunch, []);
    await addMealEntry(db, "2026-10-27", 2, lunch, []);

    expect((await getDayEntries(db, monday)).map((meal) => meal.meal_name)).toEqual(["Dinner", "Lunch"]);
    expect((await getDayEntries(db, "2026-10-27")).map((meal) => meal.meal_name)).toEqual(["Lunch"]);
  });

  test("can get more foods later", async () => {
    const db = await openTestDb();
    const { lunch, chicken, rice } = await setUp(db);
    await addMealEntry(db, monday, 1, lunch, [{ food: chicken, quantity: 150 }]);
    const [meal] = await getDayEntries(db, monday);

    await addFoodEntry(db, meal.id, rice, 200);

    expect((await getDayEntries(db, monday))[0].foods.map((food) => food.name)).toEqual(["Chicken breast", "Rice"]);
  });

  test("change their totals when a food's amount changes", async () => {
    const db = await openTestDb();
    const { lunch, chicken, rice } = await setUp(db);
    await addMealEntry(db, monday, 1, lunch, [
      { food: chicken, quantity: 150 },
      { food: rice, quantity: 200 },
    ]);
    const chickenEntry = (await getDayEntries(db, monday))[0].foods[0];

    await updateFoodEntryQuantity(db, chickenEntry.id, 300);

    // 300 g chicken (495 kcal) + 200 g rice (260 kcal)
    const [meal] = await getDayEntries(db, monday);
    expect(sumNutrition(meal.foods).calories).toBeCloseTo(755);
  });

  test("keep their other foods when one is deleted", async () => {
    const db = await openTestDb();
    const { lunch, chicken, rice } = await setUp(db);
    await addMealEntry(db, monday, 1, lunch, [
      { food: chicken, quantity: 150 },
      { food: rice, quantity: 200 },
    ]);
    const chickenEntry = (await getDayEntries(db, monday))[0].foods[0];

    await deleteFoodEntry(db, chickenEntry.id);

    expect((await getDayEntries(db, monday))[0].foods.map((food) => food.name)).toEqual(["Rice"]);
  });

  test("take their foods with them when deleted", async () => {
    const db = await openTestDb();
    const { lunch, chicken } = await setUp(db);
    await addMealEntry(db, monday, 1, lunch, [{ food: chicken, quantity: 150 }]);
    const [meal] = await getDayEntries(db, monday);

    await deleteMealEntry(db, meal.id);

    expect(await getDayEntries(db, monday)).toEqual([]);
    expect(await db.getAllAsync("SELECT * FROM food_entries")).toEqual([]);
  });

  test("aren't saved at all if one of their foods fails", async () => {
    const db = await openTestDb();
    const { lunch, chicken } = await setUp(db);
    // A food without a name can't be saved, so the second food fails.
    const broken = { ...chicken, name: null as unknown as string };

    const adding = addMealEntry(db, monday, 1, lunch, [
      { food: chicken, quantity: 150 },
      { food: broken, quantity: 100 },
    ]);

    await expect(adding).rejects.toThrow("NOT NULL");
    expect(await getDayEntries(db, monday)).toEqual([]);
    expect(await db.getAllAsync("SELECT * FROM food_entries")).toEqual([]);
    expect(await db.getAllAsync("SELECT * FROM days")).toEqual([]);
  });
});

describe("a day's goal", () => {
  test("is copied from its weekday when the day gets its first meal", async () => {
    const db = await openTestDb();
    const { lunch } = await setUp(db);
    await setMondayGoal(db, "Cut", 1800);

    await addMealEntry(db, monday, 1, lunch, []);

    expect(await db.getFirstAsync("SELECT goal_name, goal_calories FROM days WHERE date = ?", monday)).toEqual({
      goal_name: "Cut",
      goal_calories: 1800,
    });
  });

  test("doesn't change when the day gets more meals", async () => {
    const db = await openTestDb();
    const { lunch, dinner } = await setUp(db);
    await setMondayGoal(db, "Cut", 1800);
    await addMealEntry(db, monday, 1, lunch, []);

    // Monday now uses another goal, but this day already has its copy.
    await setMondayGoal(db, "Bulk", 2800);
    await addMealEntry(db, monday, 1, dinner, []);

    expect(await db.getFirstAsync("SELECT goal_name FROM days WHERE date = ?", monday)).toEqual({ goal_name: "Cut" });
  });

  test("is empty when the weekday has no goal", async () => {
    const db = await openTestDb();
    const { lunch } = await setUp(db);
    await addMealEntry(db, monday, 1, lunch, []);
    expect(await db.getFirstAsync("SELECT goal_id, goal_name FROM days WHERE date = ?", monday)).toEqual({
      goal_id: null,
      goal_name: null,
    });
  });
});
