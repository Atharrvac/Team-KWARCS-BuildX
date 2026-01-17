import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

export default function LoadingSpinner({ message = "Loading...", size = "large" }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size={size} color="#16a34a" />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  content: {
    alignItems: "center",
    gap: 16,
  },
  message: {
    fontSize: 16,
    color: '#7F8C8D',
    textAlign: "center",
  },
});
