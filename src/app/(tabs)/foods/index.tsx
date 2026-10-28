import { router, Stack, useFocusEffect } from "expo-router";
import { useSQLiteContext } from "expo-sqlite";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Card } from "@/components/card";
import { HeaderButton } from "@/components/header-button";
import { Icon } from "@/components/icon";
import { IconButton } from "@/components/icon-button";
import { Select } from "@/components/select";
import { FOOD_TYPE_KEYS, type FoodType } from "@/constants/food";
import { fontSize, fonts, inputBox, radius, spacing, type Theme } from "@/constants/theme";
import { useStyles, useTheme } from "@/hooks/use-theme";
import { type Food, getFoods } from "@/db/foods";
import { unitName, useTranslation } from "@/i18n";
import { normalize } from "@/utils/search";

export default function Foods() {
  const { colors } = useTheme();
  const styles = useStyles(makeStyles);
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const [foods, setFoods] = useState<Food[]>([]);
  // False until the first load finishes, so "no saved foods" never shows while the list is on its way.
  const [loaded, setLoaded] = useState(false);
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
        setLoaded(true);
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
    { key: "all" as const, label: t.foods.allTypes },
    ...FOOD_TYPE_KEYS.filter((type) => foods.some((food) => food.type === type)).map((type) => ({
      key: type,
      label: t.foodTypes[type],
    })),
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
      <Stack.Screen options={{ headerRight: () => <HeaderButton title={t.common.add} onPress={() => openForm()} /> }} />

      <View style={styles.filters}>
        <View style={styles.search}>
          <Icon name="search" color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={t.foods.search}
            placeholderTextColor={colors.textMuted}
            clearButtonMode="while-editing"
          />
        </View>
        <View style={styles.row}>
          <Select
            title={t.foods.type}
            options={typeOptions}
            value={typeFilter}
            // "All types" clears the filter, showing the placeholder again.
            onChange={(key) => setTypeFilter(key === "all" ? null : key)}
            placeholder={t.foods.filterByType}
            style={styles.flex}
          />
          {/* Down arrow = A to Z (the alphabet runs down the list), up arrow = Z to A */}
          <IconButton
            icon={ascending ? "sortAscending" : "sortDescending"}
            onPress={() => setAscending(!ascending)}
            accessibilityLabel={ascending ? t.foods.sortedAToZ : t.foods.sortedZToA}
          />
          <IconButton icon="reset" onPress={resetFilters} accessibilityLabel={t.foods.resetFilters} />
        </View>
      </View>

      {/* A spinner while the first load runs; then the list fades in, instead of appearing all at once. */}
      {!loaded ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <Animated.View entering={FadeIn.duration(250)} style={styles.flex}>
          <FlatList
            data={visibleFoods}
            keyExtractor={(food) => String(food.id)}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.list, visibleFoods.length === 0 && styles.listEmpty]}
            ListEmptyComponent={
              <Animated.Text style={styles.empty} entering={FadeIn.duration(250)}>
                {foods.length === 0 ? t.foods.empty : t.foods.noMatches}
              </Animated.Text>
            }
            renderItem={({ item: food }) => (
              <Pressable accessibilityRole="button" onPress={() => openForm(food.id)}>
                <Card style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.name} numberOfLines={1}>
                      {food.name}
                    </Text>
                    <Text style={styles.badge}>{t.foodTypes[food.type]}</Text>
                  </View>
                  <Text style={styles.details}>
                    {[food.brand, t.foods.per(String(food.reference_amount), unitName(t, food.unit, food.reference_amount))].filter(Boolean).join(" · ")}
                  </Text>
                  {/* Macros first and calories on the right, like the totals on a meal card. */}
                  <View style={styles.nutrition}>
                    <Text style={styles.macro}>
                      {t.macros.proteinShort} {food.protein}
                    </Text>
                    <Text style={styles.macro}>
                      {t.macros.carbsShort} {food.carbs}
                    </Text>
                    <Text style={styles.macro}>
                      {t.macros.fatShort} {food.fat}
                    </Text>
                    <Text style={styles.calories}>{food.calories} kcal</Text>
                  </View>
                </Card>
              </Pressable>
            )}
          />
        </Animated.View>
      )}
    </View>
  );
}

const makeStyles = ({ colors }: Theme) => StyleSheet.create({
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
    gap: spacing.md,
  },
  // With nothing to show, the message sits in the middle of the list's space.
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  empty: {
    fontFamily: fonts.body,
    textAlign: "center",
    color: colors.textSecondary,
  },
  loading: {
    flex: 1,
    justifyContent: "center",
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
    fontFamily: fonts.title,
    color: colors.text,
  },
  badge: {
    fontSize: fontSize.small,
    fontFamily: fonts.bodyBold,
    color: colors.primaryText,
    backgroundColor: colors.primaryTint,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    overflow: "hidden",
  },
  details: {
    fontSize: fontSize.body,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
  nutrition: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  calories: {
    marginLeft: "auto", // Pushes the calories to the right end
    fontSize: fontSize.medium,
    fontFamily: fonts.number,
    color: colors.primaryText,
  },
  macro: {
    fontSize: fontSize.body,
    fontFamily: fonts.body,
    color: colors.textSecondary,
  },
});
