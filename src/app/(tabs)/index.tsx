import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown, FadeOut, LayoutAnimationConfig, LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/button";
import { CalendarDialog } from "@/components/calendar-dialog";
import { DaySummary } from "@/components/day-summary";
import { ConfirmDialog } from "@/components/dialog";
import { FoodEntryDialog } from "@/components/food-entry-dialog";
import { FoodPicker } from "@/components/food-picker";
import { Icon } from "@/components/icon";
import { MealEntryCard } from "@/components/meal-entry-card";
import { WeekdayGoalDialog } from "@/components/weekday-goal-dialog";
import { fontSize, fonts, spacing, type Theme } from "@/constants/theme";
import { useStyles, useTheme } from "@/hooks/use-theme";
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
import { useTranslation } from "@/i18n";
import { addDays, dayTitle, longDate, todayString, weekdayOf } from "@/utils/date";

export default function Main() {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const db = useSQLiteContext();
  const { t, locale } = useTranslation();
  const insets = useSafeAreaInsets();
  const [date, setDate] = useState(todayString);
  const [entries, setEntries] = useState<MealEntry[]>([]);
  // The date `entries` and `goal` belong to. It changes only once the new day has loaded, so the old day's
  // cards never animate in again while waiting, and the summary starts counting from 0 for the new day.
  const [entriesDate, setEntriesDate] = useState(date);
  const [goal, setGoal] = useState<DayGoal | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  // The meal cards only report taps; these say which meal or food the open picker or popup is for.
  const [pickingForMealId, setPickingForMealId] = useState<number | null>(null);
  const [editingFood, setEditingFood] = useState<FoodEntry | null>(null);
  const [deletingMeal, setDeletingMeal] = useState<MealEntry | null>(null);
  const [choosingGoal, setChoosingGoal] = useState(false);
  const today = todayString();

  const load = useCallback(() => {
    // Both are set together, so the summary never shows one day's goal with another day's totals.
    Promise.all([getDayEntries(db, date), getDayGoal(db, date, weekdayOf(date))]).then(([loadedEntries, loadedGoal]) => {
      setEntries(loadedEntries);
      setGoal(loadedGoal);
      setEntriesDate(date);
    });
  }, [db, date]);

  // Reload when the screen comes into view (e.g. after changing goals) and when the date changes.
  useFocusEffect(load);

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
  const deleteMealMessage = foodCount === 0 ? t.common.cantUndo : t.main.deleteMealFoods(foodCount);

  const goalName = goal ? ` · ${goal.name}` : "";
  const dayTotals = sumNutrition(entries.flatMap((entry) => entry.foods));

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => setDate(addDays(date, -1))} hitSlop={spacing.sm} accessibilityLabel={t.main.previousDay}>
          <Icon name="chevronLeft" size={24} />
        </Pressable>

        {/* Tapping the title jumps back to today. */}
        <Pressable style={styles.title} onPress={() => setDate(today)} accessibilityLabel={t.main.goToToday}>
          <Text style={styles.titleText}>{dayTitle(date, today, t.dates, locale)}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {longDate(date, locale)}
            {goalName}
          </Text>
        </Pressable>

        <View style={styles.headerRight}>
          <Pressable onPress={() => setShowCalendar(true)} hitSlop={spacing.sm} accessibilityLabel={t.main.pickDate}>
            <Icon name="calendar" size={22} color={colors.primaryText} />
          </Pressable>
          <Pressable onPress={() => setDate(addDays(date, 1))} hitSlop={spacing.sm} accessibilityLabel={t.main.nextDay}>
            <Icon name="chevronRight" size={24} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <DaySummary
          key={`summary-${entriesDate}`}
          goal={goal}
          totals={dayTotals}
          setGoalLabel={t.main.setGoalFor(t.weekdaysPlural[weekdayOf(date) - 1])}
          onSetGoal={() => setChoosingGoal(true)}
        />

        {/* A new day's meals slide in one after another, and the previous day's just disappear.
            Within a day, added meals slide in, deleted ones fade out, and the rest glide into place. */}
        <LayoutAnimationConfig key={entriesDate} skipExiting>
          <View style={styles.meals}>
            {entries.length === 0 ? (
              <Animated.Text style={styles.empty} entering={FadeInDown} exiting={FadeOut}>
                {t.main.noMeals}
              </Animated.Text>
            ) : (
              entries.map((entry, index) => (
                <Animated.View
                  key={entry.id}
                  entering={FadeInDown.delay(index * 60)}
                  exiting={FadeOut.duration(200)}
                  layout={LinearTransition}
                >
                  <MealEntryCard
                    entry={entry}
                    onAddFood={() => setPickingForMealId(entry.id)}
                    onEditFood={setEditingFood}
                    onDelete={() => setDeletingMeal(entry)}
                  />
                </Animated.View>
              ))
            )}
          </View>
        </LayoutAnimationConfig>

        <Animated.View layout={LinearTransition}>
          <Button title={t.main.addMeal} onPress={() => router.push({ pathname: "/meal-entry-form", params: { date } })} />
        </Animated.View>
      </ScrollView>

      {showCalendar && (
        <CalendarDialog
          date={date}
          today={today}
          onPick={(picked) => {
            setDate(picked);
            setShowCalendar(false);
          }}
          onClose={() => setShowCalendar(false)}
        />
      )}

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
        title={t.common.deleteTitle(deletingMeal?.meal_name ?? "")}
        message={deleteMealMessage}
        confirmTitle={t.common.delete}
        onConfirm={deleteMeal}
        onCancel={() => setDeletingMeal(null)}
      />

      <WeekdayGoalDialog
        visible={choosingGoal}
        date={date}
        today={today}
        onClose={() => setChoosingGoal(false)}
        onChanged={load}
      />
    </View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    flex: 1,
    alignItems: "center",
  },
  titleText: {
    fontSize: fontSize.title,
    fontFamily: fonts.title,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.small,
    fontFamily: fonts.body,
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
  meals: {
    gap: spacing.md,
  },
  empty: {
    textAlign: "center",
    marginTop: spacing.lg,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
});
