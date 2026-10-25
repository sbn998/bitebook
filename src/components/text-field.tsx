import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, Text, TextInput, type TextInputProps, View, type ViewStyle } from "react-native";

import { fontSize, fonts, inputBox, type Theme } from "@/constants/theme";
import { useStyles, useTheme } from "@/hooks/use-theme";

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
  const { colors } = useTheme();
  const fieldStyles = useStyles(makeFieldStyles);
  const styles = useStyles(makeStyles);
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
export const makeFieldStyles = ({ colors }: Theme) => StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: fontSize.body,
    fontFamily: fonts.bodyMedium,
    color: colors.textSecondary,
  },
  error: {
    fontSize: fontSize.small,
    fontFamily: fonts.body,
    color: colors.danger,
  },
});

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 4,
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
  hint: {
    fontSize: fontSize.small,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
});
