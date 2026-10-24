import { router, Stack, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useRef, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/card";
import { HeaderButton } from "@/components/header-button";
import { Icon } from "@/components/icon";
import { IconButton } from "@/components/icon-button";
import { Select } from "@/components/select";
import { FOOD_TYPES, type FoodType, foodTypeLabel, unitLabel } from "@/constants/food";
import { colors, fontSize, inputBox, radius, spacing } from "@/constants/theme";
import { type Food, getFoods } from "@/db/foods";
import { normalize } from "@/utils/search";

export default function Foods() {
  const db = useSQLiteContext();
  const [foods, setFoods] = useState<Food[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<FoodType | null>(null);
  const [ascending, setAscending] = useState(true);
  // True while opening the food form, so leaving for the form doesn't reset the filters.
  const openingForm = useRef(false);

  function openForm(id?: number) {
    openingForm.current = true;
    router.push(id === undefined ? "/food-form" : { pathname: "/food-form", params: { id } });
  }

  function resetFilters() {
    setSearch("");
    setTypeFilter(null);
    setAscending(true);
  }

  // Reload every time the screen comes into view, e.g. after adding a food.
  useFocusEffect(
    useCallback(() => {
      getFoods(db).then((loaded) => {
        setFoods(loaded);
        // If the filtered type no longer has any foods (e.g. its last food was deleted), clear the filter.
        setTypeFilter((type) => (type && loaded.some((food) => food.type === type) ? type : null));
      });

      // Runs when the screen leaves view: reset the filters, unless we're opening the food form.
      return () => {
        if (openingForm.current) {
          openingForm.current = false;
        } else {
          setSearch("");
          setTypeFilter(null);
          setAscending(true);
        }
      };
    }, [db])
  );

  // Only offer types that at least one saved food has, in the fixed list order.
  const typeOptions = [
    { key: "all" as const, label: "All types" },
    ...FOOD_TYPES.filter((type) => foods.some((food) => food.type === type.key)),
  ];

  // Filtering and sorting happen in the app, since all foods are already loaded.
  const query = normalize(search.trim());
  const visibleFoods = foods
    .filter((food) => typeFilter === null || food.type === typeFilter)
    .filter((food) => normalize(`${food.name} ${food.brand ?? ""}`).includes(query))
    .sort((a, b) => {
      const order = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      return ascending ? order : -order;
    });

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerRight: () => <HeaderButton title="Add" onPress={() => openForm()} /> }} />

      <View style={styles.filters}>
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
        <View style={styles.row}>
          <Select
            title="Type"
            options={typeOptions}
            value={typeFilter}
            // "All types" clears the filter, showing the placeholder again.
            onChange={(key) => setTypeFilter(key === "all" ? null : key)}
            placeholder="Filter by type"
            style={styles.flex}
          />
          {/* Down arrow = A to Z (the alphabet runs down the list), up arrow = Z to A */}
          <IconButton
            icon={ascending ? "sortAscending" : "sortDescending"}
            onPress={() => setAscending(!ascending)}
            accessibilityLabel={ascending ? "Sorted A to Z" : "Sorted Z to A"}
          />
          <IconButton icon="reset" onPress={resetFilters} accessibilityLabel="Reset filters" />
        </View>
      </View>

      <FlatList
        data={visibleFoods}
        keyExtractor={(food) => String(food.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>{foods.length === 0 ? "No foods yet" : "No foods match your filters"}</Text>
        }
        renderItem={({ item: food }) => (
          <Pressable onPress={() => openForm(food.id)}>
            <Card style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name} numberOfLines={1}>
                  {food.name}
                </Text>
                <Text style={styles.badge}>{foodTypeLabel(food.type)}</Text>
              </View>
              <Text style={styles.details}>
                {[food.brand, `per ${food.reference_amount} ${unitLabel(food.unit)}`].filter(Boolean).join(" · ")}
              </Text>
              <View style={styles.nutrition}>
                <Text style={styles.calories}>{food.calories} kcal</Text>
                <Text style={styles.macro}>P {food.protein}</Text>
                <Text style={styles.macro}>C {food.carbs}</Text>
                <Text style={styles.macro}>F {food.fat}</Text>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  filters: {
    padding: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  search: {
    ...inputBox,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: 0,
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
    gap: spacing.md,
  },
  empty: {
    textAlign: "center",
    marginTop: spacing.xxl,
    color: colors.textSecondary,
  },
  card: {
    gap: spacing.xs,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontSize: fontSize.medium,
    fontWeight: "600",
    color: colors.text,
  },
  badge: {
    fontSize: fontSize.small,
    fontWeight: "600",
    color: colors.primaryText,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: "hidden",
  },
  details: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
  nutrition: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  calories: {
    fontSize: fontSize.body,
    fontWeight: "600",
    color: colors.primaryText,
  },
  macro: {
    fontSize: fontSize.body,
    color: colors.textSecondary,
  },
});
