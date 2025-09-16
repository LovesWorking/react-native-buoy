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

// Basic pure-JS fallback for safe area insets
const getPureJSSafeAreaInsets = (): SafeAreaInsets => {
  try {
    const { Platform, Dimensions, StatusBar } = require('react-native');
    if (Platform.OS === 'android') {
      const statusBarHeight = StatusBar?.currentHeight || 0;
      const hasGestureNav = (Platform.Version as number) >= 29;
      return { top: statusBarHeight, bottom: hasGestureNav ? 20 : 0, left: 0, right: 0 };
    }
    const { width, height } = Dimensions.get('window');
    const key = `${width},${height}`;
    const map: Record<string, { top: number; bottom: number }> = {
      '393,852': { top: 59, bottom: 34 },
      '430,932': { top: 59, bottom: 34 },
      '390,844': { top: 47, bottom: 34 },
      '428,926': { top: 47, bottom: 34 },
      '375,812': { top: 50, bottom: 34 },
      '414,896': { top: 48, bottom: 34 },
    };
    const v = map[key];
    if (v) return { ...v, left: 0, right: 0 };
    return { top: 20, bottom: 0, left: 0, right: 0 };
  } catch {
    return { top: 20, bottom: 0, left: 0, right: 0 };
  }
};

// public API used by floatingTools
export const getSafeAreaInsets = getPureJSSafeAreaInsets;

export const useSafeAreaInsets = (options: SafeAreaInsetsOptions = {}): SafeAreaInsets => {
  // We avoid React hooks to keep this file copyable without extra deps; compute on demand.
  const base = getPureJSSafeAreaInsets();
  return {
    top: options.minTop !== undefined ? Math.max(base.top, options.minTop) : base.top,
    bottom: options.minBottom !== undefined ? Math.max(base.bottom, options.minBottom) : base.bottom,
    left: options.minLeft !== undefined ? Math.max(base.left, options.minLeft) : base.left,
    right: options.minRight !== undefined ? Math.max(base.right, options.minRight) : base.right,
  };
};

