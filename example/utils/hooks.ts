import { useMemo } from 'react';
import { Dimensions, StatusBar, Platform } from 'react-native';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Safe area insets hook that provides padding for notches, status bars, etc.
 * Simplified implementation for Expo Snack compatibility
 */
export const useSafeAreaInsets = (): SafeAreaInsets => {
  return useMemo(() => {
    const { height, width } = Dimensions.get('window');

    // Basic safe area calculations for different platforms
    let top = 0;
    let bottom = 0;

    if (Platform.OS === 'ios') {
      // iOS status bar and notch/dynamic island
      top = StatusBar.currentHeight || 44;
      // iPhone home indicator
      if (height > 800) {
        bottom = 34; // iPhone X and newer
      } else {
        bottom = 0; // Older iPhones
      }
    } else if (Platform.OS === 'android') {
      // Android status bar
      top = StatusBar.currentHeight || 24;
      bottom = 0;
    } else {
      // Web and other platforms
      top = 0;
      bottom = 0;
    }

    return {
      top,
      bottom,
      left: 0,
      right: 0,
    };
  }, []);
};