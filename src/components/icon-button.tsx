import { Pressable, StyleSheet } from "react-native";

import { Icon, type IconName } from "@/components/icon";
import { inputBox, pressedStyle, type Theme } from "@/constants/theme";
import { useStyles } from "@/hooks/use-theme";

// A square button with an icon, the same height as text fields.
export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
}: {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  const styles = useStyles(makeStyles);
  return (
    <Pressable accessibilityRole="button" style={({ pressed }) => [styles.button, pressed && pressedStyle]} onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <Icon name={icon} />
    </Pressable>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  button: {
    ...inputBox(colors),
    justifyContent: "center",
    alignItems: "center",
  },
});
