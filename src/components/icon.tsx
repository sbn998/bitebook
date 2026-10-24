import { SymbolView, type SymbolViewProps } from "expo-symbols";

import { colors } from "@/constants/theme";

// Icons used in the app: SF Symbols on iOS, Material Symbols on Android.
const ICONS = {
  search: { ios: "magnifyingglass", android: "search" },
  sortAscending: { ios: "arrow.down", android: "arrow_downward" },
  sortDescending: { ios: "arrow.up", android: "arrow_upward" },
  reset: { ios: "arrow.counterclockwise", android: "refresh" },
  chevronDown: { ios: "chevron.down", android: "expand_more" },
} satisfies Record<string, SymbolViewProps["name"]>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color = colors.textSecondary }: { name: IconName; size?: number; color?: string }) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
