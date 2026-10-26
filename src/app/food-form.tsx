import { router, Stack, useLocalSearchParams } from "expo-router";
import { useHeaderHeight } from "expo-router/react-navigation";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useEffect, useState } from "react";
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
import { ConfirmDialog, Dialog } from "@/components/dialog";
import { Icon } from "@/components/icon";
import { Select } from "@/components/select";
import { makeFieldStyles, TextField } from "@/components/text-field";
import { FOOD_TYPE_KEYS, type FoodType, UNIT_KEYS, type Unit } from "@/constants/food";
import { fontSize, fonts, inputBox, radius, spacing, type Theme } from "@/constants/theme";
import { useStyles, useTheme } from "@/hooks/use-theme";
import { addFood, deleteFood, type Food, getFood, getFoodsByBarcode, updateFood } from "@/db/foods";
import { unitName, useTranslation } from "@/i18n";
import { errorMessages, readFoodForm, scannedFoodFields } from "@/utils/forms";
import { caloriesFromMacros, MACRO_FIELDS, type MacroKey, parseNumber } from "@/utils/nutrition";
import { type LookupResult, lookUpBarcode } from "@/utils/open-food-facts";

// What happened with a scan: already saved, or Open Food Facts' answer ("lookingUp" while it's asked
// again from the "already saved" popup, "cancelled" if that popup was closed).
type ScanOutcome = {
  scanId: string;
  status: "saved" | "lookingUp" | "cancelled" | LookupResult["status"];
  saved: Food[]; // The saved foods with this barcode, shown in the "already saved" popup
};

export default function FoodForm() {
  const styles = useStyles(makeStyles);
  const fieldStyles = useStyles(makeFieldStyles);
  const { colors } = useTheme();
  const db = useSQLiteContext();
  const { t } = useTranslation();
  // With an id (/food-form?id=3) the form edits that food; without one it adds a new food.
  // The scanner comes back with a barcode (/food-form?barcode=…&scan=…), which fills in the food from it.
  // `scan` is different for every scan, so scanning the same barcode again is a new scan too.
  const params = useLocalSearchParams<{ id?: string; barcode?: string; scan?: string }>();
  const id = params.id ? Number(params.id) : null;
  const barcode = params.barcode ?? null;
  const scanId = barcode !== null ? (params.scan ?? barcode) : null;
  // What happened with the last scan. Until it's about the scan on screen, the form is still checking it.
  const [scan, setScan] = useState<ScanOutcome | null>(null);
  const scanned = scanId !== null && scan?.scanId === scanId ? scan : null;
  const lookingUp = scanId !== null && (scanned === null || scanned.status === "lookingUp");
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

  // Fills in what Open Food Facts knows about a barcode, replacing what was typed.
  // useCallback keeps it the same function between redraws, so the effect below doesn't rerun.
  const fillFromOpenFoodFacts = useCallback(async (code: string, id: string) => {
    const result = await lookUpBarcode(code);
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
    setScan({ scanId: id, status: result.status, saved: [] });
  }, []);

  // After each scan: if the product is already saved, show it; otherwise fill it in from Open Food Facts.
  // Checking the saved foods needs no internet, so they're shown offline too.
  useEffect(() => {
    if (barcode === null || scanId === null) return;
    getFoodsByBarcode(db, barcode).then((saved) => {
      if (saved.length > 0) setScan({ scanId, status: "saved", saved });
      else fillFromOpenFoodFacts(barcode, scanId);
    });
  }, [db, barcode, scanId, fillFromOpenFoodFacts]);

  // From the "already saved" popup: add the product again, e.g. with another reference amount.
  function addAnother() {
    if (barcode === null || scanId === null) return;
    setScan({ scanId, status: "lookingUp", saved: [] });
    fillFromOpenFoodFacts(barcode, scanId);
  }

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
            <Card style={styles.scanCard}>
              <View style={styles.scanRow}>
                <View style={styles.scanIcon}>
                  <Icon name="barcode" size={22} color={colors.primaryText} />
                </View>
                <Text style={[styles.scanTitle, styles.flex]}>
                  {lookingUp ? t.foodForm.lookingUp : t.foodForm.scan}
                </Text>
                {lookingUp ? <ActivityIndicator color={colors.primary} /> : <Icon name="chevronRight" />}
              </View>
              {/* "Filled in from Open Food Facts" is also the credit their license asks for. */}
              {scanned?.status === "found" && <Text style={styles.scanMessage}>{t.foodForm.fromOpenFoodFacts}</Text>}
              {/* Problems get a colored box, so they're noticed and stay until the next scan. */}
              {scanned?.status === "notFound" && (
                <Text style={[styles.scanBox, styles.notFoundBox]}>{t.foodForm.notFound}</Text>
              )}
              {scanned?.status === "failed" && (
                <Text style={[styles.scanBox, styles.failedBox]}>{t.foodForm.lookupFailed}</Text>
              )}
            </Card>
          </Pressable>
        )}

        {/* The scanned product is already saved: open one of its versions, or add it again. */}
        <Dialog
          visible={scanned?.status === "saved"}
          title={t.foodForm.alreadySaved}
          onClose={() => scanned && setScan({ ...scanned, status: "cancelled" })}
        >
          {scanned?.saved.map((food) => (
            <Pressable
              key={food.id}
              style={({ pressed }) => [styles.savedRow, pressed && styles.pressed]}
              onPress={() => router.replace({ pathname: "/food-form", params: { id: String(food.id) } })}
            >
              <View style={styles.flex}>
                <Text style={styles.scanTitle}>{food.name}</Text>
                <Text style={styles.scanMessage}>
                  {[food.brand, t.foods.per(String(food.reference_amount), unitName(t, food.unit, food.reference_amount))]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
              <Icon name="chevronRight" />
            </Pressable>
          ))}
          <View style={buttonRowStyles.row}>
            <Button
              title={t.common.cancel}
              variant="secondary"
              onPress={() => scanned && setScan({ ...scanned, status: "cancelled" })}
              style={buttonRowStyles.button}
            />
            <Button title={t.foodForm.addAnother} onPress={addAnother} style={buttonRowStyles.button} />
          </View>
        </Dialog>
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
  scanCard: {
    gap: spacing.sm,
  },
  scanRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  scanMessage: {
    fontSize: fontSize.body,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  scanBox: {
    borderRadius: radius.input,
    overflow: "hidden",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.body,
    fontFamily: fonts.bodyMedium,
  },
  // Orange, like the type badges: nothing went wrong, it just has to be filled in by hand.
  notFoundBox: {
    backgroundColor: colors.primaryTint,
    color: colors.primaryText,
  },
  // Red, like the goal form's "over the goal" box: something failed and is worth trying again.
  failedBox: {
    backgroundColor: colors.dangerTint,
    color: colors.danger,
  },
  // A saved version of the scanned product, in the "already saved" popup.
  savedRow: {
    ...inputBox(colors),
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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
