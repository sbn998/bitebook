import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { stackScreenOptions } from "@/constants/theme";
import { migrateDbIfNeeded } from "@/db/migrations";

// The tabs are one screen of this Stack. Screens outside (tabs), like the food form,
// open on top of the tabs, covering the tab bar.
export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="macro-tracker.db" onInit={migrateDbIfNeeded}>
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="food-form" options={{ title: "Add food" }} />
        <Stack.Screen name="goal-form" options={{ title: "Add goal" }} />
        <Stack.Screen name="meal-entry-form" options={{ title: "Add meal" }} />
      </Stack>
    </SQLiteProvider>
  );
}
