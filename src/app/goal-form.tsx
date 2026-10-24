import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Button, buttonRowStyles } from "@/components/button";
import { Card } from "@/components/card";
import { ConfirmDialog } from "@/components/dialog";
import { TextField } from "@/components/text-field";
import { colors, fontSize, radius, spacing } from "@/constants/theme";
import { weekdayLabel } from "@/constants/weekdays";
import { addGoal, deleteGoal, getGoal, getWeekdayGoals, setWeekdayGoal, updateGoal } from "@/db/goals";
import { todayString } from "@/utils/date";
import {
  caloriesFromMacros,
  formatNumber,
  gramsFromPercent,
  KCAL_PER_GRAM,
  MACRO_FIELDS,
  type MacroKey,
  parseNumber,
  percentFromGrams,
} from "@/utils/nutrition";

// Macro targets can be typed in grams or as a percentage of the calories. They're always saved as grams.
type MacroUnit = "g" | "%";

// Small rounding differences (e.g. 112.5 g rounded to 113 g) shouldn't count as "over the goal".
const KCAL_TOLERANCE = 0.5;

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
  // From the Main screen's "Set a goal" popup, a new goal is also assigned to `assignWeekday`,
  // and `fillDay` (a past day without a goal) gets it too.
  const params = useLocalSearchParams<{ id?: string; assignWeekday?: string; fillDay?: string }>();
  const id = params.id ? Number(params.id) : null;
  const [loaded, setLoaded] = useState(id === null);
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [macros, setMacros] = useState<Record<MacroKey, string>>({ protein: "", carbs: "", fat: "" });
  const [units, setUnits] = useState<Record<MacroKey, MacroUnit>>({ protein: "g", carbs: "g", fat: "g" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Weekdays that use this goal, for the delete confirmation.
  const [usedOnWeekdays, setUsedOnWeekdays] = useState<number[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const headerHeight = useHeaderHeight();

  // In edit mode, load the goal once and fill in the fields (always in grams).
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

  // Calories as typed, if it's a usable number for percentages.
  const typedCalories = parseNumber(calories);
  const kcal = typedCalories !== null && typedCalories > 0 ? typedCalories : null;
  const anyPercent = MACRO_FIELDS.some(({ key }) => units[key] === "%");
  const hasMacros = MACRO_FIELDS.some(({ key }) => macros[key].trim() !== "");

  // A macro's target in grams, exactly as typed (null if empty, invalid, or in % without calories).
  function gramsOf(key: MacroKey) {
    const value = parseNumber(macros[key]);
    if (value === null) return null;
    if (units[key] === "g") return value;
    return kcal === null ? null : gramsFromPercent(key, value, kcal);
  }

  const calculatedCalories = caloriesFromMacros(gramsOf("protein") ?? 0, gramsOf("carbs") ?? 0, gramsOf("fat") ?? 0);
  const macroKcal = MACRO_FIELDS.reduce((sum, { key }) => sum + (gramsOf(key) ?? 0) * KCAL_PER_GRAM[key], 0);
  // How many calories the macros don't cover yet (negative = over the goal). Only with calories typed in.
  const kcalLeft = kcal === null ? null : kcal - macroKcal;
  const isOver = kcalLeft !== null && kcalLeft < -KCAL_TOLERANCE;
  // The "Use for…" button appears when exactly one macro is empty and there are calories left for it.
  const emptyMacros = MACRO_FIELDS.filter(({ key }) => macros[key].trim() === "");
  const fillTarget = emptyMacros.length === 1 && kcalLeft !== null && kcalLeft > KCAL_TOLERANCE ? emptyMacros[0] : null;

  // The value in the other unit, shown under each macro field.
  function hintFor(key: MacroKey) {
    if (units[key] === "%" && kcal === null) return "Enter calories first";
    const value = parseNumber(macros[key]);
    if (value === null || kcal === null) return undefined;
    return units[key] === "g"
      ? `≈ ${formatNumber(percentFromGrams(key, value, kcal))}%`
      : `≈ ${formatNumber(gramsFromPercent(key, value, kcal))} g`;
  }

  // Switching converts the typed value to the new unit (if there are calories to convert with).
  function switchUnit(key: MacroKey, unit: MacroUnit) {
    if (unit === units[key]) return;
    const value = parseNumber(macros[key]);
    if (value !== null && kcal !== null) {
      const converted =
        unit === "%"
          ? formatNumber(percentFromGrams(key, value, kcal), 1)
          : formatNumber(gramsFromPercent(key, value, kcal));
      setMacros({ ...macros, [key]: converted });
    }
    setUnits({ ...units, [key]: unit });
  }

  // Fills the one empty macro with the calories left, rounded down so the total never goes over.
  function fillRemaining() {
    if (!fillTarget || kcalLeft === null || kcal === null) return;
    const { key } = fillTarget;
    const value =
      units[key] === "g"
        ? Math.floor(kcalLeft / KCAL_PER_GRAM[key])
        : Math.floor((kcalLeft / kcal) * 1000) / 10;
    setMacros({ ...macros, [key]: String(value) });
  }

  async function save() {
    const newErrors: Record<string, string> = {};

    if (name.trim() === "") newErrors.name = "Required";

    // Empty calories are calculated from the macros, unless any macro is a percentage of them.
    let goalKcal = typedCalories;
    if (calories.trim() === "") {
      if (anyPercent) newErrors.calories = "Enter calories to use percentages";
      else if (hasMacros) goalKcal = calculatedCalories;
      else newErrors.calories = "Enter calories or at least one macronutrient";
    } else if (goalKcal === null) newErrors.calories = "Enter a valid number";
    else if (goalKcal <= 0) newErrors.calories = "Must be more than 0";

    // Empty macros mean "no target" and are saved as null. Percentages are saved as whole grams.
    const macroValues: Record<MacroKey, number | null> = { protein: null, carbs: null, fat: null };
    let exactMacroKcal = 0;
    for (const { key } of MACRO_FIELDS) {
      if (macros[key].trim() === "") continue;
      const value = parseNumber(macros[key]);
      if (value === null) newErrors[key] = "Enter a valid number";
      else if (value < 0) newErrors[key] = "Can't be negative";
      else if (units[key] === "%" && value > 100) newErrors[key] = "Can't be more than 100%";
      else if (units[key] === "g") {
        macroValues[key] = value;
        exactMacroKcal += value * KCAL_PER_GRAM[key];
      } else if (goalKcal !== null && !newErrors.calories) {
        const grams = gramsFromPercent(key, value, goalKcal);
        macroValues[key] = Math.round(grams);
        exactMacroKcal += grams * KCAL_PER_GRAM[key];
      }
    }

    // Typed-in calories can't be less than the macros add up to. (The red line under the macros says why.)
    if (calories.trim() !== "" && goalKcal !== null && exactMacroKcal > goalKcal + KCAL_TOLERANCE) {
      newErrors.total = "Macros over the goal";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || goalKcal === null) return;

    const goal = { name: name.trim(), calories: goalKcal, ...macroValues };
    if (id === null) {
      const result = await addGoal(db, goal);
      if (params.assignWeekday) {
        await setWeekdayGoal(db, Number(params.assignWeekday), result.lastInsertRowId, todayString(), params.fillDay);
      }
    } else {
      await updateGoal(db, id, goal, todayString());
    }
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
            placeholder={hasMacros && !anyPercent ? `${calculatedCalories} (calculated)` : undefined}
            error={errors.calories}
          />

          <View style={styles.macros}>
            {MACRO_FIELDS.map(({ key, name: macroName }) => (
              <TextField
                key={key}
                label={macroName}
                labelRight={<UnitSwitch value={units[key]} onChange={(unit) => switchUnit(key, unit)} />}
                value={macros[key]}
                onChangeText={(text) => setMacros({ ...macros, [key]: text })}
                keyboardType="decimal-pad"
                placeholder="None"
                hint={hintFor(key)}
                error={errors[key]}
                containerStyle={styles.flex}
              />
            ))}
          </View>

          {kcalLeft !== null && hasMacros && (
            <View style={[styles.left, isOver && styles.leftOver]}>
              <View style={styles.flex}>
                <Text style={[styles.leftTitle, isOver && styles.overText]}>
                  {isOver
                    ? `Your macros add up to ${formatNumber(macroKcal)} kcal, ${formatNumber(-kcalLeft)} more than the goal`
                    : `${formatNumber(Math.max(kcalLeft, 0))} kcal left`}
                </Text>
                {fillTarget && (
                  <Text style={styles.leftDetail}>
                    ≈ {Math.floor(kcalLeft / KCAL_PER_GRAM[fillTarget.key])} g {fillTarget.name.toLowerCase()}
                  </Text>
                )}
              </View>
              {fillTarget && (
                <Pressable style={styles.fillButton} onPress={fillRemaining}>
                  <Text style={styles.fillText}>Use for {fillTarget.name.toLowerCase()}</Text>
                </Pressable>
              )}
            </View>
          )}

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
          {/* Greyed out while the macros are over the goal; the red box above explains why. */}
          <Button title="Save" onPress={save} disabled={isOver} style={buttonRowStyles.button} />
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

// A small "g | %" switch shown next to each macro's label.
function UnitSwitch({ value, onChange }: { value: MacroUnit; onChange: (unit: MacroUnit) => void }) {
  return (
    <View style={styles.switch}>
      {(["g", "%"] as const).map((unit) => {
        const isOn = unit === value;
        return (
          <Pressable
            key={unit}
            style={[styles.switchOption, isOn && styles.switchOptionOn]}
            onPress={() => onChange(unit)}
            hitSlop={4}
            accessibilityLabel={unit === "g" ? "Grams" : "Percent"}
          >
            <Text style={[styles.switchText, isOn && styles.switchTextOn]}>{unit}</Text>
          </Pressable>
        );
      })}
    </View>
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
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.input,
    padding: spacing.md,
  },
  leftOver: {
    backgroundColor: colors.dangerTint,
  },
  leftTitle: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: colors.primaryText,
  },
  overText: {
    color: colors.danger,
  },
  leftDetail: {
    fontSize: fontSize.small,
    color: colors.primaryText,
  },
  fillButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  fillText: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: colors.onPrimary,
  },
  switch: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  switchOption: {
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  switchOptionOn: {
    backgroundColor: colors.primary,
  },
  switchText: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  switchTextOn: {
    color: colors.onPrimary,
    fontWeight: "600",
  },
});
