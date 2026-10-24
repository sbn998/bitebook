import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { FoodPicker } from "@/components/food-picker";
import { HeaderButton } from "@/components/header-button";
import { Icon } from "@/components/icon";
import { Select } from "@/components/select";
import { fieldStyles } from "@/components/text-field";
import { colors, fontSize, fonts, inputBox, radius, spacing } from "@/constants/theme";
import { addMealEntry, sumNutrition } from "@/db/entries";
import type { Food } from "@/db/foods";
import { getMeals, type Meal } from "@/db/meals";
import { unitName, useTranslation } from "@/i18n";
import { longDate, weekdayOf } from "@/utils/date";
import { formatNumber, parseNumber } from "@/utils/nutrition";

// A food added to the meal, with its amount as typed. `key` tells rows apart, since the same food can be added twice.
type Row = { key: number; food: Food; quantity: string };

export default function MealEntryForm() {
  const db = useSQLiteContext();
  const { t, locale } = useTranslation();
  // The day the meal is added to (YYYY-MM-DD), passed by the Main screen.
  const { date } = useLocalSearchParams<{ date: string }>();
  const [meals, setMeals] = useState<Meal[] | null>(null);
  const [mealId, setMealId] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [picking, setPicking] = useState(false);
  const nextKey = useRef(1);
  const headerHeight = useHeaderHeight();

  useEffect(() => {
    getMeals(db).then(setMeals);
  }, [db]);

  // Adds a food with its reference amount (e.g. 100 for "per 100 g") as the starting amount.
  function addFood(food: Food) {
    setRows((current) => [
      ...current,
      { key: nextKey.current++, food, quantity: formatNumber(food.reference_amount, 1) },
    ]);
  }

  function setQuantity(key: number, quantity: string) {
    setRows(rows.map((row) => (row.key === key ? { ...row, quantity } : row)));
  }

  function removeRow(key: number) {
    setRows(rows.filter((row) => row.key !== key));
  }

  // How many times each food has been added, for the "✓ added" marks in the picker.
  const pickedCounts: Record<number, number> = {};
  for (const row of rows) pickedCounts[row.food.id] = (pickedCounts[row.food.id] ?? 0) + 1;

  // The meal's total so far. Amounts that aren't valid numbers yet count as 0.
  const total = sumNutrition(rows.map((row) => ({ ...row.food, quantity: parseNumber(row.quantity) ?? 0 })));

  async function save() {
    const newErrors: Record<string, string> = {};
    const meal = meals?.find((m) => String(m.id) === mealId);
    if (!meal) newErrors.meal = t.mealForm.chooseMeal;

    const foods: { food: Food; quantity: number }[] = [];
    for (const row of rows) {
      const quantity = parseNumber(row.quantity);
      if (row.quantity.trim() === "") newErrors[row.key] = t.common.required;
      else if (quantity === null) newErrors[row.key] = t.common.validNumber;
      else if (quantity <= 0) newErrors[row.key] = t.common.moreThanZero;
      else foods.push({ food: row.food, quantity });
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || !meal) return;

    await addMealEntry(db, date, weekdayOf(date), meal, foods);
    router.back();
  }

  // Set from inside the screen, like the other forms.
  const title = <Stack.Screen options={{ title: t.mealForm.title }} />;

  // Wait for the meal labels to load.
  if (meals === null) return title;

  if (meals.length === 0) {
    return (
      <View style={[styles.screen, styles.form]}>
        {title}
        <Card style={styles.section}>
          <Text style={styles.hint}>{t.mealForm.needLabels}</Text>
          <Button title={t.mealForm.goToLabels} onPress={() => router.navigate("/settings/meals")} />
        </Card>
      </View>
    );
  }

  return (
    // Same keyboard handling as the food form: see the comment there.
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "android" ? "height" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      {title}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.form}
      >
        <Text style={styles.date}>{longDate(date, locale)}</Text>

        <Card style={styles.section}>
          <View style={fieldStyles.field}>
            <Text style={fieldStyles.label}>{t.mealForm.meal}</Text>
            <Select
              title={t.mealForm.meal}
              options={meals.map((meal) => ({ key: String(meal.id), label: meal.name }))}
              value={mealId}
              onChange={setMealId}
              placeholder={t.mealForm.chooseMeal}
              hasError={!!errors.meal}
            />
            {!!errors.meal && <Text style={fieldStyles.error}>{errors.meal}</Text>}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={fieldStyles.label}>{t.mealForm.foods}</Text>

          {rows.length === 0 && <Text style={styles.hint}>{t.mealForm.noFoods}</Text>}

          {rows.map((row) => (
            <View key={row.key} style={styles.rowWrapper}>
              <View style={styles.row}>
                <View style={styles.rowText}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {row.food.name}
                  </Text>
                  <Text style={styles.hint} numberOfLines={1}>
                    {t.foodPicker.kcalPer(
                      formatNumber(row.food.calories),
                      formatNumber(row.food.reference_amount, 1),
                      unitName(t, row.food.unit, row.food.reference_amount)
                    )}
                  </Text>
                </View>
                <TextInput
                  style={[styles.amount, !!errors[row.key] && styles.amountError]}
                  value={row.quantity}
                  onChangeText={(text) => setQuantity(row.key, text)}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                />
                <Text style={styles.unit} numberOfLines={1}>
                  {unitName(t, row.food.unit, parseNumber(row.quantity) ?? 0)}
                </Text>
                <Pressable onPress={() => removeRow(row.key)} hitSlop={spacing.sm} accessibilityLabel={t.mealForm.removeFood}>
                  <Icon name="close" color={colors.textMuted} />
                </Pressable>
              </View>
              {!!errors[row.key] && <Text style={fieldStyles.error}>{errors[row.key]}</Text>}
            </View>
          ))}

          <View style={styles.addFood}>
            <HeaderButton title={t.mealCard.addFood} onPress={() => setPicking(true)} />
          </View>
        </Card>

        <View style={styles.total}>
          <Text style={styles.totalLabel}>{t.mealForm.thisMeal}</Text>
          <Text style={styles.totalValues}>
            <Text style={styles.totalLabel}>{formatNumber(total.calories)} kcal</Text> · {t.macros.proteinShort}{" "}
            {formatNumber(total.protein)} · {t.macros.carbsShort} {formatNumber(total.carbs)} · {t.macros.fatShort}{" "}
            {formatNumber(total.fat)}
          </Text>
        </View>

        <Button title={t.mealForm.save} onPress={save} />
      </ScrollView>

      <FoodPicker visible={picking} onPick={addFood} onClose={() => setPicking(false)} pickedCounts={pickedCounts} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.md,
  },
  date: {
    fontSize: fontSize.body,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  hint: {
    fontSize: fontSize.small,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  rowWrapper: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  foodName: {
    fontSize: fontSize.body,
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  amount: {
    ...inputBox,
    width: 72,
    paddingVertical: 6,
    textAlign: "right",
    fontSize: fontSize.medium,
    fontFamily: fonts.body,
    color: colors.text,
  },
  amountError: {
    borderColor: colors.danger,
  },
  unit: {
    width: 44,
    fontSize: fontSize.small,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  addFood: {
    alignItems: "center",
    paddingTop: spacing.xs,
  },
  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.input,
    padding: spacing.md,
  },
  totalLabel: {
    fontSize: fontSize.body,
    fontFamily: fonts.bodyBold,
    color: colors.primaryText,
  },
  totalValues: {
    flexShrink: 1,
    fontSize: fontSize.body,
    fontFamily: fonts.body,
    color: colors.primaryText,
  },
});
