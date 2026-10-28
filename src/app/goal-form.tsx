import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { Button, buttonRowStyles } from "@/components/button";
import { Card } from "@/components/card";
import { ConfirmDialog } from "@/components/dialog";
import { TextField } from "@/components/text-field";
import { fontSize, fonts, pressedStyle, radius, spacing, type Theme } from "@/constants/theme";
import { useDiscardChanges } from "@/hooks/use-discard-changes";
import { useStyles } from "@/hooks/use-theme";
import { addGoal, deleteGoal, getGoal, getWeekdayGoals, setWeekdayGoal, updateGoal } from "@/db/goals";
import { useTranslation } from "@/i18n";
import { todayString } from "@/utils/date";
import { errorMessages, readGoalForm, typingErrors } from "@/utils/forms";
import {
  caloriesFromMacros,
  fillEmptyMacro,
  formatNumber,
  gramsFromPercent,
  isOverGoal,
  KCAL_PER_GRAM,
  KCAL_TOLERANCE,
  MACRO_FIELDS,
  macroCalories,
  type MacroKey,
  type MacroUnit,
  parseNumber,
  percentFromGrams,
} from "@/utils/nutrition";

export default function GoalForm() {
  const styles = useStyles(makeStyles);
  const db = useSQLiteContext();
  const { t } = useTranslation();
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
  // After the first Save, empty required fields are pointed out too, not only typos.
  const [triedSave, setTriedSave] = useState(false);
  // Weekdays that use this goal, for the delete confirmation.
  const [usedOnWeekdays, setUsedOnWeekdays] = useState<number[]>([]);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const headerHeight = useHeaderHeight();
  // With the phone's text bigger than normal, the three macro fields don't fit side by side, so they stack.
  const stackMacros = useWindowDimensions().fontScale > 1;

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
  const macroKcal = macroCalories({ protein: gramsOf("protein"), carbs: gramsOf("carbs"), fat: gramsOf("fat") });
  // How many calories the macros don't cover yet (negative = over the goal). Only with calories typed in.
  const kcalLeft = kcal === null ? null : kcal - macroKcal;
  const isOver = kcal !== null && isOverGoal(macroKcal, kcal);
  // The "Use for…" button appears when exactly one macro is empty and there are calories left for it.
  const emptyMacros = MACRO_FIELDS.filter(({ key }) => macros[key].trim() === "");
  const fillTarget = emptyMacros.length === 1 && kcalLeft !== null && kcalLeft > KCAL_TOLERANCE ? emptyMacros[0] : null;

  // The value in the other unit, shown under each macro field.
  function hintFor(key: MacroKey) {
    if (units[key] === "%" && kcal === null) return t.goalForm.enterCaloriesFirst;
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
    setMacros({ ...macros, [key]: String(fillEmptyMacro(key, units[key], kcalLeft, kcal)) });
  }

  // The fields as they were once the form was ready (empty, or the goal loaded), to tell whether anything changed.
  const [startFields, setStartFields] = useState<string | null>(null);
  const fieldsText = JSON.stringify({ name, calories, macros, units });
  if (loaded && startFields === null) setStartFields(fieldsText);
  const { allowLeaving, dialog: discardDialog } = useDiscardChanges(startFields !== null && fieldsText !== startFields);

  // Runs when leaving a field, so a typo shows right away instead of on Save, and a fixed one goes away.
  function checkFields() {
    const { errors: newErrors } = readGoalForm({ name, calories, macros, units });
    setErrors(errorMessages(t, triedSave ? newErrors : typingErrors(newErrors)));
  }

  async function save() {
    setTriedSave(true);
    const { value: goal, errors: newErrors } = readGoalForm({ name, calories, macros, units });
    setErrors(errorMessages(t, newErrors));
    if (!goal) return;

    if (id === null) {
      const result = await addGoal(db, goal);
      if (params.assignWeekday) {
        await setWeekdayGoal(db, Number(params.assignWeekday), result.lastInsertRowId, todayString(), params.fillDay);
      }
    } else {
      await updateGoal(db, id, goal, todayString());
    }
    allowLeaving();
    router.back();
  }

  async function deleteAndClose() {
    if (id === null) return;
    setConfirmingDelete(false);
    await deleteGoal(db, id, todayString());
    allowLeaving();
    router.back();
  }

  const title = <Stack.Screen options={{ title: id === null ? t.goalForm.addTitle : t.goalForm.editTitle }} />;

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
          <TextField
            label={t.common.name}
            value={name}
            onChangeText={setName}
            onBlur={checkFields}
            placeholder={t.goalForm.namePlaceholder}
            error={errors.name}
          />
        </Card>

        <Card style={styles.section}>
          <TextField
            label={t.foodForm.calories}
            value={calories}
            onChangeText={setCalories}
            onBlur={checkFields}
            keyboardType="decimal-pad"
            placeholder={hasMacros && !anyPercent ? t.foodForm.calculated(calculatedCalories) : undefined}
            error={errors.calories}
          />

          <View style={[styles.macros, stackMacros && styles.macrosStacked]}>
            {MACRO_FIELDS.map(({ key }) => (
              <TextField
                key={key}
                label={t.macros[key]}
                labelRight={<UnitSwitch value={units[key]} onChange={(unit) => switchUnit(key, unit)} />}
                value={macros[key]}
                onChangeText={(text) => setMacros({ ...macros, [key]: text })}
                onBlur={checkFields}
                keyboardType="decimal-pad"
                placeholder={t.goalForm.none}
                hint={hintFor(key)}
                error={errors[key]}
                containerStyle={!stackMacros && styles.flex}
              />
            ))}
          </View>

          {kcalLeft !== null && hasMacros && (
            <View style={[styles.left, isOver && styles.leftOver]}>
              <View style={styles.flex}>
                <Text style={[styles.leftTitle, isOver && styles.overText]}>
                  {isOver
                    ? t.goalForm.over(formatNumber(macroKcal), formatNumber(-kcalLeft))
                    : t.goalForm.kcalLeft(formatNumber(Math.max(kcalLeft, 0)))}
                </Text>
                {fillTarget && (
                  <Text style={styles.leftDetail}>
                    {t.goalForm.approxGrams(Math.floor(kcalLeft / KCAL_PER_GRAM[fillTarget.key]), t.macros[fillTarget.key])}
                  </Text>
                )}
              </View>
              {fillTarget && (
                <Pressable accessibilityRole="button" style={({ pressed }) => [styles.fillButton, pressed && pressedStyle]} onPress={fillRemaining}>
                  <Text style={styles.fillText}>{t.goalForm.useFor(t.macros[fillTarget.key])}</Text>
                </Pressable>
              )}
            </View>
          )}

        </Card>

        <View style={buttonRowStyles.row}>
          {id !== null && (
            <Button
              title={t.common.delete}
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
              style={buttonRowStyles.button}
            />
          )}
          {/* Greyed out while the macros are over the goal; the red box above explains why. */}
          <Button title={t.common.save} onPress={save} disabled={isOver} style={buttonRowStyles.button} />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmingDelete}
        title={t.common.deleteTitle(name)}
        message={t.goalForm.deleteWeekdays(usedOnWeekdays.map((weekday) => t.weekdays[weekday - 1]))}
        confirmTitle={t.common.delete}
        onConfirm={deleteAndClose}
        onCancel={() => setConfirmingDelete(false)}
      />

      <ConfirmDialog
        visible={discardDialog.visible}
        title={t.common.discardTitle}
        message={t.common.discardMessage}
        confirmTitle={t.common.discard}
        onConfirm={discardDialog.onDiscard}
        onCancel={discardDialog.onKeepEditing}
      />
    </KeyboardAvoidingView>
  );
}

