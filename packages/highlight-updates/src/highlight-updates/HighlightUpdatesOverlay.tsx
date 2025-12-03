/**
 * HighlightUpdatesOverlay
 *
 * Renders colored highlight rectangles for components that have updated.
 * Uses View-based rendering (similar to debug-borders) instead of the
 * native DebuggingOverlay component for better compatibility.
 */

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useLayoutEffect,
} from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { macOSColors } from "@react-buoy/shared-ui";
import HighlightUpdatesController from "./utils/HighlightUpdatesController";
import {
  PerformanceLogger,
  markOverlayRendered,
} from "./utils/PerformanceLogger";
import { RenderTracker } from "./utils/RenderTracker";

// Declare performance API available in React Native's JavaScript environment
declare const performance: { now: () => number };

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

interface HighlightUpdatesOverlayProps {
  /**
   * Callback when a badge is pressed.
   * Receives the nativeTag (id) of the component whose badge was tapped.
   */
  onBadgePress?: (nativeTag: number) => void;
}

export function HighlightUpdatesOverlay({
  onBadgePress,
}: HighlightUpdatesOverlayProps = {}): React.ReactElement | null {
  const [highlights, setHighlights] = useState<HighlightRect[]>([]);
  const [isFrozen, setIsFrozen] = useState(() =>
    HighlightUpdatesController.getFrozen()
  );
  const [spotlightTag, setSpotlightTag] = useState<number | null>(null);
  const cleanupTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const renderStartTimeRef = useRef<number>(0);
  const highlightCountRef = useRef<number>(0);
  const frozenRef = useRef(isFrozen);

  // Keep ref in sync with state for use in interval callback
  frozenRef.current = isFrozen;

  // Track render start time
  if (PerformanceLogger.isEnabled()) {
    renderStartTimeRef.current = performance.now();
    highlightCountRef.current = highlights.length;
  }

  // Measure render completion time using useLayoutEffect (runs after DOM mutations)
  useLayoutEffect(() => {
    if (
      PerformanceLogger.isEnabled() &&
      renderStartTimeRef.current > 0 &&
      highlightCountRef.current > 0
    ) {
      const renderTime = performance.now() - renderStartTimeRef.current;
      // Mark end-to-end timing (for benchmark recording only - no console logs)
      markOverlayRendered(highlightCountRef.current, renderTime);
    }
  });

  // Subscribe to freeze state changes
  useEffect(() => {
    const unsubscribe = HighlightUpdatesController.subscribeToFreeze(
      (frozen) => {
        setIsFrozen(frozen);
      }
    );
    return unsubscribe;
  }, []);

  // Subscribe to filter changes - refresh frozen highlights when filters change
  useEffect(() => {
    const unsubscribe = RenderTracker.subscribeToFilters(() => {
      // When filters change, filter out highlights that no longer match
      setHighlights((prev) => {
        return prev.filter((highlight) => {
          // Look up the render by nativeTag
          const render = RenderTracker.getRender(String(highlight.id));
          if (!render) {
            // If render not found, keep the highlight (it might be from a different source)
            return true;
          }
          // Check if the render should still be shown based on new filters
          return RenderTracker.shouldShowRender(render);
        });
      });
    });
    return unsubscribe;
  }, []);

  // Subscribe to spotlight changes - show which component is being viewed in detail
  useEffect(() => {
    HighlightUpdatesController.setSpotlightCallback((tag) => {
      setSpotlightTag(tag);
    });
    return () => {
      HighlightUpdatesController.setSpotlightCallback(null);
    };
  }, []);

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
    // When frozen, skip cleanup to keep highlights visible indefinitely
    cleanupTimerRef.current = setInterval(() => {
      // Check frozen state via ref (doesn't cause re-subscription)
      if (frozenRef.current) {
        return; // Skip cleanup when frozen
      }

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

  // Check if badge press handling is enabled (via props or controller)
  const hasBadgePressHandler =
    onBadgePress || HighlightUpdatesController.getBadgePressCallback();

  // Handle badge press - navigate to detail view for this component
  const handleBadgePress = useCallback(
    (nativeTag: number) => {
      // First try the prop callback
      if (onBadgePress) {
        onBadgePress(nativeTag);
      } else {
        // Fall back to controller callback
        HighlightUpdatesController.handleBadgePress(nativeTag);
      }
    },
    [onBadgePress]
  );

  // Get spotlight render info if we have a spotlight active
  const spotlightRender = spotlightTag
    ? RenderTracker.getRender(String(spotlightTag))
    : null;

  // Render nothing if no highlights and no spotlight
  if (highlights.length === 0 && !spotlightRender?.measurements) {
    return null;
  }

  return (
    <View
      style={styles.overlay}
      pointerEvents="box-none"
      nativeID="highlight-updates-overlay"
    >
      {/* Spotlight highlight - shows which component is being viewed in detail */}
      {spotlightRender?.measurements && (
        <>
          <View
            pointerEvents="none"
            nativeID="__spotlight_highlight__"
            style={[
              styles.spotlightHighlight,
              {
                // Offset by border width so border renders outside the component bounds
                left: spotlightRender.measurements.x - 3,
                top: spotlightRender.measurements.y - 3,
                width: spotlightRender.measurements.width + 6,
                height: spotlightRender.measurements.height + 6,
              },
            ]}
          />
          {/* Label rendered separately so it can grow independently of highlight box size */}
          <View
            pointerEvents="none"
            style={[
              styles.spotlightLabel,
              {
                left: spotlightRender.measurements.x,
                top:
                  spotlightRender.measurements.y +
                  spotlightRender.measurements.height +
                  4,
              },
            ]}
          >
            <Text style={styles.spotlightLabelText}>
              {spotlightRender.componentName ||
                spotlightRender.displayName ||
                spotlightRender.viewType}
            </Text>
          </View>
        </>
      )}

      {/* Regular highlights */}
      {highlights.map((rect) => (
        <View
          key={`highlight-${rect.id}`}
          pointerEvents="box-none"
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
          {/* Render count badge - only show when counting is enabled (count > 0) */}
          {rect.count > 0 &&
            (hasBadgePressHandler ? (
              <TouchableOpacity
                onPress={() => handleBadgePress(rect.id)}
                style={[styles.badge, { backgroundColor: rect.color }]}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text
                  style={styles.badgeText}
                  nativeID={`__highlight_text_${rect.id}__`}
                >
                  {rect.count}
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[styles.badge, { backgroundColor: rect.color }]}
                nativeID={`__highlight_badge_${rect.id}__`}
                pointerEvents="none"
              >
                <Text
                  style={styles.badgeText}
                  nativeID={`__highlight_text_${rect.id}__`}
                >
                  {rect.count}
                </Text>
              </View>
            ))}
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
    height: 14,
    borderRadius: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
  },
  badgeText: {
    color: "#000",
    fontSize: 9,
    fontWeight: "bold",
  },
  // Spotlight highlight styles
  spotlightHighlight: {
    position: "absolute",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: macOSColors.semantic.info,
    backgroundColor: "transparent",
  },
  spotlightLabel: {
    position: "absolute",
    backgroundColor: macOSColors.background.card,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  spotlightLabelText: {
    color: macOSColors.semantic.info,
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "monospace",
  },
});

export default HighlightUpdatesOverlay;
