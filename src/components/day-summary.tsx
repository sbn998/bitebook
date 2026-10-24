import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { HeaderButton } from "@/components/header-button";
import { colors, fontSize, radius, spacing } from "@/constants/theme";
import type { DayGoal } from "@/db/days";
import type { Nutrition } from "@/db/entries";
import { useTranslation } from "@/i18n";
import { MACRO_FIELDS } from "@/utils/nutrition";

// Whole numbers with the phone's thousands separator, e.g. 1,240 or 1.240.
function format(value: number) {
  return Math.round(value).toLocaleString();
}

// A thin rounded bar filled up to `value / target`. It turns red when over the target.
function ProgressBar({ value, target, thin }: { value: number; target: number; thin?: boolean }) {
  const isOver = value > target;
  const filled = Math.min(value / target, 1) * 100;
  return (
    <View style={[styles.bar, thin && styles.barThin]}>
      <View style={[styles.barFill, isOver && styles.barOver, { width: `${filled}%` }]} />
    </View>
  );
}

// The day's totals compared with its goal: calories first, then each macro.
// Without a goal, it shows `setGoalLabel` (e.g. "Set a goal for Saturdays") as a link calling `onSetGoal`.
export function DaySummary({
  goal,
  totals,
  setGoalLabel,
  onSetGoal,
}: {
  goal: DayGoal | null;
  totals: Nutrition;
  setGoalLabel: string;
  onSetGoal: () => void;
}) {
  const { t } = useTranslation();
  const kcalLeft = goal ? goal.calories - totals.calories : 0;

  return (
    <Card style={styles.card}>
      <View style={styles.caloriesRow}>
        <Text style={styles.calories}>{format(totals.calories)}</Text>
        <Text style={[styles.secondary, goal && kcalLeft < 0 && styles.overText]}>
          {goal ? `of ${format(goal.calories)} kcal · ${format(Math.abs(kcalLeft))} ${kcalLeft < 0 ? "over" : "left"}` : "kcal"}
        </Text>
      </View>
      {goal ? (
        <ProgressBar value={totals.calories} target={goal.calories} />
      ) : (
        <View style={styles.noGoal}>
          <Text style={styles.secondary}>No goal for this day</Text>
          <HeaderButton title={setGoalLabel} onPress={onSetGoal} />
        </View>
      )}

      <View style={styles.macros}>
        {MACRO_FIELDS.map(({ key }) => {
          const target = goal?.[key] ?? null;
          return (
            <View key={key} style={styles.macro}>
              <View style={styles.macroRow}>
                <Text style={styles.macroName}>{t.macros[key]}</Text>
                <Text style={[styles.secondary, target !== null && totals[key] > target && styles.overText]}>
                  {target !== null ? `${format(totals[key])}/${format(target)} g` : `${format(totals[key])} g`}
                </Text>
              </View>
              {target !== null ? (
                <ProgressBar value={totals[key]} target={target} thin />
              ) : (
                goal && <Text style={styles.noTarget}>no target</Text>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  caloriesRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  calories: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.primaryText,
  },
  secondary: {
    flexShrink: 1,
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  overText: {
    color: colors.danger,
  },
  noGoal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  bar: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  barThin: {
    height: 5,
  },
  barFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  barOver: {
    backgroundColor: colors.danger,
  },
  macros: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  macro: {
    flex: 1,
    gap: spacing.xs,
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  macroName: {
    fontSize: fontSize.small,
    color: colors.text,
  },
  noTarget: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
});
