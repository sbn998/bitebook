import { Stack } from "expo-router";

import { stackScreenOptions } from "@/constants/theme";

export default function SettingsLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: "Settings" }} />
      <Stack.Screen name="meals" options={{ title: "Meal labels" }} />
      <Stack.Screen name="goals" options={{ title: "Your goals" }} />
    </Stack>
  );
}
