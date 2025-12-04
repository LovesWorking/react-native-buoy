/**
 * EventHistoryViewer
 *
 * A reusable component for viewing event history with current/diff views.
 * Used by Storage events, Render events, and other event-based dev tools.
 */

// Main component
export { EventHistoryViewer } from "./EventHistoryViewer";

// Sub-components (can be used independently)
export { ViewToggleCards } from "./ViewToggleCards";
export { DiffModeTabs } from "./DiffModeTabs";
export { CompareBar } from "./CompareBar";
export { EventPickerModal } from "./EventPickerModal";

// Types
export type {
  ViewMode,
  DiffModeTab,
  EventDisplayInfo,
  IconComponent,
  ViewToggleCardsProps,
  CompareBarProps,
  DiffModeTabsProps,
  EventPickerItem,
  EventPickerModalProps,
  EventHistoryViewerProps,
} from "./types";
