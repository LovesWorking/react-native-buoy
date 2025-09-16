/**
 * macOS Desktop App Design System Colors
 * Based on Apple's Human Interface Guidelines with a dark-mode-first approach
 * Single source of truth for all design decisions
 */

export const macOSColors = {
  // Background Colors
  background: {
    base: "#0A0A0C", // Main app background, darkest layer
    card: "#1A1A1C", // Card backgrounds, elevated surfaces
    hover: "#1D1D1F", // Hover states for interactive elements
    input: "#26262A", // Input field backgrounds, recessed areas
  },

  // Border Colors
  border: {
    default: "#2D2D2F", // Main borders, dividers
    toggle: "#3D3D3F", // Toggle switch backgrounds
    input: "#3D3D42", // Input field borders
    hover: "#4D4D4F", // Hover state borders
  },

  // Text Colors
  text: {
    primary: "#F5F5F7", // Main text, headers
    secondary: "#A1A1A6", // Subtitles, secondary information
    muted: "#8E8E93", // Placeholder text, disabled states
    disabled: "#9E9EA0", // Inactive elements
    icon: "#6D6D6F", // Icon colors, subtle graphics
  },

  // Semantic Colors
  semantic: {
    // Success
    success: "#34C759", // green-500 equivalent
    successLight: "#52D976", // green-400 equivalent
    successLighter: "#86E29F", // green-300 equivalent
    successBackground: "rgba(52, 199, 89, 0.15)", // green-900/80 equivalent

    // Error
    error: "#FF453A", // red-500 equivalent
    errorLight: "#FF6961", // red-400 equivalent
    errorLighter: "#FF887F", // red-300 equivalent
    errorBackground: "rgba(255, 69, 58, 0.15)", // red-900/80 equivalent

    // Warning - Using the preferred cyberpunk yellow
    warning: "#FFEB3B", // Bright cyberpunk yellow
    warningLight: "#FFF066", // Lighter variant
    warningBackground: "rgba(255, 235, 59, 0.15)", // yellow background

    // Info - Using the preferred cyberpunk cyan
    info: "#00B8E6", // Bright cyberpunk cyan
    infoLight: "#40CCFF", // Lighter variant
    infoLighter: "#70D8FF", // Even lighter variant
    infoBackground: "rgba(0, 184, 230, 0.1)", // cyan background

    // Debug
    debug: "#BF5AF2", // purple-400 equivalent
  },

  // Platform-Specific Colors
  platform: {
    ios: "#E5E5EA", // gray-100 equivalent
    android: "#86E29F", // green-300 equivalent
    web: "#70B8FF", // blue-300 equivalent
    webAlt: "#5AC8FA", // cyan-400 equivalent
    tv: "#B381F0", // purple-300 equivalent
  },

  // Shadow System
  shadows: {
    sm: "0 0.5rem 1.5rem rgba(0,0,0,0.15)",
    md: "0 0.75rem 2.5rem rgba(0,0,0,0.25)",
    lg: "0 1rem 3rem rgba(0,0,0,0.3)",
    xl: "0 1.5rem 3rem rgba(0,0,0,0.35)",

    // Glow Effects
    successGlow: "0 0 8px rgba(52, 199, 89, 0.1)",
    errorGlow: "0 0 8px rgba(255, 69, 58, 0.1)",
    warningGlow: "0 0 8px rgba(255, 235, 59, 0.2)",
    infoGlow: "0 0 8px rgba(0, 184, 230, 0.2)",
    infoGlowStrong: "0 0 10px rgba(0, 184, 230, 0.3)",
  },

  // Data Types (for syntax highlighting)
  dataTypes: {
    object: "#00B8E6", // Cyan (matching preferred info color)
    array: "#FFEB3B", // Yellow (matching preferred warning color)
    string: "#34C759", // Green
    number: "#FF9F0A", // Orange
    boolean: "#BF5AF2", // Purple
    function: "#5E5CE6", // Indigo
    undefined: "#8E8E93", // Gray
    null: "#FF453A", // Red
  },

  // Diff Viewer Colors
  diff: {
    // Line backgrounds
    addedBackground: "rgba(52, 199, 89, 0.1)",
    removedBackground: "rgba(255, 69, 58, 0.1)",
    modifiedBackground: "rgba(0, 184, 230, 0.1)", // Using cyan
    unchangedBackground: "transparent",
    contextBackground: "rgba(245, 245, 247, 0.02)",

    // Text colors
    addedText: "#34C759",
    removedText: "#FF453A",
    modifiedText: "#00B8E6", // Using cyan
    unchangedText: "#A1A1A6",

    // Word-level highlights
    addedWordHighlight: "rgba(52, 199, 89, 0.3)",
    removedWordHighlight: "rgba(255, 69, 58, 0.3)",

    // Line numbers
    lineNumberBackground: "#0A0A0C",
    lineNumberText: "#8E8E93",
    lineNumberBorder: "#2D2D2F",

    // Markers
    markerAddedBackground: "rgba(52, 199, 89, 0.2)",
    markerRemovedBackground: "rgba(255, 69, 58, 0.2)",
    markerModifiedBackground: "rgba(0, 184, 230, 0.2)", // Using cyan
    markerText: "#8E8E93",
  },
};

// Create a compatible gameUIColors object for gradual migration
export const macOSGameUIColors = {
  // Base backgrounds
  background: macOSColors.background.base,
  panel: macOSColors.background.card,
  backdrop: "rgba(0, 0, 0, 0.85)",
  buttonBackground: macOSColors.background.hover,
  pureBlack: "#000000",

  // Borders
  border: macOSColors.border.default,
  blackTint1: macOSColors.background.base,
  blackTint2: macOSColors.background.card,
  blackTint3: macOSColors.background.hover,

  // Status Colors
  success: macOSColors.semantic.success,
  warning: macOSColors.semantic.warning,
  error: macOSColors.semantic.error,
  info: macOSColors.semantic.info,
  critical: macOSColors.semantic.error,
  optional: macOSColors.semantic.debug,

  // Tool Colors
  env: macOSColors.semantic.success,
  storage: macOSColors.semantic.debug,
  query: macOSColors.semantic.info,
  debug: macOSColors.semantic.error,
  network: macOSColors.semantic.success,

  // Data Types
  dataTypes: macOSColors.dataTypes,

  // Text
  text: macOSColors.text.primary,
  primary: macOSColors.text.primary,
  primaryLight: macOSColors.text.primary,
  secondary: macOSColors.text.secondary,
  tertiary: macOSColors.text.secondary,
  muted: macOSColors.text.muted,

  // Diff
  diff: macOSColors.diff,

  // Additional properties for compatibility
  neonGlow: {
    primary: macOSColors.semantic.info,
    secondary: macOSColors.semantic.debug,
    tertiary: macOSColors.semantic.success,
  },
};

export type MacOSColorKey = keyof typeof macOSColors;