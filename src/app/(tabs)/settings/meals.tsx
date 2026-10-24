import { Stack } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Button, buttonRowStyles } from "@/components/button";
import { Card } from "@/components/card";
import { ConfirmBody, Dialog } from "@/components/dialog";
import { HeaderButton } from "@/components/header-button";
import { TextField } from "@/components/text-field";
import { colors, fontSize, spacing } from "@/constants/theme";
import { addMeal, deleteMeal, getMeals, type Meal, renameMeal } from "@/db/meals";

export default function MealLabels() {
  const db = useSQLiteContext();
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
      setError("Required");
      return;
    }
    // The database also rejects duplicates; checking here lets us show a clear message.
    const duplicate = meals.some(
      (meal) => meal !== editing && meal.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase()
    );
    if (duplicate) {
      setError("A meal with this name already exists");
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
  let dialogTitle = editing === "new" ? "Add meal" : "Edit meal";
  if (isEditingMeal && confirmingDelete) dialogTitle = `Delete ${editing.name}?`;

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerRight: () => <HeaderButton title="Add" onPress={() => openDialog("new")} /> }} />

      <FlatList
        data={meals}
        keyExtractor={(meal) => String(meal.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No meal labels yet</Text>
            <Text style={styles.emptyText}>Add the meals you eat, like Breakfast or Lunch.</Text>
          </View>
        }
        renderItem={({ item: meal }) => (
          <Pressable onPress={() => openDialog(meal)}>
            <Card>
              <Text style={styles.name}>{meal.name}</Text>
            </Card>
          </Pressable>
        )}
      />

      <Dialog visible={editing !== null} title={dialogTitle} onClose={closeDialog}>
        {confirmingDelete ? (
          <ConfirmBody
            message="Meals already added to a day keep their name."
            confirmTitle="Delete"
            onConfirm={deleteEditing}
            onCancel={() => setConfirmingDelete(false)}
          />
        ) : (
          <>
            <TextField
              label="Name"
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
              <Button title="Cancel" variant="secondary" onPress={closeDialog} style={buttonRowStyles.button} />
              {isEditingMeal && (
                <Button
                  title="Delete"
                  variant="danger"
                  onPress={() => setConfirmingDelete(true)}
                  style={buttonRowStyles.button}
                />
              )}
              <Button title="Save" onPress={save} style={buttonRowStyles.button} />
            </View>
          </>
        )}
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontWeight: "600",
    color: colors.text,
  },
  emptyText: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  name: {
    fontSize: fontSize.medium,
    fontWeight: "600",
    color: colors.text,
  },
});
