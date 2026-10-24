import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Dialog } from "@/components/dialog";
import { HeaderButton } from "@/components/header-button";
import { colors, fontSize, radius, spacing } from "@/constants/theme";
import { weekdayLabel } from "@/constants/weekdays";
import { type Goal, getGoals, getWeekdayGoals, setWeekdayGoal } from "@/db/goals";
import { weekdayOf } from "@/utils/date";

// The popup behind "Set a goal for Saturdays" on a day without a goal: pick an existing goal or create one.
// It becomes the weekday's goal from today on; on a past day, that day gets it too (see setWeekdayGoal).
export function WeekdayGoalDialog({
  visible,
  date,
  today,
  onClose,
  onChanged,
}: {
  visible: boolean;
  date: string;
  today: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const db = useSQLiteContext();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentGoalId, setCurrentGoalId] = useState<number | null>(null);
  const weekday = weekdayOf(date);
  const weekdayName = `${weekdayLabel(weekday)}s`;
  const isPast = date < today;
  // Only a past day needs filling in; today and future days follow the weekday anyway.
  const fillDay = isPast ? date : undefined;

  useEffect(() => {
    if (!visible) return;
    getGoals(db).then(setGoals);
    getWeekdayGoals(db).then((weekdayGoals) =>
      setCurrentGoalId(weekdayGoals.find((w) => w.weekday === weekday)?.goal_id ?? null)
    );
  }, [db, visible, weekday]);

  async function pick(goal: Goal) {
    await setWeekdayGoal(db, weekday, goal.id, today, fillDay);
    onClose();
    onChanged();
  }

  // The goal form assigns the new goal to the weekday (and fills the day) after saving.
  function createGoal() {
    onClose();
    router.push({
      pathname: "/goal-form",
      params: fillDay ? { assignWeekday: weekday, fillDay } : { assignWeekday: weekday },
    });
  }

  return (
    <Dialog visible={visible} title={`Goal for ${weekdayName}`} onClose={onClose}>
      <Text style={styles.note}>
        {isPast
          ? `This will be the goal for this day, and for every ${weekdayLabel(weekday)} from today on.`
          : `This will be the goal for every ${weekdayLabel(weekday)} from today on.`}
      </Text>

      {goals.length === 0 ? (
        <Text style={styles.note}>No goals yet.</Text>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {goals.map((goal) => {
            const isCurrent = goal.id === currentGoalId;
            return (
              <Pressable key={goal.id} style={[styles.goal, isCurrent && styles.goalCurrent]} onPress={() => pick(goal)}>
                <Text style={[styles.goalName, isCurrent && styles.goalCurrentText]} numberOfLines={1}>
                  {goal.name}
                </Text>
                <Text style={[styles.goalDetails, isCurrent && styles.goalCurrentText]}>
                  {goal.calories} kcal{isCurrent ? ` · current for ${weekdayName}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <HeaderButton title="+ Create a new goal" onPress={createGoal} />
      </View>
      <Button title="Cancel" variant="secondary" onPress={onClose} />
    </Dialog>
  );
}

const styles = StyleSheet.create({
  note: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  list: {
    maxHeight: 280,
  },
  listContent: {
    gap: spacing.xs,
  },
  goal: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.input,
    padding: spacing.md,
    gap: 2,
  },
  goalCurrent: {
    backgroundColor: colors.primaryTint,
    borderColor: colors.primaryTint,
  },
  goalName: {
    fontSize: fontSize.medium,
    fontWeight: "600",
    color: colors.text,
  },
  goalDetails: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  goalCurrentText: {
    color: colors.primaryText,
  },
  actions: {
    alignItems: "center",
  },
});
