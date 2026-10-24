import { Archivo_700Bold } from "@expo-google-fonts/archivo/700Bold";
import { BarlowCondensed_500Medium } from "@expo-google-fonts/barlow-condensed/500Medium";
import { BarlowCondensed_700Bold } from "@expo-google-fonts/barlow-condensed/700Bold";
import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_500Medium } from "@expo-google-fonts/dm-sans/500Medium";
import { DMSans_600SemiBold } from "@expo-google-fonts/dm-sans/600SemiBold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { useEffect } from "react";

import { stackScreenOptions } from "@/constants/theme";
import { migrateDbIfNeeded } from "@/db/migrations";
import { LanguageProvider } from "@/i18n";

// Keep the splash screen up until the fonts are ready, so text never flashes in the phone's font.
SplashScreen.preventAutoHideAsync();

// The tabs are one screen of this Stack. Screens outside (tabs), like the food form,
// open on top of the tabs, covering the tab bar. Those forms set their own translated title.
export default function RootLayout() {
  // The names here are the fontFamily names used in theme.ts.
  const [loaded, error] = useFonts({
    Archivo_700Bold,
    BarlowCondensed_500Medium,
    BarlowCondensed_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  // If a font fails to load, the app still opens with the phone's font.
  if (!loaded && !error) return null;

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
