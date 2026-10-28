import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, withTiming } from "react-native-reanimated";

import { makeCardStyles } from "@/components/card";
import { HeaderButton } from "@/components/header-button";
import { Icon } from "@/components/icon";
import { fontSize, fonts, spacing, type Theme } from "@/constants/theme";
import { useStyles, useTheme } from "@/hooks/use-theme";
import { type FoodEntry, foodEntryNutrition, type MealEntry, sumNutrition } from "@/db/entries";
import { unitName, useTranslation } from "@/i18n";
import { formatNumber, macroLine } from "@/utils/nutrition";

// How the card and its rows move when foods are added, removed or expanded.
const layout = LinearTransition.duration(250);

// One meal on a day: its name, each food with its amount and calories, and the meal's totals at the bottom.
// Tapping the name row expands the card to also show each food's macros.
// Foods fade in and out, and the card grows or shrinks smoothly around them.
// The card only reports taps (add a food, tap a food, delete the meal); the screen does the rest.
export function MealEntryCard({
  entry,
  onAddFood,
  onEditFood,
  onDelete,
}: {
  entry: MealEntry;
  onAddFood: () => void;
  onEditFood: (food: FoodEntry) => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const cardStyles = useStyles(makeCardStyles);
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const total = sumNutrition(entry.foods);
  const hasFoods = entry.foods.length > 0;

  // The arrow turns around instead of being swapped for another icon.
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: withTiming(expanded ? "180deg" : "0deg", { duration: 200 }) }],
  }));

  return (
    <Animated.View style={[cardStyles.card, styles.card]} layout={layout}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          style={styles.headerToggle}
          onPress={() => setExpanded(!expanded)}
          disabled={!hasFoods}
          accessibilityHint={expanded ? t.mealCard.hideDetails : t.mealCard.showDetails}
          accessibilityState={{ expanded, disabled: !hasFoods }}
        >
          <Text style={styles.name} numberOfLines={1}>
            {entry.meal_name}
          </Text>
          {hasFoods && (
            <Animated.View style={chevronStyle}>
              <Icon name="chevronDown" color={colors.textMuted} />
            </Animated.View>
          )}
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onDelete} hitSlop={spacing.sm} accessibilityLabel={t.common.deleteTitle(entry.meal_name)}>
          <Icon name="trash" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {!hasFoods && (
        <Animated.Text style={styles.empty} entering={FadeIn} exiting={FadeOut.duration(150)} layout={layout}>
          {t.mealCard.noFoods}
        </Animated.Text>
      )}

      {entry.foods.map((food) => {
        const nutrition = foodEntryNutrition(food);
        return (
          <Animated.View key={food.id} entering={FadeIn} exiting={FadeOut.duration(150)} layout={layout}>
            <Pressable accessibilityRole="button" onPress={() => onEditFood(food)} style={({ pressed }) => pressed && styles.pressed}>
              <View style={styles.food}>
                <Text style={styles.foodName} numberOfLines={1}>
                  {food.name}
                  <Text style={styles.amount}>
                    {" "}
                    · {formatNumber(food.quantity, 1)} {unitName(t, food.unit, food.quantity)}
                  </Text>
                </Text>
                <Text style={styles.foodKcal}>{formatNumber(nutrition.calories)} kcal</Text>
              </View>
              {expanded && (
                <Animated.Text style={styles.foodMacros} entering={FadeIn} exiting={FadeOut.duration(100)}>
                  {macroLine(nutrition, t.macros)}
                </Animated.Text>
              )}
            </Pressable>
          </Animated.View>
        );
      })}

      <Animated.View style={styles.addFood} layout={layout}>
        <HeaderButton title={t.mealCard.addFood} onPress={onAddFood} />
      </Animated.View>

      {hasFoods && (
        <Animated.View style={styles.totals} entering={FadeIn} exiting={FadeOut.duration(150)} layout={layout}>
          <Text style={styles.macros}>{macroLine(total, t.macros)}</Text>
          <Text style={styles.total}>{formatNumber(total.calories)} kcal</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  headerToggle: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontSize: fontSize.large,
    fontFamily: fonts.title,
    color: colors.text,
  },
  pressed: {
    opacity: 0.6,
  },
  food: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: spacing.sm,
  },
  foodName: {
    flexShrink: 1,
    fontSize: fontSize.body,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
  },
  amount: {
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  foodKcal: {
    fontSize: fontSize.medium,
    fontFamily: fonts.numberMedium,
    color: colors.textSecondary,
    fontVariant: ["tabular-nums"],
  },
  foodMacros: {
    fontSize: fontSize.small,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  empty: {
    fontSize: fontSize.body,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  addFood: {
    alignItems: "flex-start",
  },
  // A thin line separates the foods from the meal's totals, like on a receipt.
  totals: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  macros: {
    flexShrink: 1,
    fontSize: fontSize.small,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  total: {
    fontSize: fontSize.large,
    fontFamily: fonts.number,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
});
