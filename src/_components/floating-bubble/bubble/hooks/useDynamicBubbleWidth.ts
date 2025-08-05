import { useRef, useState, useLayoutEffect } from "react";
import { Dimensions, View } from "react-native";

const { width: screenWidth } = Dimensions.get("window");

/**
 * Dynamic bubble width hook using React Native's native measurement capabilities.
 * Automatically adapts to content changes without manual calculations.
 *
 * Based on React Native docs: https://reactnative.dev/docs/direct-manipulation#measure
 * Uses useLayoutEffect for synchronous measurement to prevent visual jumps.
 */
export function useDynamicBubbleWidth() {
  const contentRef = useRef<View>(null);
  const [measuredWidth, setMeasuredWidth] = useState(240); // Default width
  const [isFirstMeasurement, setIsFirstMeasurement] = useState(true);

  // Use useLayoutEffect for synchronous measurement (React Native New Architecture)
  // This ensures measurements happen before paint, preventing visual jumps
  useLayoutEffect(() => {
    let isMounted = true; // Cleanup flag to prevent state updates on unmounted components

    if (contentRef.current) {
      // Use measure() to get the actual rendered width of the content
      contentRef.current.measure(
        (x: number, y: number, width: number, _height: number) => {
          if (!isMounted) return; // Prevent state updates after unmount

          if (width > 0) {
            // Add padding to the measured content width
            const paddingHorizontal = 12; // 6px on each side for content padding
            const contentWidth = width + paddingHorizontal;

            // Apply screen constraints
            const minWidth = 120; // Lower minimum since content can be very small now
            const maxWidth = screenWidth - 32; // Leave 16px margin on each side
            const constrainedWidth = Math.min(
              Math.max(contentWidth, minWidth),
              maxWidth
            );

            // Only update if width actually changed to prevent unnecessary re-renders
            if (constrainedWidth !== measuredWidth) {
              setMeasuredWidth(constrainedWidth);
            }

            if (isFirstMeasurement) {
              setIsFirstMeasurement(false);
            }
          }
        }
      );
    }

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }); // No dependencies - measure on every render to catch content changes

  return {
    contentRef,
    bubbleWidth: measuredWidth,
    isFirstMeasurement, // Can be used to prevent animations on initial render
  };
}
