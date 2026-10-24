import { Text, View, StyleSheet } from "react-native";

import { colors } from "@/constants/theme";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Main</Text>
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
