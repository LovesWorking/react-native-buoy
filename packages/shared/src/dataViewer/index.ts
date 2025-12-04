// Export shared components for use across the app
export { DataViewer } from "./DataViewer";
export { VirtualizedDataExplorer } from "./VirtualizedDataExplorer";
export { TypeLegend } from "./TypeLegend";
export { CyberpunkInput } from "./CyberpunkInput";
export { IndentGuides } from "./IndentGuides";
export { IndentGuidesOverlay } from "./IndentGuidesOverlay";
export { default as TreeDiffViewer } from "./tree/TreeDiffViewer";

// Diff viewer components
export { SplitDiffViewer } from "./SplitDiffViewer";
export type { SplitDiffViewerProps, SplitDiffViewerOptions } from "./SplitDiffViewer";
export { DiffSummary } from "./DiffSummary";
export type { DiffSummaryProps } from "./DiffSummary";

// Diff utilities and themes
export {
  computeLineDiff,
  DiffType,
  type LineDiffInfo,
  type WordDiff,
  type DiffComputeOptions,
} from "./lineDiff";
export {
  diffThemes,
  gitClassicTheme,
  devToolsDefaultTheme,
  type DiffTheme,
  type DiffThemeKey,
} from "./diffThemes";
