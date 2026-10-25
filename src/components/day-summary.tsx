import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { Card } from "@/components/card";
import { HeaderButton } from "@/components/header-button";
import { ProgressArc } from "@/components/progress-arc";
import { fontSize, fonts, radius, spacing, type Theme } from "@/constants/theme";
import { useStyles, useTheme } from "@/hooks/use-theme";
import type { DayGoal } from "@/db/days";
import type { Nutrition } from "@/db/entries";
import { useTranslation } from "@/i18n";
import { MACRO_FIELDS } from "@/utils/nutrition";

const DURATION = 900;
const EASING = Easing.out(Easing.cubic);
const ARC_WIDTH = 200;

// Whole numbers with the thousands separator of the app's language, e.g. 1,240 or 1.240.
function format(value: number, locale: string) {
  return Math.round(value).toLocaleString(locale);
}

// Returns a number that counts from its previous value to `target` over DURATION, slowing down at the end.
function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  const current = useRef(0);

  useEffect(() => {
    const from = current.current;
    const start = performance.now();
    let frame: number;
    const step = (now: number) => {
      const t = Math.min((now - start) / DURATION, 1);
      current.current = from + (target - from) * (1 - (1 - t) ** 3);
      setValue(current.current);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return value;
}

// A thin rounded bar that slides to `value / target`. It turns red when over the target.
function ProgressBar({ value, target }: { value: number; target: number }) {
  const styles = useStyles(makeStyles);
  const isOver = value > target;
  const filled = useSharedValue(0);

  useEffect(() => {
    filled.set(withTiming(Math.min(value / target, 1), { duration: DURATION, easing: EASING }));
  }, [filled, value, target]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${filled.get() * 100}%` }));

  return (
    <View style={styles.bar}>
      <Animated.View style={[styles.barFill, isOver && styles.barOver, fillStyle]} />
    </View>
  );
}

// The day's totals compared with its goal: a half-circle gauge for calories, with the kcal left
// under its top and the eaten/goal numbers at its ends, then a bar for each macro.
// It sits on a tinted card so it stands out from the meals below.
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
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const { t, locale } = useTranslation();
  const calories = useCountUp(totals.calories);
  const kcalLeft = goal ? goal.calories - calories : 0;
  const isOver = goal !== null && totals.calories > goal.calories;

  // The gauge gives a short "bump" when the day goes over its calorie goal.
  const pulse = useSharedValue(1);
  useEffect(() => {
    if (isOver) pulse.set(withSequence(withTiming(1.05, { duration: 160 }), withSpring(1)));
  }, [pulse, isOver]);
  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));

  return (
    <Card style={styles.card}>
      <Animated.View style={pulseStyle}>
        <ProgressArc
          progress={goal ? totals.calories / goal.calories : 0}
          width={ARC_WIDTH}
          strokeWidth={12}
          color={isOver ? colors.danger : colors.primary}
          trackColor={colors.heroTrack}
        >
          <Text style={[styles.bigNumber, isOver && styles.overText]}>
            {format(goal ? Math.abs(kcalLeft) : calories, locale)}
          </Text>
          <Text style={styles.label}>{goal ? (kcalLeft < 0 ? t.summary.kcalOver : t.summary.kcalLeft) : "kcal"}</Text>
        </ProgressArc>
      </Animated.View>

      {goal ? (
        <View style={styles.ends}>
          <View>
            <Text style={styles.label}>{t.summary.eaten}</Text>
            <Text style={styles.endNumber}>{format(calories, locale)}</Text>
          </View>
          <View style={styles.endRight}>
            <Text style={styles.label}>{t.summary.goal}</Text>
            <Text style={styles.endNumber}>{format(goal.calories, locale)}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noGoal}>
          <Text style={styles.label}>{t.summary.noGoal}</Text>
          <HeaderButton title={setGoalLabel} onPress={onSetGoal} />
        </View>
      )}

      <View style={styles.macros}>
        {MACRO_FIELDS.map(({ key }) => {
          const target = goal?.[key] ?? null;
          return (
            <View key={key} style={styles.macro}>
              <Text style={[styles.label, styles.centered]}>{t.macros[key]}</Text>
              <Text style={[styles.macroNumber, styles.centered, target !== null && totals[key] > target && styles.overText]}>
                {format(totals[key], locale)}
                <Text style={styles.macroTarget}>{target !== null ? ` / ${format(target, locale)} g` : " g"}</Text>
              </Text>
              {target !== null ? (
                <ProgressBar value={totals[key]} target={target} />
              ) : (
                goal && <Text style={[styles.noTarget, styles.centered]}>{t.summary.noTarget}</Text>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  card: {
    backgroundColor: colors.hero,
    borderWidth: 1,
    borderColor: colors.primaryTint,
    alignItems: "center",
    gap: spacing.md,
  },
  bigNumber: {
    fontFamily: fonts.number,
    fontSize: 44,
    lineHeight: 46,
    color: colors.text,
    fontVariant: ["tabular-nums"],
    includeFontPadding: false,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  overText: {
    color: colors.danger,
  },
  // Eaten and goal sit under the two ends of the gauge.
  ends: {
    width: ARC_WIDTH + spacing.xl,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -spacing.sm,
  },
  endRight: {
    alignItems: "flex-end",
  },
  endNumber: {
    fontFamily: fonts.numberMedium,
    fontSize: fontSize.large,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  noGoal: {
    alignItems: "center",
    gap: spacing.xs,
  },
  macros: {
    alignSelf: "stretch",
    flexDirection: "row",
    gap: spacing.lg,
  },
  macro: {
    flex: 1,
    gap: spacing.xs,
  },
  centered: {
    textAlign: "center",
  },
  macroNumber: {
    fontFamily: fonts.numberMedium,
    fontSize: fontSize.large,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  macroTarget: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  bar: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.heroTrack,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  barOver: {
    backgroundColor: colors.danger,
  },
  noTarget: {
    fontFamily: fonts.body,
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
});
