import { Pressable, StyleSheet, Text } from "react-native";

import { colors, fontSize, radius, spacing } from "@/constants/theme";

// "primary": filled orange pill for the main action. "danger": red text for destructive actions.
export function Button({
  title,
  onPress,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "danger";
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, variant === "primary" && styles.primary, pressed && styles.pressed]}
      onPress={onPress}
    >
      <Text style={[styles.text, variant === "primary" ? styles.primaryText : styles.dangerText]}>{title}</Text>
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
  primaryText: {
    color: colors.onPrimary,
  },
  dangerText: {
    color: colors.danger,
  },
});
