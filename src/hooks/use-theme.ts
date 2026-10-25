import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { darkTheme, lightTheme, type Theme } from "@/constants/theme";

// The current theme. It follows the phone's light/dark setting.
export function useTheme(): Theme {
  return useColorScheme() === "dark" ? darkTheme : lightTheme;
}

// Builds a component's styles from the current theme, and builds them again only when the theme changes.
// `makeStyles` must be defined outside the component, so it stays the same function between renders.
export function useStyles<T>(makeStyles: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => makeStyles(theme), [makeStyles, theme]);
}
