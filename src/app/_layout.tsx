import { Stack } from "expo-router";
import { SQLiteProvider } from "expo-sqlite";

import { stackScreenOptions } from "@/constants/theme";
import { migrateDbIfNeeded } from "@/db/migrations";
import { LanguageProvider } from "@/i18n";

// The tabs are one screen of this Stack. Screens outside (tabs), like the food form,
// open on top of the tabs, covering the tab bar. Those forms set their own translated title.
export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="macro-tracker.db" onInit={migrateDbIfNeeded}>
      <LanguageProvider>
        <Stack screenOptions={stackScreenOptions}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="food-form" />
          <Stack.Screen name="goal-form" />
          <Stack.Screen name="meal-entry-form" />
        </Stack>
      </LanguageProvider>
    </SQLiteProvider>
  );
}
