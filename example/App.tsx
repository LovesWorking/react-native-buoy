import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import {
  Package1Component,
  FloatingMenu,
  type InstalledApp,
} from "@monorepo/package-1";
import { Package2Component } from "@monorepo/package-2";
import { EnvLaptopIcon } from "@monorepo/shared";

export default function App() {
  const installedApps: InstalledApp[] = [
    {
      id: "env",
      name: "ENV",
      slot: "both",
      icon: ({ size }: { size: number }) => (
        <EnvLaptopIcon size={size} color="#9f6" glowColor="#9f6" noBackground />
      ),
      onPress: () =>
        new Promise<void>((resolve) => {
          resolve();
        }),
    },
  ];
  return (
    <View style={styles.container}>
      <FloatingMenu apps={installedApps} actions={{}} />
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
