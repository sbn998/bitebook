import { Stack } from "expo-router";

import { stackScreenOptions } from "@/constants/theme";
import { useTranslation } from "@/i18n";

export default function SettingsLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: t.settings.title }} />
      <Stack.Screen name="meals" options={{ title: t.meals.title }} />
      <Stack.Screen name="goals" options={{ title: t.goals.title }} />
    </Stack>
  );
}
