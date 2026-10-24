import { Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from "react-native";

import { colors, fontSize, radius, spacing } from "@/constants/theme";

// "primary": filled orange pill for the main action. "secondary": grey text, e.g. Cancel.
// "danger": red text for destructive actions.
export function Button({
  title,
  onPress,
  variant = "primary",
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        variant === "primary" && styles.primary,
        pressed && styles.pressed,
        style,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.text, textStyles[variant]]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  primary: {
    backgroundColor: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    fontSize: fontSize.medium,
    fontWeight: "600",
  },
});

// For buttons side by side in a row: each one takes an equal share of the width.
// The main action goes last, on the right, as in the phone's own dialogs.
export const buttonRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  button: {
    flex: 1,
  },
});

const textStyles = StyleSheet.create({
  primary: {
    color: colors.onPrimary,
  },
  secondary: {
    color: colors.textSecondary,
  },
  danger: {
    color: colors.danger,
  },
});
