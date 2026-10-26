import { SymbolView, type SymbolViewProps } from "expo-symbols";
import { StyleSheet } from "react-native";

import { useTheme } from "@/hooks/use-theme";

// Icons used in the app: SF Symbols on iOS, Material Symbols on Android.
const ICONS = {
  search: { ios: "magnifyingglass", android: "search" },
  sortAscending: { ios: "arrow.down", android: "arrow_downward" },
  sortDescending: { ios: "arrow.up", android: "arrow_upward" },
  reset: { ios: "arrow.counterclockwise", android: "refresh" },
  chevronDown: { ios: "chevron.down", android: "expand_more" },
  chevronUp: { ios: "chevron.up", android: "expand_less" },
  chevronRight: { ios: "chevron.right", android: "chevron_right" },
  chevronLeft: { ios: "chevron.left", android: "chevron_left" },
  calendar: { ios: "calendar", android: "calendar_month" },
  close: { ios: "xmark", android: "close" },
  check: { ios: "checkmark", android: "check" },
  trash: { ios: "trash", android: "delete" },
  barcode: { ios: "barcode.viewfinder", android: "barcode_scanner" },
  flashOn: { ios: "bolt.fill", android: "flash_on" },
  flashOff: { ios: "bolt.slash.fill", android: "flash_off" },
} satisfies Record<string, SymbolViewProps["name"]>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: string }) {
  const { colors } = useTheme();
  // On Android the icon is a letter of an icon font, which sits a little low in its box; centering fixes it.
  return (
    <SymbolView name={ICONS[name]} size={size} tintColor={color ?? colors.textSecondary} style={styles.centered} />
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
});
