/**
 * Game UI Color Palette - Simple Theme Swapping
 *
 * TO CHANGE THEME:
 * 1. Comment out the current theme line
 * 2. Uncomment the theme you want
 * 3. Save and refresh
 */

import { macOSGameUIColors } from "./macOSDesignSystemColors";

// ============================================
// THEME DEFINITIONS
// ============================================

const defaultTheme = {
  // Base colors
  border: "#00B8E666",
  blackTint1: "rgba(8, 12, 21, 0.95)",
  blackTint2: "rgba(16, 22, 35, 0.9)",
  blackTint3: "rgba(24, 32, 48, 0.85)",

  // Status Colors - Mixed colors for different semantic meanings
  success: "#4AFF9F", // Green for success
  warning: "#FFEB3B", // Yellow for warning
  error: "#FF5252", // Red for error
  info: "#00B8E6", // Cyan for info
  critical: "#FF00FF", // Magenta for critical
  optional: "#9D4EDD", // Purple for optional

  // Tool Colors - Different colors for different tools
  env: "#4AFF9F", // Green for environment
  storage: "#BA68C8", // Purple/Magenta for storage (was yellow)
  query: "#00B8E6", // Cyan for query
  debug: "#FF5252", // Red for debug
  network: "#4AFF9F", // Green for network to match connectivity theme

  // Data Types - Varied colors for syntax highlighting
  dataTypes: {
    object: "#00B8E6", // Cyan
    array: "#FFEB3B", // Yellow
    string: "#4AFF9F", // Green
    number: "#FF9F1C", // Orange
    boolean: "#FF00FF", // Magenta
    function: "#9D4EDD", // Purple
    undefined: "#7A8599", // Gray
    null: "#FF5252", // Red
  },

  // Text
  text: "#FFFFFF",
  secondary: "#B8BFC9",
  tertiary: "#9CA3AF",
  muted: "#7A8599",

  // Neon - Multi-color glow effects
  neonGlow: {
    primary: "#00D4FF",
    secondary: "#FF00FF",
    tertiary: "#4AFF9F",
  },

  // Diff Viewer Colors - Exact from devToolsDefaultTheme
  diff: {
    // Line backgrounds
    addedBackground: "rgba(74, 255, 159, 0.1)", // Green-cyan for additions
    removedBackground: "rgba(255, 82, 82, 0.1)", // Red for removals
    modifiedBackground: "rgba(0, 184, 230, 0.1)", // Cyan for modifications
    unchangedBackground: "transparent",
    contextBackground: "rgba(255, 255, 255, 0.02)",

    // Text colors
    addedText: "#4AFF9F", // Bright green-cyan
    removedText: "#FF5252", // Bright red
    modifiedText: "#00B8E6", // Bright cyan
    unchangedText: "#B8BFC9", // Muted text

    // Word-level highlights (darker than line backgrounds)
    addedWordHighlight: "rgba(74, 255, 159, 0.3)",
    removedWordHighlight: "rgba(255, 82, 82, 0.3)",

    // Line numbers
    lineNumberBackground: "#0A0E1A",
    lineNumberText: "#7A8599",
    lineNumberBorder: "#1F2937",

    // Markers (+/-)
    markerAddedBackground: "rgba(74, 255, 159, 0.2)",
    markerRemovedBackground: "rgba(255, 82, 82, 0.2)",
    markerModifiedBackground: "rgba(0, 184, 230, 0.2)",
    markerText: "#7A8599",
  },
};

// macOS theme - Apple HIG based design system
const macOSTheme = macOSGameUIColors;

// ============================================
// THEME SELECTION - Just change this one line!
// ============================================

// const activeTheme = defaultTheme; // DEFAULT - Mixed colors (original)
const activeTheme = macOSTheme; // macOS - Apple HIG design system

// ============================================
// GAME UI COLORS (uses selected theme)
// ============================================

export const gameUIColors = {
  ...activeTheme,
  // Defaults (dark-ish) which can be overridden by theme spreads
  background: "rgba(8, 12, 21, 0.98)",
  panel: "rgba(16, 22, 35, 0.98)",
  backdrop: "rgba(0, 0, 0, 0.85)",
  buttonBackground: "rgba(12, 16, 26, 0.9)",
  pureBlack: "#000000",

  // Default text colors for dark background
  primary: "#FFFFFF",
  primaryLight: "#F1F5F9",

  // Theme-specific colors (later spread overrides defaults when present)
} as const;

export type GameUIColorKey = keyof typeof gameUIColors;
// Fixed dial colors for cyberpunk theme
export const dialColors = {
  dialBackground: gameUIColors.pureBlack,
  dialGradient1: `${gameUIColors.info}10`,
  dialGradient2: `${gameUIColors.info}08`,
  dialGradient3: `${gameUIColors.info}15`,
  dialBorder: `${gameUIColors.info}40`,
  dialShadow: gameUIColors.info,
  dialGridLine: `${gameUIColors.info}26`,
};
