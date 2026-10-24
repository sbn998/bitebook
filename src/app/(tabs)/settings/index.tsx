import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";

import { Card } from "@/components/card";
import { Icon } from "@/components/icon";
import { colors, fontSize, spacing } from "@/constants/theme";

const SECTIONS = [
  { label: "Meal labels", href: "/settings/meals" },
  { label: "Your goals", href: "/settings/goals" },
] as const;

// A menu of settings sections. Import/export and language get their own rows later.
export default function Settings() {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.screen}>
      <Card style={styles.menu}>
        {SECTIONS.map((section) => (
          <Pressable key={section.href} style={styles.row} onPress={() => router.push(section.href)}>
            <Text style={styles.rowText}>{section.label}</Text>
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
