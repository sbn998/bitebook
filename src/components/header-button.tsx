import { Pressable, StyleSheet, Text } from "react-native";

import { colors, fontSize, fonts, spacing } from "@/constants/theme";

// Orange text button for a screen's header, e.g. "Add".
export function HeaderButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={spacing.sm}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: fontSize.medium,
    fontFamily: fonts.bodyBold,
    color: colors.primaryText,
  },
});
