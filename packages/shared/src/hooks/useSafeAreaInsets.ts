import { useState, useEffect } from "react";
import { Platform, Dimensions, StatusBar } from "react-native";
import {
  useNativeSafeAreaInsets,
  hasSafeAreaPackage,
  safeAreaType,
} from "./safe-area-impl";

// Types
export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface SafeAreaInsetsOptions {
  minTop?: number;
  minBottom?: number;
  minLeft?: number;
  minRight?: number;
}

// Device detection map for iOS
const iPhoneDimensionMap: Record<
  string,
  Omit<SafeAreaInsets, "left" | "right">
> = {
  // iPhone 14 Pro, 14 Pro Max, 15, 15 Plus, 15 Pro, 15 Pro Max, 16 series (Dynamic Island)
  "393,852": { top: 59, bottom: 34 }, // 14 Pro, 15, 15 Pro, 16, 16 Pro
  "430,932": { top: 59, bottom: 34 }, // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus, 16 Pro Max

  // iPhone 12, 12 Pro, 13, 13 Pro, 14
  "390,844": { top: 47, bottom: 34 },

  // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
  "428,926": { top: 47, bottom: 34 },

  // iPhone 12 mini, 13 mini (newer value takes precedence)
  "375,812": { top: 50, bottom: 34 },

  // iPhone XR, 11
  "414,896": { top: 48, bottom: 34 },
};

/**
 * Pure JavaScript implementation for calculating safe area insets
 * Uses device dimensions mapping for iOS and platform APIs for Android
 *
 * @returns SafeAreaInsets object with top, bottom, left, right values
 *
 * @performance Optimized for iOS with dimension-based mapping table
 * Device recognition uses screen dimensions as lookup key
 */
const getPureJSSafeAreaInsets = (): SafeAreaInsets => {
  if (Platform.OS === "android") {
    const androidVersion = Platform.Version;
    const statusBarHeight = StatusBar.currentHeight || 0;

    // Android 10+ with gesture navigation typically has bottom insets
    const hasGestureNav = androidVersion >= 29;

    return {
      top: statusBarHeight,
      bottom: hasGestureNav ? 20 : 0, // Approximate gesture bar height
      left: 0,
      right: 0,
    };
  }

  // iOS
  const { width, height } = Dimensions.get("window");
  const dimensionKey = `${width},${height}`;

  const deviceInsets = iPhoneDimensionMap[dimensionKey];

  if (deviceInsets) {
    return {
      ...deviceInsets,
      left: 0,
      right: 0,
    };
  }

  // Default for older iPhones without notch
  return {
    top: 20, // Standard status bar
    bottom: 0,
    left: 0,
    right: 0,
  };
};

// Note: Native safe area support is detected at install time by scripts/detect-safe-area.js
// The useNativeSafeAreaInsets hook is imported from the generated safe-area-impl.ts file
// This uses SafeAreaInsetsContext directly with useContext(), which returns null when
// no SafeAreaProvider is present (instead of throwing an error like useSafeAreaInsets does)

/**
 * Custom hook for accessing safe area insets with automatic fallback
 *
 * Provides safe area insets for proper UI positioning on devices with notches,
 * dynamic islands, and status bars. Automatically detects and uses the native
 * react-native-safe-area-context package when available, falling back to a
 * pure JavaScript implementation when not available.
 *
 * @param options - Configuration options for minimum inset values
 * @param options.minTop - Minimum top inset value (overrides calculated value if larger)
 * @param options.minBottom - Minimum bottom inset value (overrides calculated value if larger)
 * @param options.minLeft - Minimum left inset value (overrides calculated value if larger)
 * @param options.minRight - Minimum right inset value (overrides calculated value if larger)
 *
 * @returns SafeAreaInsets object with top, bottom, left, right pixel values
 *
 * @example
 * ```typescript
 * // Basic usage
 * const insets = useSafeAreaInsets();
 * const topPadding = insets.top;
 *
 * // With minimum values
 * const insets = useSafeAreaInsets({
 *   minTop: 20,
 *   minBottom: 10
 * });
 * ```
 *
 * @performance Uses pure JS fallback with device dimension mapping for iOS
 * @performance Automatically handles orientation changes with dimension listener
 * @performance Memoizes native package detection at module level
 */
