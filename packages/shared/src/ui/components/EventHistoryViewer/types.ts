/**
 * EventHistoryViewer Types
 *
 * Type definitions for the EventHistoryViewer component and its sub-components.
 * This is a dumb component - all state is controlled externally via props.
 */

import type { ComponentType, ReactNode } from "react";

/**
 * View mode for the main toggle
 */
export type ViewMode = "current" | "diff";

/**
 * Configuration for a diff mode tab
 */
export interface DiffModeTab {
  key: string;
  label: string;
  disabled?: boolean;
}

/**
 * Event metadata for display in CompareBar
 */
export interface EventDisplayInfo {
  /** Event index in the array */
  index: number;
  /** Display label (e.g., "#1", "#1 / 5", "Render #5") */
  label: string;
  /** Formatted timestamp (e.g., "12:34:56.789") */
  timestamp: string;
  /** Relative time (e.g., "2s ago") */
  relativeTime: string;
  /** Optional badge to render (action badge, cause badge, etc.) */
  badge?: ReactNode;
}

/**
 * Icon component type
 */
export type IconComponent = ComponentType<{ size: number; color: string }>;

/**
 * Props for ViewToggleCards sub-component
 */
export interface ViewToggleCardsProps {
  /** Currently active view */
  activeView: ViewMode;
  /** Callback when view changes */
  onViewChange: (view: ViewMode) => void;
  /** Label for current view card */
  currentLabel: string;
  /** Description for current view card */
  currentDescription: string;
  /** Icon for current view card */
  currentIcon: IconComponent;
  /** Label for diff view card */
  diffLabel: string;
  /** Description for diff view card */
  diffDescription: string;
  /** Icon for diff view card */
  diffIcon: IconComponent;
  /** Whether diff view is disabled (e.g., only 1 event) */
  diffDisabled?: boolean;
}

/**
 * Props for CompareBar sub-component
 */
export interface CompareBarProps {
  /** Left (PREV) event info */
  leftEvent: EventDisplayInfo;
  /** Right (CUR) event info */
  rightEvent: EventDisplayInfo;

  // Navigation controls (optional - for any-to-any mode)
  /** Show navigation buttons */
  showNavigation?: boolean;
  /** Callback for left previous button */
  onLeftPrevious?: () => void;
  /** Callback for left next button */
  onLeftNext?: () => void;
  /** Callback for right previous button */
  onRightPrevious?: () => void;
  /** Callback for right next button */
  onRightNext?: () => void;
  /** Whether left previous is enabled */
  canLeftPrevious?: boolean;
  /** Whether left next is enabled */
  canLeftNext?: boolean;
  /** Whether right previous is enabled */
  canRightPrevious?: boolean;
  /** Whether right next is enabled */
  canRightNext?: boolean;

  // Picker callbacks (optional - for any-to-any mode)
  /** Callback when left side is pressed (opens picker) */
  onLeftPress?: () => void;
  /** Callback when right side is pressed (opens picker) */
  onRightPress?: () => void;
}

/**
 * Props for DiffModeTabs sub-component
 */
export interface DiffModeTabsProps {
  /** Available tabs */
  tabs: DiffModeTab[];
  /** Currently active tab key */
  activeTab: string;
  /** Callback when tab changes */
  onTabChange: (tab: string) => void;
}

/**
 * Item in the event picker modal
 */
export interface EventPickerItem {
  /** Event index */
  index: number;
  /** Display label */
  label: string;
  /** Formatted timestamp */
  timestamp: string;
  /** Relative time */
  relativeTime: string;
  /** Optional badge */
  badge?: ReactNode;
  /** Optional diff preview (e.g., +3 -2 ~1) */
  diffPreview?: ReactNode;
  /** Whether this item is disabled (can't be selected) */
  disabled?: boolean;
  /** Whether this item is currently selected */
  selected?: boolean;
}

/**
 * Props for EventPickerModal sub-component
 */
export interface EventPickerModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Modal title */
  title: string;
  /** Position determines styling (left = PREV, right = CUR) */
  position: "left" | "right";
  /** Items to display in the picker */
  items: EventPickerItem[];
  /** Callback when an item is selected */
  onSelect: (index: number) => void;
}

/**
 * Props for the main EventHistoryViewer component
 */
export interface EventHistoryViewerProps {
  // === View Toggle ===
  /** Currently active view */
  activeView: ViewMode;
  /** Callback when view changes */
  onViewChange: (view: ViewMode) => void;
  /** Label for current view card */
  currentViewLabel: string;
  /** Description for current view card */
  currentViewDescription: string;
  /** Icon for current view card */
  currentViewIcon: IconComponent;
  /** Label for diff view card */
  diffViewLabel: string;
  /** Description for diff view card */
  diffViewDescription: string;
  /** Icon for diff view card */
  diffViewIcon: IconComponent;

  // === Current View Content ===
  /** Render function for current view content */
  renderCurrentView: () => ReactNode;

  // === Diff View ===
  /** Diff mode tabs (optional - omit for single diff view) */
  diffModeTabs?: DiffModeTab[];
  /** Active diff mode key */
  activeDiffMode?: string;
  /** Callback when diff mode changes */
  onDiffModeChange?: (mode: string) => void;
  /** Render function for diff content */
  renderDiffContent: () => ReactNode;

  // === Compare Bar ===
  /** Left (PREV) event info */
  leftEvent: EventDisplayInfo;
  /** Right (CUR) event info */
  rightEvent: EventDisplayInfo;

  /** Show navigation in compare bar (for any-to-any mode) */
  showCompareNavigation?: boolean;
  /** Callback for left previous */
  onLeftPrevious?: () => void;
  /** Callback for left next */
  onLeftNext?: () => void;
  /** Callback for right previous */
  onRightPrevious?: () => void;
  /** Callback for right next */
  onRightNext?: () => void;
  /** Whether left previous is enabled */
  canLeftPrevious?: boolean;
  /** Whether left next is enabled */
  canLeftNext?: boolean;
  /** Whether right previous is enabled */
  canRightPrevious?: boolean;
  /** Whether right next is enabled */
  canRightNext?: boolean;

  /** Callback when left side is pressed (opens picker) */
  onLeftPickerOpen?: () => void;
  /** Callback when right side is pressed (opens picker) */
  onRightPickerOpen?: () => void;

  // === Footer ===
  /** Disable internal footer (use external modal footer) */
  disableInternalFooter?: boolean;
  /** Current index for footer navigation */
  footerCurrentIndex: number;
  /** Total items for footer navigation */
  footerTotalItems: number;
  /** Item label for footer (e.g., "Event", "Render") */
  footerItemLabel: string;
  /** Subtitle for footer (e.g., relative time) */
  footerSubtitle?: string;
  /** Callback for footer previous button */
  onFooterPrevious: () => void;
  /** Callback for footer next button */
  onFooterNext: () => void;
}
