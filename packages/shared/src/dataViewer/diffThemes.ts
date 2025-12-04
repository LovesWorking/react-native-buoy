/**
 * Diff Viewer Theme System
 *
 * Provides theme definitions for the SplitDiffViewer component.
 * Includes both light (Git Classic) and dark (Dev Tools) themes.
 */

export interface DiffTheme {
  name: string;
  description: string;

  // Background colors
  background: string;
  panelBackground: string;
  headerBackground: string;

  // Line backgrounds
  addedBackground: string;
  removedBackground: string;
  modifiedBackground: string;
  unchangedBackground: string;
  contextBackground: string;

  // Text colors
  addedText: string;
  removedText: string;
  modifiedText: string;
  unchangedText: string;

  // Word-level highlights
  addedWordHighlight: string;
  removedWordHighlight: string;

  // UI elements
  lineNumberBackground: string;
  lineNumberText: string;
  lineNumberBorder: string;

  // Markers (+/-)
  markerAddedBackground: string;
  markerRemovedBackground: string;
  markerModifiedBackground: string;
  markerText: string;

  // Borders and dividers
  borderColor: string;
  dividerColor: string;

  // Additional theme properties
  glowColor?: string;
  neonIntensity?: number;
  accentColor?: string;

  // Summary bar
  summaryBackground: string;
  summaryAddedText: string;
  summaryRemovedText: string;
  summaryModifiedText: string;

  // Empty state
  emptyStateText: string;

  // Separator (for diff-only mode)
  separatorBackground: string;
  separatorText: string;
}

/**
 * Git Classic Theme
 * Traditional Git diff colors - simple and familiar
 */
export const gitClassicTheme: DiffTheme = {
  name: "Git Classic",
  description: "Traditional Git diff colors - simple and familiar",

  background: "#FFFFFF",
  panelBackground: "#F8F8F8",
  headerBackground: "#F0F0F0",

  addedBackground: "#E6FFED",
  removedBackground: "#FFEEF0",
  modifiedBackground: "#FFF5DD",
  unchangedBackground: "transparent",
  contextBackground: "#FAFAFA",

  addedText: "#22863A",
  removedText: "#CB2431",
  modifiedText: "#B08800",
  unchangedText: "#24292E",

  addedWordHighlight: "#ACF2BD",
  removedWordHighlight: "#FDB8C0",

  lineNumberBackground: "#F6F8FA",
  lineNumberText: "#959DA5",
  lineNumberBorder: "#E1E4E8",

  markerAddedBackground: "#CDFFD8",
  markerRemovedBackground: "#FFDCE0",
  markerModifiedBackground: "#FFF5B1",
  markerText: "#666666",

  borderColor: "#E1E4E8",
  dividerColor: "#E1E4E8",

  summaryBackground: "#F6F8FA",
  summaryAddedText: "#28A745",
  summaryRemovedText: "#D73A49",
  summaryModifiedText: "#0366D6",

  emptyStateText: "#586069",

  separatorBackground: "#F6F8FA",
  separatorText: "#586069",
};

/**
 * Dev Tools Default Theme
 * Clean dark theme using our gameUIColors
 */
export const devToolsDefaultTheme: DiffTheme = {
  name: "Dev Tools Default",
  description: "Clean dark theme with our game UI colors",

  // Use our gameUIColors-inspired dark theme
  background: "#0A0E1A",
  panelBackground: "#0F1420",
  headerBackground: "#141925",

  // Diff colors with our cyan/yellow/red scheme
  addedBackground: "rgba(74, 255, 159, 0.1)",
  removedBackground: "rgba(255, 82, 82, 0.1)",
  modifiedBackground: "rgba(0, 184, 230, 0.1)",
  unchangedBackground: "transparent",
  contextBackground: "rgba(255, 255, 255, 0.02)",

  // Text colors
  addedText: "#4AFF9F",
  removedText: "#FF5252",
  modifiedText: "#00B8E6",
  unchangedText: "#B8BFC9",

  // Word-level highlights
  addedWordHighlight: "rgba(74, 255, 159, 0.3)",
  removedWordHighlight: "rgba(255, 82, 82, 0.3)",

  // UI elements
  lineNumberBackground: "#0A0E1A",
  lineNumberText: "#7A8599",
  lineNumberBorder: "#1F2937",

  // Markers
  markerAddedBackground: "rgba(74, 255, 159, 0.2)",
  markerRemovedBackground: "rgba(255, 82, 82, 0.2)",
  markerModifiedBackground: "rgba(0, 184, 230, 0.2)",
  markerText: "#7A8599",

  // Borders and dividers
  borderColor: "#1F2937",
  dividerColor: "#1F2937",

  // Summary bar
  summaryBackground: "#0F1420",
  summaryAddedText: "#4AFF9F",
  summaryRemovedText: "#FF5252",
  summaryModifiedText: "#00B8E6",

  // Empty state
  emptyStateText: "#7A8599",

  // Separator
  separatorBackground: "#141925",
  separatorText: "#7A8599",
};

/**
 * Theme collection
 */
export const diffThemes = {
  gitClassic: gitClassicTheme,
  devToolsDefault: devToolsDefaultTheme,
} as const;

export type DiffThemeKey = keyof typeof diffThemes;