export const useSafeAreaInsets = (
  options: SafeAreaInsetsOptions = {}
): SafeAreaInsets => {
  // Always call the native hook unconditionally (returns null if not available)
  const nativeInsets = useNativeSafeAreaInsets();

  // Fallback state for pure JS implementation
  const [fallbackInsets, setFallbackInsets] = useState<SafeAreaInsets>(() =>
    getPureJSSafeAreaInsets()
  );

  useEffect(() => {
    // Only set up orientation listener if using fallback
    if (!nativeInsets) {
      const updateInsets = () => {
        setFallbackInsets(getPureJSSafeAreaInsets());
      };

      const subscription = Dimensions.addEventListener("change", updateInsets);

      return () => {
        subscription?.remove();
      };
    }
  }, [nativeInsets]); // Dependency on nativeInsets

  const baseInsets = nativeInsets || fallbackInsets;

  // Apply minimum values - handles both 0 values and values less than minimum
  const finalInsets = {
    top:
      options.minTop !== undefined
        ? Math.max(baseInsets.top, options.minTop)
        : baseInsets.top,
    bottom:
      options.minBottom !== undefined
        ? Math.max(baseInsets.bottom, options.minBottom)
        : baseInsets.bottom,
    left:
      options.minLeft !== undefined
        ? Math.max(baseInsets.left, options.minLeft)
        : baseInsets.left,
    right:
      options.minRight !== undefined
        ? Math.max(baseInsets.right, options.minRight)
        : baseInsets.right,
  };

  return finalInsets;
};

/**
 * Utility function to detect if the current device has a notch or dynamic island
 *
 * @returns True if the device has a notch/dynamic island, false otherwise
 *
 * @example
 * ```typescript
 * if (hasNotch()) {
 *   // Apply special styling for notched devices
 *   console.log('Device has notch or dynamic island');
 * }
 * ```
 */
export const hasNotch = (): boolean => {
  const insets = getPureJSSafeAreaInsets();

  if (Platform.OS === "android") {
    // Android with tall status bar might have notch
    return insets.top > 24;
  }

  // iOS with top inset > 20 has notch or dynamic island
  return insets.top > 20;
};

/**
 * Configuration helper for safe area implementation management
 *
 * Provides utilities for checking native package availability,
 * forcing pure JS implementation, and getting implementation type info
 */
export const SafeAreaConfig = {
  /**
   * Check if the native react-native-safe-area-context package is available
   * This is detected at install time by scripts/detect-safe-area.js
   *
   * @returns True if native package is installed and available
   */
  hasNativeSupport: (): boolean => hasSafeAreaPackage,

  /**
   * Force pure JS implementation (useful for testing)
   * Set to true to disable native package usage even when available
   */
  forcePureJS: false,

  /**
   * Get current implementation type being used
   * Detected at install time by scripts/detect-safe-area.js
   *
   * @returns "native" if using react-native-safe-area-context, "pure-js" if using fallback
   */
  getImplementationType: (): "native" | "pure-js" => {
    if (SafeAreaConfig.forcePureJS) return "pure-js";
    return safeAreaType;
  },
};

/**
 * Compatibility hook that returns the window frame dimensions
 *
 * @returns Frame object with x, y, width, height properties
 *
 * @deprecated Use Dimensions.get("window") directly instead
 */
export const useSafeAreaFrame = () => {
  const { width, height } = Dimensions.get("window");
  return { x: 0, y: 0, width, height };
};

/**
 * Export the pure JS implementation directly for compatibility
 *
 * @returns SafeAreaInsets calculated using pure JavaScript implementation
 *
 * @example
 * ```typescript
 * const insets = getSafeAreaInsets();
 * console.log(`Top inset: ${insets.top}px`);
 * ```
 */
export const getSafeAreaInsets = getPureJSSafeAreaInsets;
