import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button, buttonRowStyles } from "@/components/button";
import { Card } from "@/components/card";
import { ConfirmDialog } from "@/components/dialog";
import { Select } from "@/components/select";
import { fieldStyles, TextField } from "@/components/text-field";
import { FOOD_TYPE_KEYS, type FoodType, UNIT_KEYS, type Unit } from "@/constants/food";
import { colors, fontSize, fonts, inputBox, spacing } from "@/constants/theme";
import { addFood, deleteFood, getFood, updateFood } from "@/db/foods";
import { unitName, useTranslation } from "@/i18n";
import { caloriesFromMacros, MACRO_FIELDS, type MacroKey, parseNumber } from "@/utils/nutrition";

export default function FoodForm() {
  const db = useSQLiteContext();
  const { t } = useTranslation();
  // With an id (/food-form?id=3) the form edits that food; without one it adds a new food.
  const params = useLocalSearchParams<{ id?: string }>();
  const id = params.id ? Number(params.id) : null;
  const [loaded, setLoaded] = useState(id === null);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [type, setType] = useState<FoodType | null>(null);
  const [unit, setUnit] = useState<Unit>("g");
  const [referenceAmount, setReferenceAmount] = useState("100");
  const [calories, setCalories] = useState("");
  const [macros, setMacros] = useState<Record<MacroKey, string>>({ protein: "", carbs: "", fat: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const headerHeight = useHeaderHeight();

  // In edit mode, load the food once and fill in the fields.
  useEffect(() => {
    if (id === null) return;
    getFood(db, id).then((food) => {
      if (food) {
        setName(food.name);
        setBrand(food.brand ?? "");
        setType(food.type);
        setUnit(food.unit);
        setReferenceAmount(String(food.reference_amount));
        setCalories(String(food.calories));
        setMacros({ protein: String(food.protein), carbs: String(food.carbs), fat: String(food.fat) });
      }
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

    if (name.trim() === "") newErrors.name = t.common.required;
    if (!type) newErrors.type = t.foodForm.chooseType;

    const amount = parseNumber(referenceAmount);
    if (referenceAmount.trim() === "") newErrors.reference_amount = t.common.required;
    else if (amount === null) newErrors.reference_amount = t.common.validNumber;
    else if (amount <= 0) newErrors.reference_amount = t.common.moreThanZero;

    // Empty macros count as 0.
    const macroValues = { protein: 0, carbs: 0, fat: 0 };
    for (const { key } of MACRO_FIELDS) {
      if (macros[key].trim() === "") continue;
      const value = parseNumber(macros[key]);
      if (value === null) newErrors[key] = t.common.validNumber;
      else if (value < 0) newErrors[key] = t.common.notNegative;
      else macroValues[key] = value;
    }

    // Empty calories are calculated from the macros, if there are any.
    let kcal = parseNumber(calories);
    if (calories.trim() === "") {
      if (hasMacros) kcal = calculatedCalories;
      else newErrors.calories = t.foodForm.caloriesOrMacro;
    } else if (kcal === null) newErrors.calories = t.common.validNumber;
    else if (kcal < 0) newErrors.calories = t.common.notNegative;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0 || !type || amount === null || kcal === null) return;

    const food = {
      name: name.trim(),
      brand: brand.trim() || null,
      type,
      reference_amount: amount,
      unit,
      calories: kcal,
      ...macroValues,
    };
    if (id === null) await addFood(db, food);
    else await updateFood(db, id, food);
    router.back();
  }

  async function deleteAndClose() {
    if (id === null) return;
    setConfirmingDelete(false);
    await deleteFood(db, id);
    router.back();
  }

  const title = <Stack.Screen options={{ title: id === null ? t.foodForm.addTitle : t.foodForm.editTitle }} />;

  // Show nothing until the food has loaded, so the empty form doesn't flash first.
  if (!loaded) return title;

  return (
    // On Android, shrink the form when the keyboard opens so the focused field stays visible.
    // The offset accounts for the header above the form.
    // iOS handles this with automaticallyAdjustKeyboardInsets on the ScrollView.
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
          <TextField label={t.common.name} value={name} onChangeText={setName} error={errors.name} />
          <TextField label={t.foodForm.brand} value={brand} onChangeText={setBrand} />

          <View style={fieldStyles.field}>
            <Text style={fieldStyles.label}>{t.foods.type}</Text>
            <Select
              title={t.foods.type}
              options={FOOD_TYPE_KEYS.map((key) => ({ key, label: t.foodTypes[key] }))}
              value={type}
              onChange={setType}
              placeholder={t.foodForm.chooseType}
              hasError={!!errors.type}
            />
            {!!errors.type && <Text style={fieldStyles.error}>{errors.type}</Text>}
          </View>

          <View style={fieldStyles.field}>
            <Text style={fieldStyles.label}>{t.foodForm.referenceAmount}</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex, !!errors.reference_amount && styles.inputError]}
                value={referenceAmount}
                onChangeText={setReferenceAmount}
                keyboardType="decimal-pad"
              />
              <Select
                title={t.foodForm.unit}
                options={UNIT_KEYS.map((key) => ({ key, label: unitName(t, key, parseNumber(referenceAmount) ?? 0) }))}
                value={unit}
                onChange={setUnit}
                style={styles.flex}
              />
            </View>
            {!!errors.reference_amount && <Text style={fieldStyles.error}>{errors.reference_amount}</Text>}
          </View>
        </Card>

        <Card style={styles.section}>
          <TextField
            label={t.foodForm.calories}
            value={calories}
            onChangeText={setCalories}
            keyboardType="decimal-pad"
            placeholder={hasMacros ? t.foodForm.calculated(calculatedCalories) : undefined}
            error={errors.calories}
          />

          <View style={styles.macros}>
            {MACRO_FIELDS.map(({ key }) => (
              <TextField
                key={key}
                label={`${t.macros[key]} (g)`}
                value={macros[key]}
                onChangeText={(text) => setMacros({ ...macros, [key]: text })}
                keyboardType="decimal-pad"
                placeholder="0"
                error={errors[key]}
                containerStyle={styles.flex}
              />
            ))}
          </View>
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
          <Button title={t.common.save} onPress={save} style={buttonRowStyles.button} />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmingDelete}
        title={t.common.deleteTitle(name)}
        message={t.common.cantUndo}
        confirmTitle={t.common.delete}
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  macros: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  input: {
    ...inputBox,
    fontSize: fontSize.medium,
    fontFamily: fonts.body,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
});
