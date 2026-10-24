import { Text, View, StyleSheet } from "react-native";

import { colors } from "@/constants/theme";

export default function Settings() {
  return (
    <View style={styles.container}>
      <Text>Settings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
