import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, Text, TextInput, type TextInputProps, View, type ViewStyle } from "react-native";

import { colors, fontSize, inputBox } from "@/constants/theme";

// A label, a text input and an optional error message below it.
// `labelRight` shows something next to the label (e.g. a unit switch), `hint` a grey note under the input.
export function TextField({
  label,
  error,
  hint,
  labelRight,
  containerStyle,
  ...inputProps
}: {
  label: string;
  error?: string;
  hint?: string;
  labelRight?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
} & TextInputProps) {
  return (
    <View style={[fieldStyles.field, containerStyle]}>
      <View style={styles.labelRow}>
        <Text style={fieldStyles.label}>{label}</Text>
        {labelRight}
      </View>
      <TextInput
        style={[styles.input, !!error && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
      {!!hint && !error && <Text style={styles.hint}>{hint}</Text>}
      {!!error && <Text style={fieldStyles.error}>{error}</Text>}
    </View>
  );
}

// Also used by form pieces that aren't text inputs (like the dropdowns), so labels and errors match.
export const fieldStyles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: colors.text,
  },
  error: {
    fontSize: fontSize.small,
    color: colors.danger,
  },
});

const styles = StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
  },
  input: {
    ...inputBox,
    fontSize: fontSize.medium,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
  hint: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
});
