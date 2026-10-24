import { router, Stack, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { HeaderButton } from "@/components/header-button";
import { Select } from "@/components/select";
import { colors, fontSize, spacing } from "@/constants/theme";
import { WEEKDAYS } from "@/constants/weekdays";
import { type Goal, getGoals, getWeekdayGoals, setWeekdayGoal, type WeekdayGoal } from "@/db/goals";
import { type Strings, useTranslation } from "@/i18n";
import { todayString } from "@/utils/date";

// The macro targets that are set, e.g. "P 180 g · F 70 g".
function macroSummary(goal: Goal, t: Strings) {
  const parts = [
    goal.protein !== null && `${t.macros.proteinShort} ${goal.protein} g`,
    goal.carbs !== null && `${t.macros.carbsShort} ${goal.carbs} g`,
    goal.fat !== null && `${t.macros.fatShort} ${goal.fat} g`,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : t.goals.caloriesOnly;
}

export default function Goals() {
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [weekdayGoals, setWeekdayGoals] = useState<WeekdayGoal[]>([]);

  const load = useCallback(() => {
    getGoals(db).then(setGoals);
    getWeekdayGoals(db).then(setWeekdayGoals);
  }, [db]);

  // Reload every time the screen comes into view, e.g. after adding or deleting a goal.
  useFocusEffect(load);

  // "none" clears the weekday's goal; the other keys are goal ids.
  const goalOptions = [
    { key: "none", label: t.goals.noGoal },
    ...goals.map((goal) => ({ key: String(goal.id), label: goal.name })),
  ];

  async function changeWeekday(weekday: number, key: string) {
    await setWeekdayGoal(db, weekday, key === "none" ? null : Number(key), todayString());
    load();
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.screen}>
      <Stack.Screen options={{ headerRight: () => <HeaderButton title={t.common.add} onPress={() => router.push("/goal-form")} /> }} />

      <Text style={styles.sectionTitle}>{t.goals.weeklyPlan}</Text>
      <Card style={styles.plan}>
        {goals.length === 0 ? (
          <Text style={styles.hint}>{t.goals.planHint}</Text>
        ) : (
          WEEKDAYS.map((weekday) => {
            const goalId = weekdayGoals.find((w) => w.weekday === weekday.number)?.goal_id;
            return (
              <View key={weekday.number} style={styles.planRow}>
                <Text style={styles.weekday}>{t.weekdays[weekday.number - 1]}</Text>
                <Select
                  title={t.weekdays[weekday.number - 1]}
                  options={goalOptions}
                  value={goalId === undefined ? null : String(goalId)}
                  onChange={(key) => changeWeekday(weekday.number, key)}
                  placeholder={t.goals.noGoal}
                  style={styles.flex}
                />
              </View>
            );
          })
        )}
      </Card>

      <Text style={styles.sectionTitle}>{t.goals.presets}</Text>
      {goals.length === 0 ? (
        <Text style={styles.hint}>{t.goals.empty}</Text>
      ) : (
        goals.map((goal) => (
          <Pressable key={goal.id} onPress={() => router.push({ pathname: "/goal-form", params: { id: goal.id } })}>
            <Card style={styles.goal}>
              <Text style={styles.name}>{goal.name}</Text>
              <View style={styles.nutrition}>
                <Text style={styles.calories}>{goal.calories} kcal</Text>
                <Text style={styles.macros}>{macroSummary(goal, t)}</Text>
              </View>
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  flex: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: fontSize.large,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.sm,
  },
  plan: {
    gap: spacing.sm,
  },
  planRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  weekday: {
    width: 96,
    fontSize: fontSize.medium,
    color: colors.text,
  },
  hint: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  goal: {
    gap: spacing.xs,
  },
  name: {
    fontSize: fontSize.medium,
    fontWeight: "600",
    color: colors.text,
  },
  nutrition: {
    flexDirection: "row",
    gap: spacing.md,
  },
  calories: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: colors.primaryText,
  },
  macros: {
    flexShrink: 1,
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
});
