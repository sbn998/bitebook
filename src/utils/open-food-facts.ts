// Looks up a scanned barcode on Open Food Facts (world.openfoodfacts.org), a free food database.
// Its data is under the Open Database License, which asks apps to credit it as the source.
import Constants from "expo-constants";

import type { FoodType } from "@/constants/food";

// What a scanned product fills in. Values are per 100 g (or 100 ml for drinks); a value missing
// from Open Food Facts is null, not 0. Calories are left out: the form calculates them from the macros.
export type ScannedFood = {
  name: string;
  brand: string | null;
  type: FoodType | null;
  unit: "g" | "ml";
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

// "failed" = no internet, or Open Food Facts is down or busy: the user can try again.
export type LookupResult = { status: "found"; food: ScannedFood } | { status: "notFound" } | { status: "failed" };

// The parts of an Open Food Facts product the app reads.
export type Product = {
  product_name?: string;
  brands?: string;
  categories_tags?: string[];
  nutriments?: Record<string, number | string>;
};

// Open Food Facts category → our food type, checked from top to bottom: the first match wins.
// The order settles foods in several categories, e.g. a chicken curry is a prepared meal,
// butter is a fat, milk is dairy, and orange juice is a drink.
const TYPE_RULES: [FoodType, string[]][] = [
  ["prepared", ["en:meals"]],
  ["poultry", ["en:poultries", "en:chickens"]],
  ["beef", ["en:beef"]],
  ["pork", ["en:pork"]],
  ["lamb", ["en:lamb-meat", "en:sheep-meat"]],
  ["fish", ["en:fishes"]],
  ["seafood", ["en:seafood"]],
  ["eggs", ["en:eggs"]],
  ["fats_oils", ["en:fats", "en:vegetable-oils", "en:olive-oils"]],
  ["dairy", ["en:dairies"]],
  ["drinks", ["en:beverages"]],
  ["sauces", ["en:sauces", "en:condiments"]],
  ["legumes", ["en:legumes", "en:pulses"]],
  ["nuts_seeds", ["en:nuts"]],
  [
    "sweets_snacks",
    ["en:sweet-snacks", "en:salty-snacks", "en:snacks", "en:confectioneries", "en:chocolates", "en:biscuits-and-cakes", "en:sweet-spreads"],
  ],
  ["grains", ["en:cereals-and-their-products", "en:breads", "en:pastas", "en:rices"]],
  ["fruit", ["en:fruits"]],
  ["vegetables", ["en:vegetables"]],
];

export function foodTypeFromCategories(categories: string[]): FoodType | null {
  const rule = TYPE_RULES.find(([, tags]) => tags.some((tag) => categories.includes(tag)));
  return rule ? rule[0] : null;
}

// A nutrient per 100 g, rounded to 1 decimal, or null if Open Food Facts doesn't have it.
function per100g(product: Product, nutrient: string) {
  const value = product.nutriments?.[`${nutrient}_100g`];
  // Number("") would be 0, so an empty value has to be caught first.
  if (value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number * 10) / 10 : null;
}

export function foodFromProduct(product: Product): ScannedFood {
  const categories = product.categories_tags ?? [];
  // "Hacendado, Mercadona" → "Hacendado"
  const brand = product.brands?.split(",")[0].trim();
  return {
    name: product.product_name?.trim() ?? "",
    brand: brand || null,
    type: foodTypeFromCategories(categories),
    unit: categories.includes("en:beverages") ? "ml" : "g",
    protein: per100g(product, "proteins"),
    carbs: per100g(product, "carbohydrates"),
    fat: per100g(product, "fat"),
  };
}

// Open Food Facts asks apps to say who they are: name/version (contact).
const USER_AGENT = `Bitebook/${Constants.expoConfig?.version ?? "unknown"} (https://github.com/sbn998/bitebook)`;
const FIELDS = "product_name,brands,categories_tags,nutriments";

export async function lookUpBarcode(barcode: string): Promise<LookupResult> {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}?fields=${FIELDS}`;
  try {
    const response = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (response.status === 404) return { status: "notFound" };
    if (!response.ok) return { status: "failed" };
    const body: { status?: number; product?: Product } = await response.json();
    if (body.status !== 1 || !body.product) return { status: "notFound" };
    return { status: "found", food: foodFromProduct(body.product) };
  } catch {
    // fetch fails like this without internet.
    return { status: "failed" };
  }
}
