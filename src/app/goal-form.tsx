import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, buttonRowStyles } from "@/components/button";
import { Card } from "@/components/card";
import { ConfirmDialog } from "@/components/dialog";
import { TextField } from "@/components/text-field";
import { colors, fontSize, spacing } from "@/constants/theme";
import { weekdayLabel } from "@/constants/weekdays";
import { addGoal, deleteGoal, getGoal, getWeekdayGoals, updateGoal } from "@/db/goals";
import { todayString } from "@/utils/date";
import { caloriesFromMacros, MACRO_FIELDS, type MacroKey, parseNumber } from "@/utils/nutrition";

// "This will remove Monday's and Tuesday's goals." for the weekdays that use the goal being deleted.
function deleteMessage(weekdays: number[]) {
  if (weekdays.length === 0) return "This can't be undone.";
  const names = weekdays.map((weekday) => `${weekdayLabel(weekday)}'s`);
  const list = names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
  return `This will remove ${list} ${weekdays.length === 1 ? "goal" : "goals"}.`;
}

export default function GoalForm() {
  const db = useSQLiteContext();
  // With an id (/goal-form?id=3) the form edits that goal; without one it adds a new goal.
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : null;
  const [loaded, setLoaded] = useState(id === null);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [macros, setMacros] = useState<Record<MacroKey, string>>({ protein: "", carbs: "", fat: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Weekdays that use this goal, for the delete confirmation.
  const [usedOnWeekdays, setUsedOnWeekdays] = useState<number[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const headerHeight = useHeaderHeight();

  // In edit mode, load the goal once and fill in the fields.
  useEffect(() => {
    if (id === null) return;
    Promise.all([getGoal(db, id), getWeekdayGoals(db)]).then(([goal, weekdayGoals]) => {
      if (goal) {
        setName(goal.name);
        setCalories(String(goal.calories));
        // An empty macro field means "no target".
        setMacros({
          protein: goal.protein === null ? "" : String(goal.protein),
          carbs: goal.carbs === null ? "" : String(goal.carbs),
          fat: goal.fat === null ? "" : String(goal.fat),
        });
      }
      setUsedOnWeekdays(weekdayGoals.filter((weekdayGoal) => weekdayGoal.goal_id === id).map((w) => w.weekday));
      setLoaded(true);
    });
  }, [db, id]);

  const hasMacros = MACRO_FIELDS.some(({ key }) => macros[key].trim() !== "");
  const calculatedCalories = caloriesFromMacros(
    parseNumber(macros.protein) ?? 0,
    parseNumber(macros.carbs) ?? 0,
    parseNumber(macros.fat) ?? 0
  );

  async function save() {
    const newErrors: Record<string, string> = {};

    if (name.trim() === "") newErrors.name = "Required";

    // Empty macros mean "no target" and are saved as null.
    const macroValues: Record<MacroKey, number | null> = { protein: null, carbs: null, fat: null };
    for (const { key } of MACRO_FIELDS) {
      if (macros[key].trim() === "") continue;
      const value = parseNumber(macros[key]);
      if (value === null) newErrors[key] = "Enter a valid number";
      else if (value < 0) newErrors[key] = "Can't be negative";
      else macroValues[key] = value;
    }

    // Empty calories are calculated from the macros, if there are any.
    let kcal = parseNumber(calories);
    if (calories.trim() === "") {
      if (hasMacros) kcal = calculatedCalories;
      else newErrors.calories = "Enter calories or at least one macronutrient";
    } else if (kcal === null) newErrors.calories = "Enter a valid number";
    else if (kcal <= 0) newErrors.calories = "Must be more than 0";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || kcal === null) return;

    const goal = { name: name.trim(), calories: kcal, ...macroValues };
    if (id === null) await addGoal(db, goal);
    else await updateGoal(db, id, goal, todayString());
    router.back();
  }

  async function deleteAndClose() {
    if (id === null) return;
    setConfirmingDelete(false);
    await deleteGoal(db, id, todayString());
    router.back();
  }

  const title = <Stack.Screen options={{ title: id === null ? "Add goal" : "Edit goal" }} />;

  // Show nothing until the goal has loaded, so the empty form doesn't flash first.
  if (!loaded) return title;

  return (
    // Same keyboard handling as the food form: see the comment there.
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "android" ? "height" : undefined}
      keyboardVerticalOffset={headerHeight}
    >
      {title}
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.form}
      >
        <Card style={styles.section}>
          <TextField label="Name" value={name} onChangeText={setName} placeholder="Training day" error={errors.name} />
        </Card>

        <Card style={styles.section}>
          <TextField
            label="Calories (kcal)"
            value={calories}
            onChangeText={setCalories}
            keyboardType="decimal-pad"
            placeholder={hasMacros ? `${calculatedCalories} (calculated)` : undefined}
            error={errors.calories}
          />

          <View style={styles.macros}>
            {MACRO_FIELDS.map(({ key, label }) => (
              <TextField
                key={key}
                label={label}
                value={macros[key]}
                onChangeText={(text) => setMacros({ ...macros, [key]: text })}
                keyboardType="decimal-pad"
                placeholder="None"
                error={errors[key]}
                containerStyle={styles.flex}
              />
            ))}
          </View>

          <Text style={styles.hint}>Macro targets are optional. Leave one empty to not track it.</Text>
        </Card>

        <View style={buttonRowStyles.row}>
          {id !== null && (
            <Button
              title="Delete"
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
              style={buttonRowStyles.button}
            />
          )}
          <Button title="Save" onPress={save} style={buttonRowStyles.button} />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmingDelete}
        title={`Delete ${name}?`}
        message={deleteMessage(usedOnWeekdays)}
        confirmTitle="Delete"
        onConfirm={deleteAndClose}
        onCancel={() => setConfirmingDelete(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  form: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.lg,
  },
  macros: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  hint: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
});
