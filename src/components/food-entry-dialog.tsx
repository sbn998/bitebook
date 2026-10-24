import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button, buttonRowStyles } from "@/components/button";
import { ConfirmBody, Dialog } from "@/components/dialog";
import { TextField } from "@/components/text-field";
import { colors, fontSize, radius, spacing } from "@/constants/theme";
import { type FoodEntry, foodEntryNutrition } from "@/db/entries";
import { useTranslation } from "@/i18n";
import { formatNumber, macroLine, parseNumber } from "@/utils/nutrition";

// A popup for one food in a meal: change its amount (with its calories and macros updating live)
// or delete it from the meal. Open it with a `key` per food, so each one starts fresh.
export function FoodEntryDialog({
  entry,
  onSave,
  onDelete,
  onClose,
}: {
  entry: FoodEntry;
  onSave: (quantity: number) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(formatNumber(entry.quantity, 1));
  const [error, setError] = useState("");
  // When true, the dialog asks "Delete …?" instead of showing the amount.
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const nutrition = foodEntryNutrition({ ...entry, quantity: parseNumber(amount) ?? 0 });

  function save() {
    const quantity = parseNumber(amount);
    if (amount.trim() === "") setError("Required");
    else if (quantity === null) setError("Enter a valid number");
    else if (quantity <= 0) setError("Must be more than 0");
    else onSave(quantity);
  }

  return (
    <Dialog visible title={confirmingDelete ? `Delete ${entry.name}?` : entry.name} onClose={onClose}>
      {confirmingDelete ? (
        <ConfirmBody
          message="This only removes it from this meal."
          confirmTitle="Delete"
          onConfirm={onDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      ) : (
        <>
          <TextField
            label={`Amount (${t.units[entry.unit].other})`}
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              setError("");
            }}
            keyboardType="decimal-pad"
            selectTextOnFocus
            error={error}
            onSubmitEditing={save}
          />
          <View style={styles.nutrition}>
            <Text style={styles.calories}>{formatNumber(nutrition.calories)} kcal</Text>
            <Text style={styles.macros}>{macroLine(nutrition)}</Text>
          </View>
          <View style={buttonRowStyles.row}>
            <Button title="Cancel" variant="secondary" onPress={onClose} style={buttonRowStyles.button} />
            <Button
              title="Delete"
              variant="danger"
              onPress={() => setConfirmingDelete(true)}
              style={buttonRowStyles.button}
            />
            <Button title="Save" onPress={save} style={buttonRowStyles.button} />
          </View>
        </>
      )}
    </Dialog>
  );
}

const styles = StyleSheet.create({
  nutrition: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.input,
    padding: spacing.md,
    gap: 2,
  },
  calories: {
    fontSize: fontSize.medium,
    fontWeight: "600",
    color: colors.primaryText,
  },
  macros: {
    fontSize: fontSize.body,
    color: colors.primaryText,
  },
});
