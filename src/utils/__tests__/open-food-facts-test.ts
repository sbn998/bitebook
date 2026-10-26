import { foodFromProduct, foodTypeFromCategories, lookUpBarcode } from "@/utils/open-food-facts";

// Real Open Food Facts answers, trimmed to the fields the app reads.
import cocaCola from "./fixtures/off-coca-cola.json";
import notFound from "./fixtures/off-not-found.json";
import nutella from "./fixtures/off-nutella.json";

// Replaces fetch with a fake that answers instantly with `body`, so tests don't need the internet.
function fakeAnswer(status: number, body: unknown) {
  return jest
    .spyOn(globalThis, "fetch")
    .mockResolvedValue({ ok: status >= 200 && status < 300, status, json: async () => body } as Response);
}

// Puts the real fetch back after each test.
afterEach(() => jest.restoreAllMocks());

describe("lookUpBarcode", () => {
  test("fills in a found product", async () => {
    fakeAnswer(200, nutella);
    expect(await lookUpBarcode("3017624010701")).toEqual({
      status: "found",
      food: {
        name: "Nutella",
        brand: "Ferrero",
        type: "sweets_snacks",
        unit: "g",
        protein: 6.3,
        carbs: 57.5,
        fat: 30.9,
      },
    });
  });

  test("uses ml for drinks", async () => {
    fakeAnswer(200, cocaCola);
    expect(await lookUpBarcode("5449000000996")).toMatchObject({
      status: "found",
      food: { name: "Coca-Cola Original", type: "drinks", unit: "ml", protein: 0, carbs: 10.6, fat: 0 },
    });
  });

  test("says when the product isn't in the database", async () => {
    fakeAnswer(404, notFound);
    expect(await lookUpBarcode("8480000123456")).toEqual({ status: "notFound" });
    // Some answers say "not found" with a normal 200 code.
    fakeAnswer(200, notFound);
    expect(await lookUpBarcode("8480000123456")).toEqual({ status: "notFound" });
  });

  test("says not found for an entry with nothing filled in", async () => {
    fakeAnswer(200, { status: 1, product: { categories_tags: [], nutriments: {} } });
    expect(await lookUpBarcode("8412345678905")).toEqual({ status: "notFound" });
  });

  test("still fills in a product that only has a name", async () => {
    fakeAnswer(200, { status: 1, product: { product_name: "Croissants" } });
    expect(await lookUpBarcode("8412345678905")).toMatchObject({ status: "found", food: { name: "Croissants" } });
  });

  test("fails when there's no internet", async () => {
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Network request failed"));
    expect(await lookUpBarcode("3017624010701")).toEqual({ status: "failed" });
  });

  test("fails when Open Food Facts is busy or down", async () => {
    fakeAnswer(503, "Service Unavailable");
    expect(await lookUpBarcode("3017624010701")).toEqual({ status: "failed" });
  });

  test("asks for the barcode and only the fields it needs, saying which app is asking", async () => {
    const fetch = fakeAnswer(200, nutella);
    await lookUpBarcode("3017624010701");
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe(
      "https://world.openfoodfacts.org/api/v2/product/3017624010701?fields=product_name,brands,categories_tags,nutriments"
    );
    expect(options?.headers).toEqual({
      "User-Agent": expect.stringMatching(/^Bitebook\/\S+ \(https:\/\/github\.com\/sbn998\/bitebook\)$/),
    });
  });
});

describe("foodFromProduct", () => {
  test("keeps only the first brand", () => {
    expect(foodFromProduct({ brands: "Hacendado, Mercadona" }).brand).toBe("Hacendado");
    expect(foodFromProduct({}).brand).toBeNull();
  });

  test("rounds values to 1 decimal", () => {
    expect(foodFromProduct({ nutriments: { proteins_100g: 3.33333, fat_100g: 0.05 } })).toMatchObject({
      protein: 3.3,
      fat: 0.1,
    });
  });

  test("leaves missing values empty instead of 0", () => {
    const food = foodFromProduct({ product_name: "Mystery bar", nutriments: { proteins_100g: 8, fat_100g: "" } });
    expect(food).toMatchObject({ protein: 8, carbs: null, fat: null });
  });

  test("reads numbers sent as text", () => {
    expect(foodFromProduct({ nutriments: { carbohydrates_100g: "12.5" } }).carbs).toBe(12.5);
  });

  test("gives an empty name when the product has none", () => {
    expect(foodFromProduct({}).name).toBe("");
  });

  test("gives plain water 0 macros when it only lists minerals", () => {
    // Like Cristaline: calcium, magnesium… but no calories or macros.
    const water = { categories_tags: ["en:beverages", "en:waters", "en:spring-waters"], nutriments: { calcium_100g: 0.113 } };
    expect(foodFromProduct(water)).toMatchObject({ type: "drinks", unit: "ml", protein: 0, carbs: 0, fat: 0 });
  });

  test("leaves flavored water empty, since it can have sugar", () => {
    const flavored = { categories_tags: ["en:beverages", "en:waters", "en:flavored-waters"], nutriments: {} };
    expect(foodFromProduct(flavored)).toMatchObject({ protein: null, carbs: null, fat: null });
  });

  test("keeps water's own values when it has them", () => {
    const water = { categories_tags: ["en:waters"], nutriments: { carbohydrates_100g: 0.2 } };
    expect(foodFromProduct(water)).toMatchObject({ protein: null, carbs: 0.2, fat: null });
  });
});

describe("foodTypeFromCategories", () => {
  test("picks the type of a clear category", () => {
    expect(foodTypeFromCategories(["en:meats", "en:beef"])).toBe("beef");
    expect(foodTypeFromCategories(["en:eggs-and-their-products", "en:eggs"])).toBe("eggs");
    expect(foodTypeFromCategories(["en:seafood", "en:crustaceans", "en:shrimps"])).toBe("seafood");
    expect(foodTypeFromCategories(["en:cereals-and-potatoes", "en:cereals-and-their-products", "en:rices"])).toBe(
      "grains"
    );
  });

  test("leaves the type empty when nothing clearly matches", () => {
    expect(foodTypeFromCategories([])).toBeNull();
    expect(foodTypeFromCategories(["en:meats"])).toBeNull(); // Could be beef, pork or lamb
  });

  test("settles foods that are in several categories", () => {
    expect(foodTypeFromCategories(["en:meals", "en:poultries"])).toBe("prepared"); // Chicken curry
    expect(foodTypeFromCategories(["en:seafood", "en:fishes"])).toBe("fish"); // Tuna
    expect(foodTypeFromCategories(["en:dairies", "en:fats", "en:butters"])).toBe("fats_oils"); // Butter
    expect(foodTypeFromCategories(["en:beverages", "en:dairies", "en:milks"])).toBe("dairy"); // Milk
    expect(foodTypeFromCategories(["en:fruits", "en:beverages", "en:fruit-juices"])).toBe("drinks"); // Juice
    expect(foodTypeFromCategories(["en:salty-snacks", "en:nuts"])).toBe("nuts_seeds"); // Salted peanuts
  });
});
