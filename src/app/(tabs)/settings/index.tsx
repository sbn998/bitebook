import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/card";
import { Icon } from "@/components/icon";
import { Select } from "@/components/select";
import { colors, fontSize, spacing } from "@/constants/theme";
import { type Language, useTranslation } from "@/i18n";

// A menu of settings sections, plus the app's language. Import/export gets its own row later.
export default function Settings() {
  const { t, language, setLanguage } = useTranslation();

  const sections = [
    { label: t.settings.mealLabels, href: "/settings/meals" },
    { label: t.settings.yourGoals, href: "/settings/goals" },
  ] as const;

  const languageOptions: { key: Language; label: string }[] = [
    { key: "en", label: t.languages.en },
    { key: "es", label: t.languages.es },
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.screen}>
      <Card style={styles.menu}>
        {sections.map((section) => (
          <Pressable key={section.href} style={styles.row} onPress={() => router.push(section.href)}>
            <Text style={styles.rowText}>{section.label}</Text>
            <Icon name="chevronRight" color={colors.textMuted} />
          </Pressable>
        ))}
      </Card>

      <Card style={styles.menu}>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t.settings.language}</Text>
          <Select
            title={t.settings.language}
            options={languageOptions}
            value={language}
            onChange={setLanguage}
            style={styles.languageSelect}
          />
        </View>
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
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowText: {
    fontSize: fontSize.medium,
    color: colors.text,
  },
  languageSelect: {
    width: 150,
  },
});
