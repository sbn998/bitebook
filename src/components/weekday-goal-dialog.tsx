import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Dialog } from "@/components/dialog";
import { HeaderButton } from "@/components/header-button";
import { colors, fontSize, fonts, radius, spacing } from "@/constants/theme";
import { type Goal, getGoals, getWeekdayGoals, setWeekdayGoal } from "@/db/goals";
import { useTranslation } from "@/i18n";
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
  const { t } = useTranslation();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentGoalId, setCurrentGoalId] = useState<number | null>(null);
  const weekday = weekdayOf(date);
  // e.g. "Saturdays" / "los sábados"
  const weekdayName = t.weekdaysPlural[weekday - 1];
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
    <Dialog visible={visible} title={t.weekdayGoal.title(weekdayName)} onClose={onClose}>
      <Text style={styles.note}>
        {isPast
          ? t.weekdayGoal.notePast(weekdayName)
          : t.weekdayGoal.noteFuture(weekdayName)}
      </Text>

      {goals.length === 0 ? (
        <Text style={styles.note}>{t.weekdayGoal.noGoals}</Text>
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
                  {goal.calories} kcal{isCurrent ? ` · ${t.weekdayGoal.current(weekdayName)}` : ""}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <View style={styles.actions}>
        <HeaderButton title={t.weekdayGoal.createGoal} onPress={createGoal} />
      </View>
      <Button title={t.common.cancel} variant="secondary" onPress={onClose} />
    </Dialog>
  );
}

const styles = StyleSheet.create({
  note: {
    fontSize: fontSize.body,
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyBold,
    color: colors.text,
  },
  goalDetails: {
    fontSize: fontSize.small,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  goalCurrentText: {
    color: colors.primaryText,
  },
  actions: {
    alignItems: "center",
  },
});
