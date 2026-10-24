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
import { colors, fontSize, inputBox, radius, shadow, spacing } from "@/constants/theme";

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
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.key === value);

  return (
    <>
      <Pressable
        style={[styles.select, hasError && styles.selectError, style]}
        onPress={() => setOpen(true)}
      >
        <Text style={[styles.text, styles.shrink, !selected && styles.placeholder]} numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Icon name="chevronDown" color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          {/* Tapping outside the list closes it. */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{title}</Text>
            <FlatList
              data={options}
              keyExtractor={(option) => option.key}
              renderItem={({ item: option }) => {
                const isSelected = option.key === value;
                return (
                  <Pressable
                    style={[styles.option, isSelected && styles.optionSelected]}
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

const styles = StyleSheet.create({
  select: {
    ...inputBox,
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
    fontWeight: "600",
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
    fontWeight: "600",
  },
});
