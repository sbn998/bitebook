import { router } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, buttonRowStyles } from "@/components/button";
import { Card } from "@/components/card";
import { Dialog } from "@/components/dialog";
import { HeaderButton } from "@/components/header-button";
import { Icon } from "@/components/icon";
import { Select } from "@/components/select";
import { fontSize, fonts, radius, spacing, type Theme } from "@/constants/theme";
import { type ThemeSetting, useStyles, useTheme, useThemeSetting } from "@/hooks/use-theme";
import {
  type Backup,
  type BackupCounts,
  BackupError,
  countBackup,
  countCurrentData,
  parseBackup,
  restoreBackup,
} from "@/db/backup";
import { type Language, useTranslation } from "@/i18n";
import { pickBackupFile, shareBackup } from "@/utils/backup-file";

// A menu of settings sections, the app's language and theme, and exporting or importing the data.
export default function Settings() {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const db = useSQLiteContext();
  const { t, language, setLanguage } = useTranslation();
  const { themeSetting, setThemeSetting } = useThemeSetting();
  // A short result or error shown in a popup, e.g. "Your data was imported."
  const [message, setMessage] = useState<string | null>(null);
  // A checked file waiting for the user to confirm replacing everything with it.
  const [pendingImport, setPendingImport] = useState<{
    backup: Backup;
    file: BackupCounts;
    current: BackupCounts;
  } | null>(null);

  async function exportData() {
    try {
      await shareBackup(db, t.backup.shareTitle);
    } catch {
      setMessage(t.backup.exportFailed);
    }
  }

  // Picks a file and checks it. Nothing is changed until the user confirms.
  // Unexpected failures are also logged, so the real cause shows in the dev server's terminal.
  async function importData() {
    try {
      const text = await pickBackupFile();
      if (text === null) return;
      const backup = parseBackup(text);
      setPendingImport({ backup, file: countBackup(backup), current: await countCurrentData(db) });
    } catch (error) {
      if (error instanceof BackupError) setMessage(error.reason === "newer" ? t.backup.newerFile : t.backup.invalidFile);
      else {
        console.error("Import: reading the file failed", error);
        setMessage(t.backup.importFailed);
      }
    }
  }

  // Replaces everything in one transaction: if it fails, the data is left as it was.
  async function confirmImport() {
    if (!pendingImport) return;
    const { backup } = pendingImport;
    setPendingImport(null);
    try {
      await restoreBackup(db, backup);
      setMessage(t.backup.imported);
    } catch (error) {
      console.error("Import: replacing the data failed", error);
      setMessage(t.backup.importFailed);
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

  const themeOptions: { key: ThemeSetting; label: string }[] = [
    { key: "auto", label: t.themes.auto },
    { key: "light", label: t.themes.light },
    { key: "dark", label: t.themes.dark },
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.screen}>
      <Card style={styles.menu}>
        {sections.map((section) => (
          <Pressable accessibilityRole="button" key={section.href} style={styles.row} onPress={() => router.push(section.href)}>
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
            style={styles.select}
          />
        </View>
        <View style={styles.row}>
          <Text style={styles.rowText}>{t.settings.theme}</Text>
          <Select
            title={t.settings.theme}
            options={themeOptions}
            value={themeSetting}
            onChange={setThemeSetting}
            style={styles.select}
          />
        </View>
      </Card>

      <Text style={styles.sectionTitle}>{t.settings.yourData}</Text>
      <Card style={styles.menu}>
        <Pressable accessibilityRole="button" style={styles.row} onPress={exportData}>
          <Text style={styles.rowText}>{t.backup.export}</Text>
          <Icon name="chevronRight" color={colors.textMuted} />
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.row} onPress={importData}>
          <Text style={styles.rowText}>{t.backup.import}</Text>
          <Icon name="chevronRight" color={colors.textMuted} />
        </Pressable>
      </Card>

      <Dialog visible={pendingImport !== null} title={t.backup.replaceTitle} onClose={() => setPendingImport(null)}>
        {pendingImport && (
          <>
            <View style={styles.counts}>
              <Text style={styles.countsLabel}>{t.backup.yourDataNow}</Text>
              <Text style={styles.countsText}>{t.backup.summary(pendingImport.current)}</Text>
              <Text style={styles.countsLabel}>{t.backup.inTheFile}</Text>
              <Text style={styles.countsText}>{t.backup.summary(pendingImport.file)}</Text>
            </View>
            <Text style={styles.warning}>{t.backup.replaceWarning}</Text>
            <View style={styles.exportFirst}>
              <HeaderButton title={t.backup.exportFirst} onPress={exportData} />
            </View>
            <View style={buttonRowStyles.row}>
              <Button
                title={t.common.cancel}
                variant="secondary"
                onPress={() => setPendingImport(null)}
                style={buttonRowStyles.button}
              />
              <Button title={t.backup.replace} variant="danger" onPress={confirmImport} style={buttonRowStyles.button} />
            </View>
          </>
        )}
      </Dialog>

      <Dialog visible={message !== null} title={t.settings.yourData} onClose={() => setMessage(null)}>
        <Text style={styles.rowHint}>{message}</Text>
        <Button title={t.backup.ok} onPress={() => setMessage(null)} />
      </Dialog>
    </ScrollView>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
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
    fontFamily: fonts.body,
    color: colors.text,
  },
  rowHint: {
    fontSize: fontSize.body,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  counts: {
    backgroundColor: colors.background,
    borderRadius: radius.input,
    padding: spacing.md,
    gap: 2,
  },
  countsLabel: {
    fontSize: fontSize.small,
    fontFamily: fonts.bodyBold,
    color: colors.textSecondary,
  },
  countsText: {
    fontSize: fontSize.body,
    fontFamily: fonts.body,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  warning: {
    fontSize: fontSize.body,
    fontFamily: fonts.body,
    color: colors.danger,
  },
  exportFirst: {
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: fontSize.large,
    fontFamily: fonts.title,
    color: colors.text,
    marginBottom: -spacing.sm, // Sits close to its card
  },
  // Wide enough for "System default", and the same for every dropdown so they line up.
  select: {
    width: 180,
  },
});
