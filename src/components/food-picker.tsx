import { useSQLiteContext } from "expo-sqlite";
import { useEffect, useState } from "react";
import { FlatList, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HeaderButton } from "@/components/header-button";
import { Icon } from "@/components/icon";
import { Select } from "@/components/select";
import { FOOD_TYPE_KEYS, type FoodType } from "@/constants/food";
import { fontSize, fonts, inputBox, radius, spacing, type Theme } from "@/constants/theme";
import { useStyles, useTheme } from "@/hooks/use-theme";
import { type Food, getFoods } from "@/db/foods";
import { unitName, useTranslation } from "@/i18n";
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
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FoodType | null>(null);

  // Load the foods each time the picker opens.
  useEffect(() => {
    if (!visible) return;
    getFoods(db).then((loaded) =>
      setFoods(loaded.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })))
    );
  }, [db, visible]);

  // Clear the search and filter when closing, so the picker starts fresh next time.
  function close() {
    setSearch("");
    setTypeFilter(null);
    onClose();
  }

  // Like the Foods list: only offer types that at least one saved food has, in the fixed list order.
  const typeOptions = [
    { key: "all" as const, label: t.foods.allTypes },
    ...FOOD_TYPE_KEYS.filter((type) => foods.some((food) => food.type === type)).map((type) => ({
      key: type,
      label: t.foodTypes[type],
    })),
  ];

  const query = normalize(search.trim());
  const visibleFoods = foods
    .filter((food) => typeFilter === null || food.type === typeFilter)
    .filter((food) => normalize(`${food.name} ${food.brand ?? ""}`).includes(query));

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      {/* On iOS the sheet already starts below the status bar; on Android the popup covers the whole screen. */}
      <View style={[styles.screen, { paddingTop: Platform.OS === "android" ? insets.top : 0 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>{t.foodPicker.title}</Text>
          <HeaderButton title={t.common.done} onPress={close} />
        </View>

        {/* Search and type filter share one row, half the width each. */}
        <View style={styles.filters}>
          <View style={[styles.search, styles.flex]}>
            <Icon name="search" color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder={t.foodPicker.search}
              placeholderTextColor={colors.textMuted}
              clearButtonMode="while-editing"
            />
          </View>
          <Select
            title={t.foods.type}
            options={typeOptions}
            value={typeFilter}
            // "All types" clears the filter, showing the placeholder again.
            onChange={(key) => setTypeFilter(key === "all" ? null : key)}
            placeholder={t.foods.filterByType}
            style={styles.flex}
          />
        </View>

        <FlatList
          data={visibleFoods}
          keyExtractor={(food) => String(food.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {foods.length === 0 ? t.foodPicker.empty : t.foods.noMatches}
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
                      t.foodPicker.kcalPer(
                        formatNumber(food.calories),
                        formatNumber(food.reference_amount, 1),
                        unitName(t, food.unit, food.reference_amount)
                      ),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Text>
                </View>
                {count > 0 && (
                  <View style={styles.added}>
                    <Icon name="check" size={14} color={colors.primaryText} />
                    <Text style={styles.addedText}>{t.foodPicker.added(count)}</Text>
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

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: fontSize.large,
    fontFamily: fonts.title,
    color: colors.text,
  },
  filters: {
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.lg,
    paddingBottom: 0,
  },
  flex: {
    flex: 1,
  },
  search: {
    ...inputBox(colors),
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 0,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: fontSize.medium,
    fontFamily: fonts.body,
    color: colors.text,
  },
  list: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  empty: {
    fontFamily: fonts.body,
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
    fontFamily: fonts.title,
    color: colors.text,
  },
  details: {
    fontSize: fontSize.small,
    fontFamily: fonts.body,
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
    fontFamily: fonts.bodyBold,
    color: colors.primaryText,
  },
});
