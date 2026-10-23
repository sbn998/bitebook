import { Text, View, StyleSheet } from "react-native";

export default function Foods() {
  return (
    <View style={styles.container}>
      <Text>Foods</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
