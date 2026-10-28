import { Stack } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Button, buttonRowStyles } from "@/components/button";
import { Card } from "@/components/card";
import { ConfirmBody, Dialog } from "@/components/dialog";
import { HeaderButton } from "@/components/header-button";
import { TextField } from "@/components/text-field";
import { fontSize, fonts, spacing, type Theme } from "@/constants/theme";
import { useBackToTopOnTabChange } from "@/hooks/use-back-to-top-on-tab-change";
import { useStyles } from "@/hooks/use-theme";
import { addMeal, deleteMeal, getMeals, type Meal, renameMeal } from "@/db/meals";
import { useTranslation } from "@/i18n";

export default function MealLabels() {
  const styles = useStyles(makeStyles);
  useBackToTopOnTabChange();
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const [meals, setMeals] = useState<Meal[]>([]);
  // Which dialog is open: null = closed, "new" = adding, a Meal = renaming that meal.
  const [editing, setEditing] = useState<Meal | "new" | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  // When true, the open dialog asks "Delete …?" instead of showing the name field.
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const load = useCallback(() => {
    getMeals(db).then(setMeals);
  }, [db]);

  useEffect(load, [load]);

  function openDialog(meal: Meal | "new") {
    setEditing(meal);
    setName(meal === "new" ? "" : meal.name);
    setError("");
    setConfirmingDelete(false);
  }

  function closeDialog() {
    setEditing(null);
  }

  async function save() {
    const trimmed = name.trim();
    if (trimmed === "") {
      setError(t.common.required);
      return;
    }
    // The database also rejects duplicates; checking here lets us show a clear message.
    const duplicate = meals.some(
      (meal) => meal !== editing && meal.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase()
    );
    if (duplicate) {
      setError(t.meals.duplicate);
      return;
    }

    if (editing === "new") await addMeal(db, trimmed);
    else if (editing) await renameMeal(db, editing.id, trimmed);
    closeDialog();
    load();
  }

  async function deleteEditing() {
    if (editing === null || editing === "new") return;
    await deleteMeal(db, editing.id);
    closeDialog();
    load();
  }

  const isEditingMeal = editing !== null && editing !== "new";
  let dialogTitle = editing === "new" ? t.meals.addTitle : t.meals.editTitle;
  if (isEditingMeal && confirmingDelete) dialogTitle = t.common.deleteTitle(editing.name);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerRight: () => <HeaderButton title={t.common.add} onPress={() => openDialog("new")} /> }} />

      <FlatList
        data={meals}
        keyExtractor={(meal) => String(meal.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>{t.meals.emptyTitle}</Text>
          </View>
        }
        renderItem={({ item: meal }) => (
          <Pressable accessibilityRole="button" onPress={() => openDialog(meal)}>
            <Card>
              <Text style={styles.name}>{meal.name}</Text>
            </Card>
          </Pressable>
        )}
      />

      <Dialog visible={editing !== null} title={dialogTitle} onClose={closeDialog}>
        {confirmingDelete ? (
          <ConfirmBody
            message={t.meals.deleteMessage}
            confirmTitle={t.common.delete}
            onConfirm={deleteEditing}
            onCancel={() => setConfirmingDelete(false)}
          />
        ) : (
          <>
            <TextField
              label={t.common.name}
              value={name}
              onChangeText={(text) => {
                setName(text);
                setError("");
              }}
              error={error}
              autoFocus
              onSubmitEditing={save}
            />
            <View style={buttonRowStyles.row}>
              <Button title={t.common.cancel} variant="secondary" onPress={closeDialog} style={buttonRowStyles.button} />
              {isEditingMeal && (
                <Button
                  title={t.common.delete}
                  variant="danger"
                  onPress={() => setConfirmingDelete(true)}
                  style={buttonRowStyles.button}
                />
              )}
              <Button title={t.common.save} onPress={save} style={buttonRowStyles.button} />
            </View>
          </>
        )}
      </Dialog>
    </View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  empty: {
    alignItems: "center",
    marginTop: spacing.xxl,
    gap: spacing.xs,
  },
  emptyTitle: {
    fontSize: fontSize.medium,
    fontFamily: fonts.title,
    color: colors.text,
  },
  name: {
    fontSize: fontSize.medium,
    fontFamily: fonts.title,
    color: colors.text,
  },
});
