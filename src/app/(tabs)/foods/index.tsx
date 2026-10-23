import { router, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text } from "react-native";

import { foodTypeLabel, unitLabel } from "@/constants/food";
import { type Food, getFoods } from "@/db/foods";

export default function Foods() {
  const db = useSQLiteContext();
  const [foods, setFoods] = useState<Food[]>([]);

  // Reload every time the screen comes into view, e.g. after adding a food.
  useFocusEffect(
    useCallback(() => {
      getFoods(db).then(setFoods);
    }, [db])
  );

  return (
    <FlatList
      data={foods}
      keyExtractor={(food) => String(food.id)}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No foods yet</Text>}
      renderItem={({ item: food }) => (
        <Pressable
          style={styles.row}
          onPress={() => router.push({ pathname: "/food-form", params: { id: food.id } })}
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
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    gap: 12,
  },
  empty: {
    textAlign: "center",
    marginTop: 32,
  },
  row: {
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
