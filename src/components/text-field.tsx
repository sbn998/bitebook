import { type StyleProp, StyleSheet, Text, TextInput, type TextInputProps, View, type ViewStyle } from "react-native";

import { colors, fontSize, inputBox } from "@/constants/theme";

// A label, a text input and an optional error message below it.
export function TextField({
  label,
  error,
  containerStyle,
  ...inputProps
}: { label: string; error?: string; containerStyle?: StyleProp<ViewStyle> } & TextInputProps) {
  return (
    <View style={[fieldStyles.field, containerStyle]}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !!error && styles.inputError]}
        placeholderTextColor={colors.textMuted}
        {...inputProps}
      />
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
  input: {
    ...inputBox,
    fontSize: fontSize.medium,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.danger,
  },
});
