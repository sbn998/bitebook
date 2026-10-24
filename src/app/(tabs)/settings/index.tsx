import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { Select } from "@/components/select";
import { colors, fontSize, spacing } from "@/constants/theme";
import { type Language, useTranslation } from "@/i18n";
import { shareBackup } from "@/utils/backup-file";

// A menu of settings sections, the app's language, and exporting the data.
export default function Settings() {
  const db = useSQLiteContext();
  const { t, language, setLanguage } = useTranslation();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function exportData() {
    try {
      await shareBackup(db, t.backup.shareTitle);
    } catch {
      setErrorMessage(t.backup.exportFailed);
    }
  }

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

      <Text style={styles.sectionTitle}>{t.settings.yourData}</Text>
      <Card style={styles.menu}>
        <Pressable style={styles.row} onPress={exportData}>
          <View style={styles.rowTextBlock}>
            <Text style={styles.rowText}>{t.backup.export}</Text>
            <Text style={styles.rowHint}>{t.backup.exportHint}</Text>
          </View>
          <Icon name="chevronRight" color={colors.textMuted} />
        </Pressable>
      </Card>

      <Dialog visible={errorMessage !== null} title={t.settings.yourData} onClose={() => setErrorMessage(null)}>
        <Text style={styles.rowHint}>{errorMessage}</Text>
        <Button title={t.backup.ok} onPress={() => setErrorMessage(null)} />
      </Dialog>
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
  rowTextBlock: {
    flex: 1,
    gap: 2,
  },
  rowHint: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  sectionTitle: {
    fontSize: fontSize.large,
    fontWeight: "600",
    color: colors.text,
    marginBottom: -spacing.sm, // Sits close to its card
  },
  languageSelect: {
    width: 150,
  },
});
