import { router, Stack, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useRef, useState } from "react";
import { Button, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Select } from "@/components/select";
import { FOOD_TYPES, type FoodType, foodTypeLabel, unitLabel } from "@/constants/food";
import { type Food, getFoods } from "@/db/foods";

// Lowercase and without accents, so "platano" matches "Plátano".
function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

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
      <Stack.Screen
        options={{ headerRight: () => <Button title="Add" onPress={() => openForm()} /> }}
      />

      <View style={styles.filters}>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or brand"
          placeholderTextColor="#999"
          clearButtonMode="while-editing"
        />
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
          <Pressable
            style={styles.iconButton}
            onPress={() => setAscending(!ascending)}
            accessibilityLabel={ascending ? "Sorted A to Z" : "Sorted Z to A"}
          >
            {/* ↓ = A to Z (the alphabet runs down the list), ↑ = Z to A */}
            <Text style={styles.iconText}>{ascending ? "↓" : "↑"}</Text>
          </Pressable>
          <Pressable style={styles.iconButton} onPress={resetFilters} accessibilityLabel="Reset filters">
            <Text style={styles.iconText}>↺</Text>
          </Pressable>
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
          <Pressable
            style={styles.foodRow}
            onPress={() => openForm(food.id)}
          >
            <Text style={styles.name}>{food.name}</Text>
            <Text style={styles.details}>
              {[food.brand, foodTypeLabel(food.type)].filter(Boolean).join(" · ")}
            </Text>
            <Text style={styles.details}>
              {food.calories} kcal · P {food.protein} · C {food.carbs} · F {food.fat} per{" "}
              {food.reference_amount} {unitLabel(food.unit)}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  filters: {
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  search: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  iconButton: {
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  iconText: {
    fontSize: 18,
  },
  list: {
    padding: 16,
    paddingTop: 8,
    gap: 12,
  },
  empty: {
    textAlign: "center",
    marginTop: 32,
  },
  foodRow: {
    gap: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
  },
  details: {
    color: "#666",
  },
});
