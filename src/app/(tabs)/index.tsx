import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { DaySummary } from "@/components/day-summary";
import { ConfirmDialog, Dialog } from "@/components/dialog";
import { FoodEntryDialog } from "@/components/food-entry-dialog";
import { FoodPicker } from "@/components/food-picker";
import { Icon } from "@/components/icon";
import { MealEntryCard } from "@/components/meal-entry-card";
import { colors, fontSize, spacing } from "@/constants/theme";
import { type DayGoal, getDayGoal } from "@/db/days";
import {
  addFoodEntry,
  deleteFoodEntry,
  deleteMealEntry,
  type FoodEntry,
  getDayEntries,
  type MealEntry,
  sumNutrition,
  updateFoodEntryQuantity,
} from "@/db/entries";
import type { Food } from "@/db/foods";
import { addDays, dayTitle, longDate, parseDateString, toDateString, todayString, weekdayOf } from "@/utils/date";

export default function Main() {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(todayString);
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [goal, setGoal] = useState<DayGoal | null>(null);
  // iOS shows the calendar inside our own dialog; Android opens the phone's calendar popup.
  const [showIosCalendar, setShowIosCalendar] = useState(false);
  // The meal cards only report taps; these say which meal or food the open picker or popup is for.
  const [pickingForMealId, setPickingForMealId] = useState<number | null>(null);
  const [editingFood, setEditingFood] = useState<FoodEntry | null>(null);
  const [deletingMeal, setDeletingMeal] = useState<MealEntry | null>(null);
  const today = todayString();

  const load = useCallback(() => {
    getDayEntries(db, date).then(setEntries);
    getDayGoal(db, date, weekdayOf(date)).then(setGoal);
  }, [db, date]);

  // Reload when the screen comes into view (e.g. after changing goals) and when the date changes.
  useFocusEffect(load);

  function openCalendar() {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: parseDateString(date),
        mode: "date",
        onChange: (event, picked) => {
          if (event.type === "set" && picked) setDate(toDateString(picked));
        },
      });
    } else {
      setShowIosCalendar(true);
    }
  }

  // Foods picked from a meal card are added right away at their reference amount; tap them to adjust.
  async function addFoodToMeal(food: Food) {
    if (pickingForMealId === null) return;
    await addFoodEntry(db, pickingForMealId, food, food.reference_amount);
    load();
  }

  async function saveFoodAmount(quantity: number) {
    if (!editingFood) return;
    await updateFoodEntryQuantity(db, editingFood.id, quantity);
    setEditingFood(null);
    load();
  }

  async function deleteFood() {
    if (!editingFood) return;
    await deleteFoodEntry(db, editingFood.id);
    setEditingFood(null);
    load();
  }

  async function deleteMeal() {
    if (!deletingMeal) return;
    await deleteMealEntry(db, deletingMeal.id);
    setDeletingMeal(null);
    load();
  }

  // Foods already in the meal the picker is open for, for its "✓ added" marks.
  const pickingFor = entries.find((entry) => entry.id === pickingForMealId);
  const pickedCounts: Record<number, number> = {};
  for (const food of pickingFor?.foods ?? []) {
    if (food.food_id !== null) pickedCounts[food.food_id] = (pickedCounts[food.food_id] ?? 0) + 1;
  }

  const foodCount = deletingMeal?.foods.length ?? 0;
  const deleteMealMessage =
    foodCount === 0 ? "This can't be undone." : `Its ${foodCount} ${foodCount === 1 ? "food" : "foods"} will be removed too.`;

  const goalName = goal ? ` · ${goal.name}` : "";
  const dayTotals = sumNutrition(entries.flatMap((entry) => entry.foods));

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => setDate(addDays(date, -1))} hitSlop={spacing.sm} accessibilityLabel="Previous day">
          <Icon name="chevronLeft" size={24} />
        </Pressable>

        {/* Tapping the title jumps back to today. */}
        <Pressable style={styles.title} onPress={() => setDate(today)} accessibilityLabel="Go to today">
          <Text style={styles.titleText}>{dayTitle(date, today)}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {longDate(date)}
            {goalName}
          </Text>
        </Pressable>

        <View style={styles.headerRight}>
          <Pressable onPress={openCalendar} hitSlop={spacing.sm} accessibilityLabel="Pick a date">
            <Icon name="calendar" size={22} color={colors.primaryText} />
          </Pressable>
          <Pressable onPress={() => setDate(addDays(date, 1))} hitSlop={spacing.sm} accessibilityLabel="Next day">
            <Icon name="chevronRight" size={24} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <DaySummary goal={goal} totals={dayTotals} />

        {entries.length === 0 ? (
          <Text style={styles.empty}>No meals yet</Text>
        ) : (
          entries.map((entry) => (
            <MealEntryCard
              key={entry.id}
              entry={entry}
              onAddFood={() => setPickingForMealId(entry.id)}
              onEditFood={setEditingFood}
              onDelete={() => setDeletingMeal(entry)}
            />
          ))
        )}

        <Button title="Add meal" onPress={() => router.push({ pathname: "/meal-entry-form", params: { date } })} />
      </ScrollView>

      <Dialog visible={showIosCalendar} title="Pick a date" onClose={() => setShowIosCalendar(false)}>
        <DateTimePicker
          value={parseDateString(date)}
          mode="date"
          display="inline"
          accentColor={colors.primary}
          onChange={(_event, picked) => {
            if (picked) setDate(toDateString(picked));
            setShowIosCalendar(false);
          }}
        />
      </Dialog>

      <FoodPicker
        visible={pickingForMealId !== null}
        onPick={addFoodToMeal}
        onClose={() => setPickingForMealId(null)}
        pickedCounts={pickedCounts}
      />

      {editingFood && (
        <FoodEntryDialog
          key={editingFood.id}
          entry={editingFood}
          onSave={saveFoodAmount}
          onDelete={deleteFood}
          onClose={() => setEditingFood(null)}
        />
      )}

      <ConfirmDialog
        visible={deletingMeal !== null}
        title={`Delete ${deletingMeal?.meal_name ?? ""}?`}
        message={deleteMealMessage}
        confirmTitle="Delete"
        onConfirm={deleteMeal}
        onCancel={() => setDeletingMeal(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    flex: 1,
    alignItems: "center",
  },
  titleText: {
    fontSize: fontSize.large,
    fontWeight: "600",
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  empty: {
    textAlign: "center",
    marginTop: spacing.lg,
    color: colors.textSecondary,
  },
});
