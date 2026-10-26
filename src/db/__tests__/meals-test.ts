import { addMealEntry, getDayEntries } from "@/db/entries";
import { addMeal, deleteMeal, getMeals, renameMeal } from "@/db/meals";
import { openTestDb } from "@/db/test-db";

describe("meal names", () => {
  test("are listed in the order they were added", async () => {
    const db = await openTestDb();
    await addMeal(db, "Lunch");
    await addMeal(db, "Breakfast");
    await addMeal(db, "Dinner");
    expect((await getMeals(db)).map((meal) => meal.name)).toEqual(["Lunch", "Breakfast", "Dinner"]);
  });

  test("can't be used twice, whatever the capital letters", async () => {
    const db = await openTestDb();
    await addMeal(db, "Lunch");
    await expect(addMeal(db, "lunch")).rejects.toThrow("UNIQUE");
  });

  test("can be renamed and deleted", async () => {
    const db = await openTestDb();
    const { lastInsertRowId: lunchId } = await addMeal(db, "Lunch");
    const { lastInsertRowId: dinnerId } = await addMeal(db, "Dinner");
    await renameMeal(db, lunchId, "Late lunch");
    await deleteMeal(db, dinnerId);
    expect(await getMeals(db)).toEqual([{ id: lunchId, name: "Late lunch" }]);
  });
});

describe("meal entries", () => {
  test("keep the old name when their meal is renamed", async () => {
    const db = await openTestDb();
    const { lastInsertRowId: id } = await addMeal(db, "Lunch");
    await addMealEntry(db, "2026-10-26", 1, { id, name: "Lunch" }, []);

    await renameMeal(db, id, "Late lunch");

    expect((await getDayEntries(db, "2026-10-26"))[0]).toMatchObject({ meal_id: id, meal_name: "Lunch" });
  });

  test("keep the name, but lose the link, when their meal is deleted", async () => {
    const db = await openTestDb();
    const { lastInsertRowId: id } = await addMeal(db, "Lunch");
    await addMealEntry(db, "2026-10-26", 1, { id, name: "Lunch" }, []);

    await deleteMeal(db, id);

    expect((await getDayEntries(db, "2026-10-26"))[0]).toMatchObject({ meal_id: null, meal_name: "Lunch" });
  });
});
