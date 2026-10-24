// Design tokens: every color, font, size and shadow used by the app, named once.
// Screens and components use these names instead of raw values.

export const colors = {
  primary: "#E8700F", // Orange: buttons, active tab, progress
  primaryText: "#B85509", // Darker orange, readable as text on white or on primaryTint
  primaryTint: "#FCEBDC", // Light orange background, e.g. type badges
  onPrimary: "#FFFFFF", // Text on a primary background
  background: "#F5F2ED", // Warm off-white screen background, so white cards stand out
  surface: "#FFFFFF", // Cards, inputs, headers
  text: "#1C1916", // Warm near-black
  textSecondary: "#6E6760",
  textMuted: "#A39C94", // Placeholders, inactive icons
  border: "#E8E3DC",
  danger: "#D64545",
  dangerTint: "#FDECEC", // Light red background, e.g. "over the goal"
  overlay: "rgba(28, 25, 22, 0.45)", // Dims the screen behind popups
  // The day's calorie card: a warm orange tint, so it stands out from the white cards below.
  hero: "#FFF4E9",
  heroTrack: "#F8DFC8", // Empty part of its progress arc and bars
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

export const shadow = {
  card: "0px 1px 2px rgba(28, 25, 22, 0.04), 0px 6px 20px rgba(28, 25, 22, 0.06)",
};

// Header and background look for every Stack navigator in the app.
export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text, // Back button
  headerTitleStyle: { color: colors.text, fontFamily: fonts.title, fontSize: fontSize.title },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: colors.background },
};

// The shared look of text fields, dropdowns and the search box.
export const inputBox = {
  backgroundColor: colors.surface,
  borderWidth: 1,
  borderColor: colors.border,
  borderRadius: radius.input,
  paddingHorizontal: spacing.md,
  paddingVertical: 10,
};
