/**
 * Standalone Debug Borders Overlay
 *
 * This component renders debug borders independently of the Provider.
 * It should be rendered at the root level of the app to ensure it appears on top.
 *
 * Automatically hides borders when DevTools modals are open to avoid visual clutter.
 */

import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";

const DebugBordersManager = require("../utils/DebugBordersManager");
const { getAllHostComponentInstances } = require("../utils/fiberTreeTraversal");
const { measureInstances } = require("../utils/componentMeasurement");
const { getColorForDepth } = require("../utils/colorGeneration");

// Import DevToolsVisibility context to detect when DevTools are open
let useDevToolsVisibility: (() => { isDevToolsActive: boolean }) | null = null;
try {
  // Optional import - will gracefully fail if not available
  const coreModule = require("@react-buoy/core");
  useDevToolsVisibility = coreModule.useDevToolsVisibility;
} catch (e) {
  // DevToolsVisibility not available, that's ok - borders will always work
  console.log(
    "[DebugBorders] DevToolsVisibility not available, borders will not auto-hide"
  );
}

export function DebugBordersStandaloneOverlay() {
  const [enabled, setEnabled] = useState(false); // Start disabled to prevent startup errors
  const [rectangles, setRectangles] = useState<any[]>([]);
  const measuringRef = React.useRef(false); // Prevent overlapping measurements

  // Check if any DevTools are open (if context is available)
  const isDevToolsActive = useDevToolsVisibility?.()?.isDevToolsActive ?? false;

  // Effective enabled state: user enabled AND no DevTools active
  const effectivelyEnabled = enabled && !isDevToolsActive;

  // Debug logging
  useEffect(() => {
    console.log("[DebugBorders] State:", {
      enabled,
      isDevToolsActive,
      effectivelyEnabled,
      rectanglesCount: rectangles.length,
    });
  }, [enabled, isDevToolsActive, effectivelyEnabled, rectangles.length]);

  // Subscribe to manager
  useEffect(() => {
    const unsubscribe = DebugBordersManager.subscribe(setEnabled);
    return unsubscribe;
  }, []);

  // Update measurements when enabled
  useEffect(() => {
    if (!effectivelyEnabled) {
      setRectangles([]);
      return;
    }

    let mounted = true;
    let timer: ReturnType<typeof setInterval>;

    const updateMeasurements = async () => {
      if (!mounted || measuringRef.current) {
        return;
      }

      measuringRef.current = true;

      try {
        const instances = getAllHostComponentInstances();
        if (instances.length === 0) {
          console.warn("[DebugBorders] No instances found");
          measuringRef.current = false;
          return;
        }

        const measurements = await measureInstances(instances);

        if (mounted) {
          setRectangles(measurements);
          // Only log on first render or when component count changes significantly
          if (
            rectangles.length === 0 ||
            Math.abs(measurements.length - rectangles.length) > 10
          ) {
            console.log(
              `[DebugBorders] Updated measurements: ${measurements.length} components`
            );
          }
        }
      } catch (error) {
        console.error("[DebugBorders] Error updating measurements:", error);
      } finally {
        measuringRef.current = false;
      }
    };

    // Log when borders are enabled
    console.log("[DebugBorders] Debug borders enabled");

    // Initial measurement with delay to let UI settle
    const initialTimer = setTimeout(() => {
      updateMeasurements();
    }, 500);

    // Periodic updates (less frequent to avoid performance issues)
    timer = setInterval(updateMeasurements, 2000);

    return () => {
      console.log("[DebugBorders] Debug borders disabled");
      mounted = false;
      clearTimeout(initialTimer);
      clearInterval(timer);
      measuringRef.current = false;
    };
  }, [effectivelyEnabled, rectangles.length]);

  if (!effectivelyEnabled) {
    return null;
  }

  return (
    <View
      style={styles.overlay}
      pointerEvents="none"
      // @ts-ignore - custom prop to identify this as debug overlay
      dataSet={{ debugOverlay: "true" }}
      nativeID="debug-borders-overlay"
    >
      {/* Render actual borders */}
      {rectangles.map((rect, index) => {
        const color = getColorForDepth(rect.depth);

        return (
          <View
            key={`border-${index}`}
            pointerEvents="none"
            style={[
              styles.border,
              {
                left: rect.x,
                top: rect.y,
                width: rect.width,
                height: rect.height,
                borderColor: color,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999999,
    elevation: 999999,
  },
  border: {
    position: "absolute",
    borderWidth: 2,
    borderStyle: "solid",
  },
});
