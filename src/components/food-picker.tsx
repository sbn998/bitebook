import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeaderButton } from "@/components/header-button";
import { Icon } from "@/components/icon";
import { unitLabel } from "@/constants/food";
import { colors, fontSize, inputBox, radius, spacing } from "@/constants/theme";
import { type Food, getFoods } from "@/db/foods";
import { formatNumber } from "@/utils/nutrition";
import { normalize } from "@/utils/search";

// A full-height popup listing the saved foods, with search. It stays open so several foods
// can be picked in a row: each tap calls onPick, and Done closes it.
// `pickedCounts` (food id -> times picked) shows a "✓ added" mark on foods already picked.
export function FoodPicker({
  visible,
  onPick,
  onClose,
  pickedCounts,
}: {
  visible: boolean;
  onPick: (food: Food) => void;
  onClose: () => void;
  pickedCounts: Record<number, number>;
}) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState("");

  // Load the foods each time the picker opens.
  useEffect(() => {
    if (!visible) return;
    getFoods(db).then((loaded) =>
      setFoods(loaded.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })))
    );
  }, [db, visible]);

  // Clear the search when closing, so the picker starts fresh next time.
  function close() {
    setSearch("");
    onClose();
  }

  const query = normalize(search.trim());
  const visibleFoods = foods.filter((food) => normalize(`${food.name} ${food.brand ?? ""}`).includes(query));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      {/* On iOS the sheet already starts below the status bar; on Android the popup covers the whole screen. */}
      <View style={[styles.screen, { paddingTop: Platform.OS === "android" ? insets.top : 0 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Add food</Text>
          <HeaderButton title="Done" onPress={close} />
        </View>

        <View style={styles.search}>
          <Icon name="search" color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or brand"
            placeholderTextColor={colors.textMuted}
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          data={visibleFoods}
          keyExtractor={(food) => String(food.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {foods.length === 0 ? "No foods yet. Add them in the Foods tab." : "No foods match your search"}
            </Text>
          }
          renderItem={({ item: food }) => {
            const count = pickedCounts[food.id] ?? 0;
            return (
              <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={() => onPick(food)}>
                <View style={styles.rowText}>
                  <Text style={styles.name} numberOfLines={1}>
                    {food.name}
                  </Text>
                  <Text style={styles.details} numberOfLines={1}>
                    {[
                      food.brand,
                      `${formatNumber(food.calories)} kcal per ${formatNumber(food.reference_amount, 1)} ${unitLabel(food.unit)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                {count > 0 && (
                  <View style={styles.added}>
                    <Icon name="check" size={14} color={colors.primaryText} />
                    <Text style={styles.addedText}>{count > 1 ? `added ×${count}` : "added"}</Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: fontSize.large,
    fontWeight: "600",
    color: colors.text,
  },
  search: {
    ...inputBox,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 0,
    margin: spacing.lg,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: fontSize.medium,
    color: colors.text,
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  empty: {
    textAlign: "center",
    marginTop: spacing.xxl,
    color: colors.textSecondary,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.input,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: fontSize.medium,
    fontWeight: "600",
    color: colors.text,
  },
  details: {
    fontSize: fontSize.small,
    color: colors.textSecondary,
  },
  added: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  addedText: {
    fontSize: fontSize.small,
    fontWeight: "600",
    color: colors.primaryText,
  },
});
