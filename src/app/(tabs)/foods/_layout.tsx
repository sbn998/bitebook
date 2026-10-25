import { Stack } from "expo-router";

import { stackScreenOptions } from "@/constants/theme";
import { useStyles } from "@/hooks/use-theme";
import { useTranslation } from "@/i18n";

export default function FoodsLayout() {
  const { t } = useTranslation();
  const screenOptions = useStyles(stackScreenOptions);

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="index" options={{ title: t.foods.title }} />
    </Stack>
  );
}
