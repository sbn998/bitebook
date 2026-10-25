import { StyleSheet, View, type ViewProps } from "react-native";

import { radius, spacing, type Theme } from "@/constants/theme";
import { useStyles } from "@/hooks/use-theme";

// A white, rounded box with a soft, layered shadow, used for list items and form sections.
export function Card({ style, ...props }: ViewProps) {
  const cardStyles = useStyles(makeCardStyles);
  return <View style={[cardStyles.card, style]} {...props} />;
}

// Also used directly by animated cards, which need an Animated.View instead of a View.
export const makeCardStyles = ({ colors, shadow }: Theme) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.lg,
    boxShadow: shadow.card,
  },
});
