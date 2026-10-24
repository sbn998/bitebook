import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { Icon } from "@/components/icon";
import { unitLabel } from "@/constants/food";
import { colors, fontSize, spacing } from "@/constants/theme";
import { foodEntryNutrition, type MealEntry, type Nutrition, sumNutrition } from "@/db/entries";
import { formatNumber } from "@/utils/nutrition";

function macroLine(nutrition: Nutrition) {
  return `P ${formatNumber(nutrition.protein)} g · C ${formatNumber(nutrition.carbs)} g · F ${formatNumber(nutrition.fat)} g`;
}

// One meal on a day: its name, each food with its amount and calories, and the meal's totals at the bottom.
// Tapping the name row expands the card to also show each food's macros.
export function MealEntryCard({ entry }: { entry: MealEntry }) {
  const [expanded, setExpanded] = useState(false);
  const total = sumNutrition(entry.foods);
  const hasFoods = entry.foods.length > 0;

  return (
    <Card style={styles.card}>
      <Pressable
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        disabled={!hasFoods}
        accessibilityLabel={expanded ? "Hide food details" : "Show food details"}
      >
        <Text style={styles.name} numberOfLines={1}>
          {entry.meal_name}
        </Text>
        {hasFoods && <Icon name={expanded ? "chevronUp" : "chevronDown"} color={colors.textMuted} />}
      </Pressable>

      {!hasFoods ? (
        <Text style={styles.empty}>No foods yet</Text>
      ) : (
        entry.foods.map((food) => {
          const nutrition = foodEntryNutrition(food);
          return (
            <View key={food.id}>
              <View style={styles.food}>
                <Text style={styles.foodName} numberOfLines={1}>
                  {food.name}
                  <Text style={styles.secondary}>
                    {" "}
                    · {formatNumber(food.quantity, 1)} {unitLabel(food.unit)}
                  </Text>
                </Text>
                <Text style={styles.secondary}>{formatNumber(nutrition.calories)} kcal</Text>
              </View>
              {expanded && <Text style={styles.foodMacros}>{macroLine(nutrition)}</Text>}
            </View>
          );
        })
      )}

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
