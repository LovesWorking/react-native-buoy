import { Dimensions, Platform, StatusBar } from "react-native";

/**
 * Pure JS implementation of safe area insets
 * Detects device type and returns appropriate safe areas
 *
 * @returns Object with top, bottom, left, right insets and hasNotch flag
 */
export const getSafeAreaInsets = () => {
  const isIOS = Platform.OS === "ios";
  const isAndroid = Platform.OS === "android";
  const { height } = Dimensions.get("window");

  let top = 0;
  let bottom = 0;

  if (isIOS) {
    // iPhone X and later models have notch/dynamic island
    const hasNotch = height >= 812; // iPhone X and later
    top = hasNotch ? 44 : 20;
    bottom = hasNotch ? 34 : 0;
  } else if (isAndroid) {
    // Android status bar height
    top = StatusBar.currentHeight || 24;
    bottom = 0;
  }

  return {
    top,
    bottom,
    left: 0,
    right: 0,
    hasNotch: height >= 812,
  };
};
