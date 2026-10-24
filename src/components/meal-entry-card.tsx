import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { HeaderButton } from "@/components/header-button";
import { Icon } from "@/components/icon";
import { colors, fontSize, spacing } from "@/constants/theme";
import { type FoodEntry, foodEntryNutrition, type MealEntry, sumNutrition } from "@/db/entries";
import { unitName, useTranslation } from "@/i18n";
import { formatNumber, macroLine } from "@/utils/nutrition";

// One meal on a day: its name, each food with its amount and calories, and the meal's totals at the bottom.
// Tapping the name row expands the card to also show each food's macros.
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
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const total = sumNutrition(entry.foods);
  const hasFoods = entry.foods.length > 0;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={styles.headerToggle}
          onPress={() => setExpanded(!expanded)}
          disabled={!hasFoods}
          accessibilityLabel={expanded ? "Hide food details" : "Show food details"}
        >
          <Text style={styles.name} numberOfLines={1}>
            {entry.meal_name}
          </Text>
          {hasFoods && <Icon name={expanded ? "chevronUp" : "chevronDown"} color={colors.textMuted} />}
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={spacing.sm} accessibilityLabel={`Delete ${entry.meal_name}`}>
          <Icon name="trash" size={18} color={colors.textMuted} />
        </Pressable>
      </View>

      {!hasFoods && <Text style={styles.empty}>No foods yet</Text>}

      {entry.foods.map((food) => {
        const nutrition = foodEntryNutrition(food);
        return (
          <Pressable key={food.id} onPress={() => onEditFood(food)} style={({ pressed }) => pressed && styles.pressed}>
            <View style={styles.food}>
              <Text style={styles.foodName} numberOfLines={1}>
                {food.name}
                <Text style={styles.secondary}>
                  {" "}
                  · {formatNumber(food.quantity, 1)} {unitName(t, food.unit, food.quantity)}
                </Text>
              </Text>
              <Text style={styles.secondary}>{formatNumber(nutrition.calories)} kcal</Text>
            </View>
            {expanded && <Text style={styles.foodMacros}>{macroLine(nutrition)}</Text>}
          </Pressable>
        );
      })}

      <View style={styles.addFood}>
        <HeaderButton title="+ Add food" onPress={onAddFood} />
      </View>

      {hasFoods && (
        <View style={styles.totals}>
          <Text style={styles.macros}>{macroLine(total)}</Text>
          <Text style={styles.total}>{formatNumber(total.calories)} kcal</Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
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
    fontSize: fontSize.medium,
    fontWeight: "600",
    color: colors.text,
  },
  pressed: {
    opacity: 0.6,
  },
  food: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  foodName: {
    flexShrink: 1,
    fontSize: fontSize.body,
    color: colors.text,
  },
  foodMacros: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  secondary: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  empty: {
    fontSize: fontSize.body,
    color: colors.textMuted,
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
    color: colors.textSecondary,
  },
  total: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: colors.primaryText,
  },
});
