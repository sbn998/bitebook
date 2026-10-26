import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { Button, buttonRowStyles } from "@/components/button";
import { Card } from "@/components/card";
import { ConfirmDialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { Select } from "@/components/select";
import { makeFieldStyles, TextField } from "@/components/text-field";
import { FOOD_TYPE_KEYS, type FoodType, UNIT_KEYS, type Unit } from "@/constants/food";
import { fontSize, fonts, inputBox, radius, spacing, type Theme } from "@/constants/theme";
import { useStyles, useTheme } from "@/hooks/use-theme";
import { addFood, deleteFood, getFood, updateFood } from "@/db/foods";
import { unitName, useTranslation } from "@/i18n";
import { errorMessages, readFoodForm, scannedFoodFields } from "@/utils/forms";
import { caloriesFromMacros, MACRO_FIELDS, type MacroKey, parseNumber } from "@/utils/nutrition";
import { lookUpBarcode } from "@/utils/open-food-facts";

export default function FoodForm() {
  const styles = useStyles(makeStyles);
  const fieldStyles = useStyles(makeFieldStyles);
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const { t } = useTranslation();
  // With an id (/food-form?id=3) the form edits that food; without one it adds a new food.
  // The scanner comes back with a barcode (/food-form?barcode=…), which fills in the food from it.
  const params = useLocalSearchParams<{ id?: string; barcode?: string }>();
  const id = params.id ? Number(params.id) : null;
  const barcode = params.barcode ?? null;
  // The last barcode Open Food Facts answered for: until it's this one, the form is still looking it up.
  const [lookedUp, setLookedUp] = useState<string | null>(null);
  const lookingUp = barcode !== null && lookedUp !== barcode;
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

  // After a scan, look the barcode up and fill in what Open Food Facts knows, replacing what was typed.
  useEffect(() => {
    if (barcode === null) return;
    lookUpBarcode(barcode).then((result) => {
      if (result.status === "found") {
        const fields = scannedFoodFields(result.food);
        setName(fields.name);
        setBrand(fields.brand);
        setType(fields.type);
        setUnit(fields.unit);
        setReferenceAmount(fields.referenceAmount);
        setCalories(fields.calories);
        setMacros(fields.macros);
        setErrors({});
      }
      setLookedUp(barcode);
    });
  }, [barcode]);

  const hasMacros = MACRO_FIELDS.some(({ key }) => macros[key].trim() !== "");
  const calculatedCalories = caloriesFromMacros(
    parseNumber(macros.protein) ?? 0,
    parseNumber(macros.carbs) ?? 0,
    parseNumber(macros.fat) ?? 0
  );

  async function save() {
    const { value: food, errors: newErrors } = readFoodForm({
      name,
      brand,
      type,
      unit,
      referenceAmount,
      calories,
      macros,
    });
    setErrors(errorMessages(t, newErrors));
    if (!food) return;

    // A scanned barcode is saved even if Open Food Facts didn't know it, so scanning it again finds this food.
    if (id === null) await addFood(db, { ...food, barcode });
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
        {/* Only for new foods: a scanned barcode is saved when a food is added, never edited. */}
        {id === null && (
          <Pressable
            onPress={() => router.push("/barcode-scanner")}
            disabled={lookingUp}
            style={({ pressed }) => pressed && styles.pressed}
          >
            <Card style={styles.scanRow}>
              <View style={styles.scanIcon}>
                <Icon name="barcode" size={22} color={colors.primaryText} />
              </View>
              <Text style={[styles.scanTitle, styles.flex]}>{lookingUp ? t.foodForm.lookingUp : t.foodForm.scan}</Text>
              {lookingUp ? <ActivityIndicator color={colors.primary} /> : <Icon name="chevronRight" />}
            </Card>
          </Pressable>
        )}
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
    ...inputBox(colors),
    fontSize: fontSize.medium,
    fontFamily: fonts.body,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  pressed: {
    opacity: 0.7,
  },
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  // A round orange-tinted badge, like the food type badges.
  scanIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    justifyContent: "center",
    alignItems: "center",
  },
  scanTitle: {
    fontSize: fontSize.medium,
    fontFamily: fonts.title,
    color: colors.text,
  },
});
