import Storage from "expo-sqlite/kv-store";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, useColorScheme } from "react-native";

import { darkTheme, lightTheme, type Theme } from "@/constants/theme";

// What the user picked in Settings: "auto" follows the phone, the others force a theme.
export type ThemeSetting = "auto" | "light" | "dark";

// Kept apart from the food data, like the language.
const STORAGE_KEY = "theme";

function startingSetting(): ThemeSetting {
  const saved = Storage.getItemSync(STORAGE_KEY);
  return saved === "light" || saved === "dark" ? saved : "auto";
}

const ThemeSettingContext = createContext<{
  themeSetting: ThemeSetting;
  setThemeSetting: (setting: ThemeSetting) => void;
}>({ themeSetting: "auto", setThemeSetting: () => {} });

// Wraps the app so every screen knows the theme picked in Settings. The choice is plain React state,
// so changing it redraws every screen in the same render, all at once.
export function ThemeSettingProvider({ children }: { children: ReactNode }) {
  const [themeSetting, setThemeSettingState] = useState(startingSetting);

  function setThemeSetting(next: ThemeSetting) {
    Storage.setItemSync(STORAGE_KEY, next);
    setThemeSettingState(next);
  }

  // Also tells Android, so the parts it draws itself (the window behind the screens, which shows for a
  // moment while a form closes) match. Runs after the screens have redrawn, so they never wait for it.
  useEffect(() => {
    Appearance.setColorScheme(themeSetting);
  }, [themeSetting]);

  return <ThemeSettingContext value={{ themeSetting, setThemeSetting }}>{children}</ThemeSettingContext>;
}

// The setting itself, for the Settings screen.
export function useThemeSetting() {
  return useContext(ThemeSettingContext);
}

// The current theme: the one picked in Settings, or the phone's light/dark setting.
export function useTheme(): Theme {
  const { themeSetting } = useContext(ThemeSettingContext);
  const phoneScheme = useColorScheme();
  const scheme = themeSetting === "auto" ? phoneScheme : themeSetting;
  return scheme === "dark" ? darkTheme : lightTheme;
}

// Builds a component's styles from the current theme, and builds them again only when the theme changes.
// `makeStyles` must be defined outside the component, so it stays the same function between renders.
export function useStyles<T>(makeStyles: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => makeStyles(theme), [makeStyles, theme]);
}
