import type { SQLiteDatabase } from "expo-sqlite";

import { addMealEntry, getDayEntries } from "@/db/entries";
import { addFood, deleteFood, type Food, getFood, getFoods, updateFood } from "@/db/foods";
import { addMeal } from "@/db/meals";
import { openTestDb } from "@/db/test-db";

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

// Saves a food and gives it back with its id.
async function saveFood(db: SQLiteDatabase, food: Omit<Food, "id">) {
  const { lastInsertRowId } = await addFood(db, food);
  return (await getFood(db, lastInsertRowId))!;
}

// Logs 150 g of a food as breakfast on Monday 26 October 2026.
async function logBreakfast(db: SQLiteDatabase, food: Food) {
  const { lastInsertRowId: id } = await addMeal(db, "Breakfast");
  await addMealEntry(db, "2026-10-26", 1, { id, name: "Breakfast" }, [{ food, quantity: 150 }]);
}

describe("foods", () => {
  test("are saved with every value", async () => {
    const db = await openTestDb();
    const saved = await saveFood(db, { ...chicken, brand: "Mercadona" });
    expect(saved).toEqual({ id: 1, ...chicken, brand: "Mercadona" });
  });

  test("are listed A-Z, whatever the capital letters", async () => {
    const db = await openTestDb();
    await saveFood(db, { ...chicken, name: "banana" });
    await saveFood(db, { ...chicken, name: "Cheese" });
    await saveFood(db, { ...chicken, name: "Apple" });
    const names = (await getFoods(db)).map((food) => food.name);
    expect(names).toEqual(["Apple", "banana", "Cheese"]);
  });

  test("can be edited", async () => {
    const db = await openTestDb();
    const saved = await saveFood(db, chicken);
    await updateFood(db, saved.id, { ...chicken, name: "Grilled chicken", calories: 170 });
    expect(await getFood(db, saved.id)).toMatchObject({ name: "Grilled chicken", calories: 170 });
  });

  test("can have a barcode, kept as text with its leading zeros", async () => {
    const db = await openTestDb();
    const saved = await saveFood(db, { ...chicken, barcode: "0012345678905" });
    expect(saved.barcode).toBe("0012345678905");
  });

  test("can share a barcode, e.g. the same product per 100 g and per serving", async () => {
    const db = await openTestDb();
    await saveFood(db, { ...chicken, barcode: "8480000123456" });
    await saveFood(db, { ...chicken, reference_amount: 1, unit: "serving", calories: 250, barcode: "8480000123456" });
    await saveFood(db, chicken);
    const withBarcode = (await getFoods(db)).filter((food) => food.barcode === "8480000123456");
    expect(withBarcode.map((food) => food.unit)).toEqual(["g", "serving"]);
  });

  test("keep their barcode when edited", async () => {
    const db = await openTestDb();
    const saved = await saveFood(db, { ...chicken, barcode: "8480000123456" });
    const { barcode, id, ...details } = saved;
    await updateFood(db, id, { ...details, calories: 170 });
    expect(await getFood(db, id)).toMatchObject({ calories: 170, barcode });
  });

  test("can be deleted", async () => {
    const db = await openTestDb();
    const saved = await saveFood(db, chicken);
    await deleteFood(db, saved.id);
    expect(await getFoods(db)).toEqual([]);
  });
});

describe("logged entries", () => {
  test("keep their values when the food is edited", async () => {
    const db = await openTestDb();
    const saved = await saveFood(db, chicken);
    await logBreakfast(db, saved);

    await updateFood(db, saved.id, { ...chicken, name: "Grilled chicken", calories: 200 });

    const [entry] = (await getDayEntries(db, "2026-10-26"))[0].foods;
    expect(entry).toMatchObject({ food_id: saved.id, name: "Chicken breast", calories: 165, quantity: 150 });
  });

  test("keep their values, but lose the link, when the food is deleted", async () => {
    const db = await openTestDb();
    const saved = await saveFood(db, chicken);
    await logBreakfast(db, saved);

    await deleteFood(db, saved.id);

    const [entry] = (await getDayEntries(db, "2026-10-26"))[0].foods;
    expect(entry).toMatchObject({ food_id: null, name: "Chicken breast", calories: 165, quantity: 150 });
  });
});
