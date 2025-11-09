import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, Button, Text, ScrollView } from "react-native";
import { PokemonScreen } from "../screens/pokemon/Pokemon";
import { useState } from "react";
import { BottomSheet } from "@react-buoy/bottom-sheet";

export default function Index() {
  const [sheetVisible, setSheetVisible] = useState(false);

  return (
    <View style={styles.container}>
      <PokemonScreen />

      {/* Bottom Sheet Demo Button */}
      <View style={styles.demoButtonContainer}>
        <Button
          title="Open Bottom Sheet Demo"
          onPress={() => setSheetVisible(true)}
        />
      </View>

      {/* Bottom Sheet Demo */}
      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        header={{
          title: "Bottom Sheet Demo",
          subtitle: "Drag to resize • Double tap to toggle mode • Triple tap to close"
        }}
        initialHeight={400}
        minHeight={150}
      >
        <ScrollView style={styles.sheetContent}>
          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Welcome to Bottom Sheet! 🎉</Text>
            <Text style={styles.sectionText}>
              This is a high-performance bottom sheet component built with React Native.
            </Text>
          </View>

          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Features:</Text>
            <Text style={styles.featureItem}>• 60 FPS smooth animations</Text>
            <Text style={styles.featureItem}>• Drag to resize</Text>
            <Text style={styles.featureItem}>• Bottom sheet & floating window modes</Text>
            <Text style={styles.featureItem}>• Double tap header to toggle mode</Text>
            <Text style={styles.featureItem}>• Triple tap header to close</Text>
            <Text style={styles.featureItem}>• Fully customizable theme</Text>
          </View>

          <View style={styles.contentSection}>
            <Text style={styles.sectionTitle}>Try it out:</Text>
            <Text style={styles.sectionText}>
              1. Drag the header up or down to resize
            </Text>
            <Text style={styles.sectionText}>
              2. Double tap the header to switch to floating mode
            </Text>
            <Text style={styles.sectionText}>
              3. In floating mode, drag corners to resize
            </Text>
            <Text style={styles.sectionText}>
              4. Triple tap to close, or use the button below
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              title="Close Bottom Sheet"
              onPress={() => setSheetVisible(false)}
              color="#FF5252"
            />
          </View>

          <View style={styles.spacer} />
        </ScrollView>
      </BottomSheet>

      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  demoButtonContainer: {
    position: "absolute",
    top: 60,
    right: 20,
    zIndex: 100,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  sheetContent: {
    flex: 1,
    padding: 20,
  },
  contentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#1F2937",
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#4B5563",
    marginBottom: 8,
  },
  featureItem: {
    fontSize: 16,
    lineHeight: 28,
    color: "#4B5563",
  },
  buttonContainer: {
    marginTop: 12,
    marginBottom: 20,
  },
  spacer: {
    height: 40,
  },
});
