import { useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  type StyleProp,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";

import { Icon } from "@/components/icon";
import { fontSize, fonts, inputBox, pressedStyle, radius, spacing, type Theme } from "@/constants/theme";
import { useStyles, useTheme } from "@/hooks/use-theme";

// A box that looks like a text field and opens a list of options when tapped.
export function Select<K extends string>({
  title,
  options,
  value,
  onChange,
  placeholder,
  hasError,
  style,
}: {
  title: string;
  options: readonly { key: K; label: string }[];
  value: K | null;
  onChange: (key: K) => void;
  placeholder?: string;
  hasError?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.key === value);

  return (
    <>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [styles.select, hasError && styles.selectError, style, pressed && pressedStyle]}
        accessibilityLabel={`${title}, ${selected?.label ?? placeholder ?? ""}`}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.text, styles.shrink, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevronDown" color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          {/* Tapping outside the list closes it. Hidden from screen readers, so they start at the title; they close it with Back. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} importantForAccessibility="no" accessible={false} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <FlatList
              data={options}
              keyExtractor={(option) => option.key}
              renderItem={({ item: option }) => {
                const isSelected = option.key === value;
                return (
                  <Pressable
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.option, isSelected && styles.optionSelected, pressed && pressedStyle]}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      onChange(option.key);
                      setOpen(false);
                    }}
                  >
                    <Text style={[styles.text, isSelected && styles.optionSelectedText]}>{option.label}</Text>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const makeStyles = ({ colors, shadow }: Theme) => StyleSheet.create({
  select: {
    ...inputBox(colors),
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.xs,
  },
  selectError: {
    borderColor: colors.danger,
  },
  text: {
    fontSize: fontSize.medium,
    fontFamily: fonts.body,
    color: colors.text,
  },
  // Long labels are cut off with "…" instead of wrapping onto a second line.
  shrink: {
    flexShrink: 1,
  },
  placeholder: {
    color: colors.textMuted,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xxl,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: "70%",
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing.sm,
    boxShadow: shadow.card,
  },
  sheetTitle: {
    fontSize: fontSize.large,
    fontFamily: fonts.title,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.input,
  },
  optionSelected: {
    backgroundColor: colors.primaryTint,
  },
  optionSelectedText: {
    color: colors.primaryText,
    fontFamily: fonts.bodyBold,
  },
});
