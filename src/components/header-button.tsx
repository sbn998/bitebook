import { Pressable, StyleSheet, Text } from "react-native";

import { fontSize, fonts, pressedStyle, spacing, type Theme } from "@/constants/theme";
import { useStyles } from "@/hooks/use-theme";

// Orange text button for a screen's header, e.g. "Add".
export function HeaderButton({ title, onPress }: { title: string; onPress: () => void }) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => pressed && pressedStyle} onPress={onPress} hitSlop={spacing.sm}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  text: {
    fontSize: fontSize.medium,
    fontFamily: fonts.bodyBold,
    color: colors.primaryText,
  },
});
