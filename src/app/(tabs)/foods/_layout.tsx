import { Stack } from "expo-router";

import { stackScreenOptions } from "@/constants/theme";

export default function FoodsLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen name="index" options={{ title: "Foods" }} />
    </Stack>
  );
}
