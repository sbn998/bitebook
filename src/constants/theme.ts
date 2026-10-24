// Design tokens: every color, size and shadow used by the app, named once.
// Screens and components use these names instead of raw values.

export const colors = {
  primary: "#E8700F", // Orange: buttons, active tab
  primaryText: "#B85509", // Darker orange, readable as text on white or on primaryTint
  primaryTint: "#FFF0E3", // Light orange background, e.g. type badges
  onPrimary: "#FFFFFF", // Text on a primary background
  background: "#F4F5F7", // Screen background, so white cards stand out
  surface: "#FFFFFF", // Cards, inputs, headers
  text: "#1F2328",
  textSecondary: "#6B7280",
  textMuted: "#9AA0A6", // Placeholders, inactive icons
  border: "#E3E5E8",
  danger: "#D64545",
  overlay: "rgba(0, 0, 0, 0.4)", // Dims the screen behind popups
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
  card: 16,
  pill: 999, // Fully rounded ends
};

export const fontSize = {
  small: 12,
  body: 14,
  medium: 16,
  large: 18,
};

export const shadow = {
  card: "0px 2px 8px rgba(16, 24, 40, 0.08)",
};

// Header and background look for every Stack navigator in the app.
export const stackScreenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.primaryText, // Back button
  headerTitleStyle: { color: colors.text },
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
