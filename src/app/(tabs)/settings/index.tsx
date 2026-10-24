import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { Card } from "@/components/card";
import { Icon } from "@/components/icon";
import { colors, fontSize, spacing } from "@/constants/theme";
import { type Goal, getGoals } from "@/db/goals";

// A menu of settings sections. Goals, import/export and language get their own rows later.
export default function Settings() {
  // TEMPORARY: lets the goal form be tested until the Goals screen exists (part C).
  const db = useSQLiteContext();
  const [goals, setGoals] = useState<Goal[]>([]);
  useFocusEffect(
    useCallback(() => {
      getGoals(db).then(setGoals);
    }, [db])
  );

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.screen}>
      <Card style={styles.menu}>
        <Pressable style={styles.row} onPress={() => router.push("/settings/meals")}>
          <Text style={styles.rowText}>Meal labels</Text>
          <Icon name="chevronRight" color={colors.textMuted} />
        </Pressable>
      </Card>

      {/* TEMPORARY: replaced by the Goals screen in part C. */}
      <Card style={styles.menu}>
        <Pressable style={styles.row} onPress={() => router.push("/goal-form")}>
          <Text style={styles.rowText}>Add goal (temporary)</Text>
          <Icon name="chevronRight" color={colors.textMuted} />
        </Pressable>
        {goals.map((goal) => (
          <Pressable
            key={goal.id}
            style={styles.row}
            onPress={() => router.push({ pathname: "/goal-form", params: { id: goal.id } })}
          >
            <Text style={styles.rowText}>
              {goal.name} · {goal.calories} kcal · P {goal.protein ?? "-"} · C {goal.carbs ?? "-"} · F{" "}
              {goal.fat ?? "-"}
            </Text>
            <Icon name="chevronRight" color={colors.textMuted} />
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  menu: {
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
  },
  rowText: {
    fontSize: fontSize.medium,
    color: colors.text,
  },
});
