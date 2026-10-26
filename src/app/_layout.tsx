import { Archivo_700Bold } from "@expo-google-fonts/archivo/700Bold";
import { BarlowCondensed_500Medium } from "@expo-google-fonts/barlow-condensed/500Medium";
import { BarlowCondensed_700Bold } from "@expo-google-fonts/barlow-condensed/700Bold";
import { DMSans_400Regular } from "@expo-google-fonts/dm-sans/400Regular";
import { DMSans_500Medium } from "@expo-google-fonts/dm-sans/500Medium";
import { DMSans_600SemiBold } from "@expo-google-fonts/dm-sans/600SemiBold";
import { useFonts } from "expo-font";
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import { useEffect } from "react";

import { stackScreenOptions, type Theme } from "@/constants/theme";
import { migrateDbIfNeeded } from "@/db/migrations";
import { ThemeSettingProvider, useStyles, useTheme } from "@/hooks/use-theme";
import { LanguageProvider } from "@/i18n";

// The navigators' own colors (headers, screen backgrounds, borders), so nothing falls back to
// React Navigation's default white or black look.
const makeNavigationTheme = ({ dark, colors }: Theme) => {
  const base = dark ? DarkTheme : DefaultTheme;
  return {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.background,
      text: colors.text,
      border: colors.border,
    },
  };
};

// Keep the splash screen up until the fonts are ready, so text never flashes in the phone's font.
SplashScreen.preventAutoHideAsync();

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
    <SQLiteProvider databaseName="bitebook.db" onInit={migrateDbIfNeeded}>
      <LanguageProvider>
        <ThemeSettingProvider>
          <Navigation />
        </ThemeSettingProvider>
      </LanguageProvider>
    </SQLiteProvider>
  );
}

// The tabs are one screen of this Stack. Screens outside (tabs), like the food form,
// open on top of the tabs, covering the tab bar. Those forms set their own translated title.
// Separate from RootLayout because it reads the theme, which needs ThemeSettingProvider above it.
function Navigation() {
  const theme = useTheme();
  const navigationTheme = useStyles(makeNavigationTheme);
  const screenOptions = useStyles(stackScreenOptions);

  // The window behind every screen, which shows for a moment while a screen closes. It starts with
  // app.json's dark backgroundColor, so it has to follow the theme, or closing a form flashes dark in light mode.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.colors.background);
  }, [theme]);

  return (
    <ThemeProvider value={navigationTheme}>
      {/* Clock and icons at the top in the color that reads on the background. */}
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <Stack screenOptions={screenOptions}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="food-form" />
        <Stack.Screen name="goal-form" />
        <Stack.Screen name="meal-entry-form" />
        <Stack.Screen name="barcode-scanner" />
      </Stack>
    </ThemeProvider>
  );
}
