import { StyleSheet, View, type ViewProps } from "react-native";

import { colors, radius, shadow, spacing } from "@/constants/theme";

// A white, rounded box with a soft shadow, used for list items and form sections.
export function Card({ style, ...props }: ViewProps) {
  return <View style={[styles.card, style]} {...props} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    boxShadow: shadow.card,
  },
});
