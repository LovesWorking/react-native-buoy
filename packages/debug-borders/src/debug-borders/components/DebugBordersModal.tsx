import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { macOSColors, Layers, StatusBadge, StatusIndicator } from "@react-buoy/shared-ui";
import type { DebugBordersModalProps } from "../types";

const DebugBordersManager = require("../utils/DebugBordersManager");

/**
 * Modal component for controlling debug borders.
 * This allows developers to toggle visual layout debugging borders on/off.
 */
export function DebugBordersModal({ visible, onClose }: DebugBordersModalProps & { visible: boolean; onClose: () => void }) {
  const [enabled, setEnabled] = useState(false);
  const [componentCount, setComponentCount] = useState(0);

  // Subscribe to manager state
  useEffect(() => {
    const unsubscribe = DebugBordersManager.subscribe(setEnabled);
    setEnabled(DebugBordersManager.isEnabled());
    return unsubscribe;
  }, []);

  // Track component count when enabled
  useEffect(() => {
    if (!enabled) {
      setComponentCount(0);
      return;
    }

    // Update component count periodically
    const updateCount = () => {
      try {
        const { getAllHostComponentInstances } = require("../utils/fiberTreeTraversal");
        const instances = getAllHostComponentInstances();
        setComponentCount(instances.length);
      } catch (error) {
        console.error("[DebugBorders] Error getting component count:", error);
      }
    };

    // Initial count
    setTimeout(updateCount, 600);

    // Update every 2 seconds
    const interval = setInterval(updateCount, 2000);

    return () => clearInterval(interval);
  }, [enabled]);

  const handleToggle = () => {
    DebugBordersManager.toggle();
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Debug Borders</Text>
        <Text style={styles.description}>
          Visualize component layout structure with colored borders
        </Text>

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <StatusBadge status={enabled ? "active" : "inactive"} />
        </View>

        {enabled && componentCount > 0 && (
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Components Tracked:</Text>
            <Text style={styles.statsValue}>{componentCount}</Text>
          </View>
        )}

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.button, enabled && styles.buttonActive]}
            onPress={handleToggle}
            accessibilityRole="button"
            accessibilityLabel={`Debug borders ${enabled ? "enabled" : "disabled"}`}
            accessibilityHint="Tap to toggle debug borders"
          >
            <Layers
              size={40}
              color={enabled ? macOSColors.semantic.success : macOSColors.text.secondary}
            />
            <Text style={[styles.buttonText, enabled && styles.buttonTextActive]}>
              {enabled ? "Disable Borders" : "Enable Borders"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoBox}>
          <StatusIndicator status={enabled ? "success" : "info"} size="small" />
          <Text style={styles.infoText}>
            {enabled
              ? "Borders update every 2 seconds. Tap button to disable."
              : "Tap button to show colored borders around all components."}
          </Text>
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
    width: "85%",
    maxWidth: 420,
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
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: macOSColors.text.secondary,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  statsLabel: {
    fontSize: 14,
    color: macOSColors.text.secondary,
    fontWeight: "600",
  },
  statsValue: {
    fontSize: 16,
    color: macOSColors.text.primary,
    fontWeight: "700",
  },
  toggleContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    borderRadius: 16,
    backgroundColor: macOSColors.background.hover,
    borderWidth: 2,
    borderColor: macOSColors.border.default,
    minWidth: 200,
  },
  buttonActive: {
    borderColor: macOSColors.semantic.success,
    backgroundColor: `${macOSColors.semantic.success}15`,
  },
  buttonText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: macOSColors.text.secondary,
  },
  buttonTextActive: {
    color: macOSColors.semantic.success,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: macOSColors.background.hover,
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: macOSColors.text.secondary,
    lineHeight: 16,
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

