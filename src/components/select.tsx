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
        <Text style={styles.placeholder}>▾</Text>
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
              renderItem={({ item: option }) => (
                <Pressable
                  style={styles.option}
                  onPress={() => {
                    onChange(option.key);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.text, option.key === value && styles.optionSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  // Matches the text field style in the food form.
  select: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectError: {
    borderColor: "#d32f2f",
  },
  text: {
    fontSize: 16,
  },
  // Long labels are cut off with "…" instead of wrapping onto a second line.
  shrink: {
    flexShrink: 1,
  },
  placeholder: {
    color: "#999",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: 32,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  sheet: {
    maxHeight: "70%",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  optionSelected: {
    color: "#208AEF",
    fontWeight: "600",
  },
});
