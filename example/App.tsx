import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { Package1Component } from "@monorepo/package-1";
import { Package2Component } from "@monorepo/package-2";

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Monorepo Test App</Text>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.subtitle}>Packages loaded via workspace:</Text>
        <Package1Component />
        <Package2Component />
      </ScrollView>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 50,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    color: "#666",
  },
  scrollView: {
    flex: 1,
  },
});
