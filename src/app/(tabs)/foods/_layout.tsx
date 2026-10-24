import { Stack } from "expo-router";

import { stackScreenOptions } from "@/constants/theme";
import { useTranslation } from "@/i18n";

export default function FoodsLayout() {
  const { t } = useTranslation();

  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: t.foods.title }} />
    </Stack>
  );
}
