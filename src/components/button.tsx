import { Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";

import { colors, fontSize, fonts, radius, spacing } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// "primary": filled orange button for the main action. "secondary": soft grey fill, e.g. Cancel.
// "danger": red text on a light red fill for destructive actions.
// The button shrinks a little while pressed, like a physical key.
// `disabled` greys the button out and ignores taps; show the reason nearby so the user knows why.
export function Button({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      style={[styles.button, buttonStyles[variant], disabled && styles.disabled, pressStyle, style]}
      onPress={onPress}
      onPressIn={() => scale.set(withSpring(0.96, { duration: 150 }))}
      onPressOut={() => scale.set(withSpring(1, { duration: 250 }))}
      disabled={disabled}
      accessibilityState={{ disabled }}
    >
      <Text style={[styles.text, textStyles[variant]]}>{title}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.button,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: fontSize.medium,
    fontFamily: fonts.bodyBold,
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

const buttonStyles = StyleSheet.create({
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.background,
  },
  danger: {
    backgroundColor: colors.dangerTint,
  },
});

const textStyles = StyleSheet.create({
  primary: {
    color: colors.onPrimary,
  },
  secondary: {
    color: colors.text,
  },
  danger: {
    color: colors.danger,
  },
});
