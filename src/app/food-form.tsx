import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { Select } from "@/components/select";
import { fieldStyles, TextField } from "@/components/text-field";
import { FOOD_TYPES, type FoodType, UNITS, type Unit } from "@/constants/food";
import { colors, fontSize, inputBox, spacing } from "@/constants/theme";
import { addFood, deleteFood, getFood, updateFood } from "@/db/foods";

type MacroKey = "protein" | "carbs" | "fat";

const MACRO_FIELDS: { key: MacroKey; label: string }[] = [
  { key: "protein", label: "Protein (g)" },
  { key: "carbs", label: "Carbs (g)" },
  { key: "fat", label: "Fat (g)" },
];

// Accepts both "12.5" and "12,5". Returns null if the text isn't a number.
function parseNumber(text: string) {
  const normalized = text.trim().replace(",", ".");
  if (normalized === "") return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

// Standard estimate: 4 kcal per gram of protein or carbs, 9 kcal per gram of fat.
function caloriesFromMacros(protein: number, carbs: number, fat: number) {
  return Math.round(protein * 4 + carbs * 4 + fat * 9);
}

export default function FoodForm() {
  const db = useSQLiteContext();
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

    if (name.trim() === "") newErrors.name = "Required";
    if (!type) newErrors.type = "Choose a type";

    const amount = parseNumber(referenceAmount);
    if (referenceAmount.trim() === "") newErrors.reference_amount = "Required";
    else if (amount === null) newErrors.reference_amount = "Enter a valid number";
    else if (amount <= 0) newErrors.reference_amount = "Must be more than 0";

    // Empty macros count as 0.
    const macroValues = { protein: 0, carbs: 0, fat: 0 };
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
    else if (kcal < 0) newErrors.calories = "Can't be negative";

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

  function confirmDelete() {
    if (id === null) return;
    Alert.alert(`Delete ${name}?`, "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteFood(db, id);
          router.back();
        },
      },
    ]);
  }

  const title = <Stack.Screen options={{ title: id === null ? "Add food" : "Edit food" }} />;

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
          <TextField label="Name" value={name} onChangeText={setName} error={errors.name} />
          <TextField label="Brand (optional)" value={brand} onChangeText={setBrand} />

          <View style={fieldStyles.field}>
            <Text style={fieldStyles.label}>Type</Text>
            <Select
              title="Type"
              options={FOOD_TYPES}
              value={type}
              onChange={setType}
              placeholder="Choose a type"
              hasError={!!errors.type}
            />
            {!!errors.type && <Text style={fieldStyles.error}>{errors.type}</Text>}
          </View>

          <View style={fieldStyles.field}>
            <Text style={fieldStyles.label}>Reference amount</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex, !!errors.reference_amount && styles.inputError]}
                value={referenceAmount}
                onChangeText={setReferenceAmount}
                keyboardType="decimal-pad"
              />
              <Select title="Unit" options={UNITS} value={unit} onChange={setUnit} style={styles.flex} />
            </View>
            {!!errors.reference_amount && <Text style={fieldStyles.error}>{errors.reference_amount}</Text>}
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.hint}>Nutrition values are per reference amount.</Text>

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
                placeholder="0"
                error={errors[key]}
                containerStyle={styles.flex}
              />
            ))}
          </View>
        </Card>

        <Button title="Save" onPress={save} />
        {id !== null && <Button title="Delete" variant="danger" onPress={confirmDelete} />}
      </ScrollView>
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
  hint: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  input: {
    ...inputBox,
    fontSize: fontSize.medium,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
});
