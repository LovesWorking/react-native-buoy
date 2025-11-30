/**
 * HighlightUpdatesOverlay
 *
 * Renders colored highlight rectangles for components that have updated.
 * Uses View-based rendering (similar to debug-borders) instead of the
 * native DebuggingOverlay component for better compatibility.
 */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import HighlightUpdatesController from "./utils/HighlightUpdatesController";

interface HighlightRect {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  count: number;
  timestamp: number;
}

// How long highlights stay visible (ms)
const HIGHLIGHT_DURATION = 1000;

export function HighlightUpdatesOverlay(): React.ReactElement | null {
  const [highlights, setHighlights] = useState<HighlightRect[]>([]);
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Callback to add new highlights
  const addHighlights = useCallback(
    (newRects: Omit<HighlightRect, "timestamp">[]) => {
      const now = Date.now();
      const timestampedRects = newRects.map((rect) => ({
        ...rect,
        timestamp: now,
      }));

      setHighlights((prev) => {
        // Merge new highlights, replacing any with same id
        const updated = [...prev];
        for (const newRect of timestampedRects) {
          const existingIndex = updated.findIndex((r) => r.id === newRect.id);
          if (existingIndex >= 0) {
            updated[existingIndex] = newRect;
          } else {
            updated.push(newRect);
          }
        }
        return updated;
      });
    },
    []
  );

  // Register the callback with the controller
  useEffect(() => {
    HighlightUpdatesController.setHighlightCallback(addHighlights);

    // Cleanup timer to remove old highlights
    cleanupTimerRef.current = setInterval(() => {
      const now = Date.now();
      setHighlights((prev) =>
        prev.filter((rect) => now - rect.timestamp < HIGHLIGHT_DURATION)
      );
    }, 50);

    return () => {
      HighlightUpdatesController.setHighlightCallback(null);
      if (cleanupTimerRef.current) {
        clearInterval(cleanupTimerRef.current);
      }
    };
  }, [addHighlights]);

  if (highlights.length === 0) {
    return null;
  }

  return (
    <View
      style={styles.overlay}
      pointerEvents="none"
      nativeID="highlight-updates-overlay"
    >
      {highlights.map((rect) => (
        <View
          key={`highlight-${rect.id}`}
          pointerEvents="none"
          nativeID={`__highlight_rect_${rect.id}__`}
          style={[
            styles.highlight,
            {
              left: rect.x,
              top: rect.y,
              width: rect.width,
              height: rect.height,
              borderColor: rect.color,
            },
          ]}
        >
          {/* Render count badge - fixed inset from top-right corner */}
          <View
            style={[styles.badge, { backgroundColor: rect.color }]}
            nativeID={`__highlight_badge_${rect.id}__`}
          >
            <Text
              style={styles.badgeText}
              nativeID={`__highlight_text_${rect.id}__`}
            >
              {rect.count}
            </Text>
          </View>
        </View>
      ))}
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
    borderWidth: 0,
  },
  highlight: {
    position: "absolute",
    borderWidth: 2,
    borderStyle: "solid",
    backgroundColor: "transparent",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#000",
    fontSize: 11,
    fontWeight: "bold",
  },
});

export default HighlightUpdatesOverlay;
