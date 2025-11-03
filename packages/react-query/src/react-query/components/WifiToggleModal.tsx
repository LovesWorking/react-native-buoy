import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { macOSColors, Wifi } from "@react-buoy/shared-ui";
import { useWifiState } from "../hooks/useWifiState";

interface WifiToggleModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Modal component for toggling React Query's WiFi/online state.
 * This allows developers to test offline scenarios by toggling the online manager.
 */
export function WifiToggleModal({ visible, onClose }: WifiToggleModalProps) {
  const { isOnline, handleWifiToggle } = useWifiState();

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>WiFi Simulator</Text>
        <Text style={styles.description}>
          Toggle React Query's online state to test offline behavior
        </Text>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.button, isOnline && styles.buttonActive]}
            onPress={handleWifiToggle}
            accessibilityRole="button"
            accessibilityLabel={`WiFi ${isOnline ? "On" : "Off"}`}
            accessibilityHint="Tap to toggle WiFi state"
          >
            <Wifi
              size={40}
              color={isOnline ? macOSColors.semantic.success : macOSColors.semantic.error}
            />
            <Text style={[styles.status, isOnline && styles.statusOnline]}>
              {isOnline ? "Online" : "Offline"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  content: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 16,
    padding: 32,
    width: "80%",
    maxWidth: 400,
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: macOSColors.text.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: macOSColors.text.secondary,
    textAlign: "center",
    marginBottom: 32,
  },
  toggleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 16,
    backgroundColor: macOSColors.background.hover,
    borderWidth: 2,
    borderColor: macOSColors.border.default,
    minWidth: 160,
  },
  buttonActive: {
    borderColor: macOSColors.semantic.success,
  },
  status: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "600",
    color: macOSColors.semantic.error,
  },
  statusOnline: {
    color: macOSColors.semantic.success,
  },
  closeButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    backgroundColor: macOSColors.semantic.info,
    borderRadius: 8,
  },
  closeButtonText: {
    color: macOSColors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
});

