import { router, Stack } from "expo-router";
import { Button } from "react-native";

export default function FoodsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: "Foods",
          headerRight: () => <Button title="Add" onPress={() => router.push("/food-form")} />,
        }}
      />
    </Stack>
  );
}
