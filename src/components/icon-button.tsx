import { Pressable, StyleSheet } from "react-native";

import { Icon, type IconName } from "@/components/icon";
import { inputBox } from "@/constants/theme";

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
  return (
    <Pressable style={styles.button} onPress={onPress} accessibilityLabel={accessibilityLabel}>
      <Icon name={icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    ...inputBox,
    justifyContent: "center",
    alignItems: "center",
  },
});
