import { StyleSheet, Text, View } from "react-native";

import { HeaderButton } from "@/components/header-button";
import { fontSize, fonts, spacing, type Theme } from "@/constants/theme";
import { useStyles } from "@/hooks/use-theme";

// What a list shows when it has nothing to show: a short message and, if there is one, a link to the next step.
// Every list uses it, so they all look the same. Put it in the middle of the free space.
export function EmptyState({
  message,
  actionTitle,
  onAction,
}: {
  message: string;
  actionTitle?: string;
  onAction?: () => void;
}) {
  const styles = useStyles(makeStyles);
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {actionTitle && onAction && <HeaderButton title={actionTitle} onPress={onAction} />}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  container: {
    alignItems: "center",
    gap: spacing.sm,
  },
  message: {
    fontSize: fontSize.medium,
    fontFamily: fonts.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