// A small "g | %" switch shown next to each macro's label.
function UnitSwitch({ value, onChange }: { value: MacroUnit; onChange: (unit: MacroUnit) => void }) {
  const styles = useStyles(makeStyles);
  const { t } = useTranslation();

  return (
    <View style={styles.switch}>
      {(["g", "%"] as const).map((unit) => {
        const isOn = unit === value;
        return (
          <Pressable
            key={unit}
            accessibilityRole="button"
            style={({ pressed }) => [styles.switchOption, isOn && styles.switchOptionOn, pressed && pressedStyle]}
            onPress={() => onChange(unit)}
            // Taller and wider than it looks, so it's easy to hit. Only a little downward: the text field is just below.
            hitSlop={{ top: 14, bottom: 5, left: unit === "g" ? 10 : 0, right: unit === "%" ? 10 : 0 }}
            accessibilityLabel={unit === "g" ? t.goalForm.grams : t.goalForm.percent}
            accessibilityState={{ selected: isOn }}
          >
            <Text style={[styles.switchText, isOn && styles.switchTextOn]}>{unit}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
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
  macrosStacked: {
    flexDirection: "column",
    alignItems: "stretch",
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
    fontFamily: fonts.bodyBold,
    color: colors.primaryText,
  },
  overText: {
    color: colors.danger,
  },
  leftDetail: {
    fontSize: fontSize.small,
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyBold,
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
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  switchTextOn: {
    color: colors.onPrimary,
    fontFamily: fonts.bodyBold,
  },
});
