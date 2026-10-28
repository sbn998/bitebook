// Design tokens: every color, font, size and shadow used by the app, named once.
// Screens and components use these names instead of raw values.

// Screens read the current palette with useTheme or useStyles (hooks/use-theme.ts), never these directly,
// so they redraw when the theme changes.
const lightColors = {
  primary: "#E8700F", // Orange: buttons, active tab, progress
  primaryText: "#B85509", // Darker orange, readable as text on white or on primaryTint
  primaryTint: "#FCEBDC", // Light orange background, e.g. type badges
  onPrimary: "#FFFFFF", // Text on a primary background
  background: "#F5F2ED", // Warm off-white screen background, so white cards stand out
  surface: "#FFFFFF", // Cards, inputs, headers
  text: "#1C1916", // Warm near-black
  textSecondary: "#6E6760",
  textMuted: "#A39C94", // Placeholders and inactive icons only: too light for text people need to read
  border: "#E8E3DC",
  danger: "#D64545",
  dangerTint: "#FDECEC", // Light red background, e.g. "over the goal"
  overlay: "rgba(28, 25, 22, 0.45)", // Dims the screen behind popups
  // The day's calorie card: a warm orange tint, so it stands out from the white cards below.
  hero: "#FFF4E9",
  heroTrack: "#F8DFC8", // Empty part of its progress arc and bars, and the selected tab's pill
};

export type Colors = typeof lightColors;

// The same names with warm dark values. The orange stays the same; the colors made from it
// (text, tints) change, because pale oranges would glow and dark orange text would disappear on dark.
const darkColors: Colors = {
  primary: "#E8700F",
  primaryText: "#FF9A4A", // Lighter orange, readable as text on dark or on primaryTint
  primaryTint: "#3A2515", // Deep orange-brown background, e.g. type badges
  onPrimary: "#FFFFFF",
  background: "#14110F", // Warm near-black screen background
  surface: "#1F1B18", // Cards stand out by being lighter, since shadows barely show on dark
  text: "#F3EEE8",
  textSecondary: "#A89F96",
  textMuted: "#6F675F",
  border: "#2E2925",
  danger: "#F06A5E", // Brighter red, readable on dark
  dangerTint: "#3A1C1A",
  overlay: "rgba(0, 0, 0, 0.6)",
  hero: "#2A1E15",
  heroTrack: "#4A3220",
};

// Each font has one job: Archivo for titles, Barlow Condensed for numbers, DM Sans for everything else.
// Custom fonts come in one file per weight, so pick the weight here instead of using fontWeight.
export const fonts = {
  title: "Archivo_700Bold",
  number: "BarlowCondensed_700Bold", // Big numbers, like the day's calories
  numberMedium: "BarlowCondensed_500Medium", // Small numbers next to text
  body: "DMSans_400Regular",
  bodyMedium: "DMSans_500Medium",
  bodyBold: "DMSans_600SemiBold",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  input: 12,
  button: 14,
  card: 20,
  pill: 999, // Fully rounded ends
};

export const fontSize = {
  small: 12,
  body: 14,
  medium: 16,
  large: 18,
  title: 22,
};

const lightShadow = {
  card: "0px 1px 2px rgba(28, 25, 22, 0.04), 0px 6px 20px rgba(28, 25, 22, 0.06)",
};

const darkShadow: typeof lightShadow = {
  card: "0px 1px 2px rgba(0, 0, 0, 0.3), 0px 6px 20px rgba(0, 0, 0, 0.25)",
};

export type Theme = { dark: boolean; colors: Colors; shadow: typeof lightShadow };

export const lightTheme: Theme = { dark: false, colors: lightColors, shadow: lightShadow };
export const darkTheme: Theme = { dark: true, colors: darkColors, shadow: darkShadow };

// Header and background look for every Stack navigator in the app.
export const stackScreenOptions = ({ colors }: Theme) => ({
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text, // Back button
  headerTitleStyle: { color: colors.text, fontFamily: fonts.title, fontSize: fontSize.title },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
});

// The shared look of text fields, dropdowns and the search box.
export const inputBox = (colors: Colors) => ({
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.input,
  paddingHorizontal: spacing.md,
  paddingVertical: 10,
});
