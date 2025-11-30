/**
 * Pre-configured highlight updates tool for FloatingDevTools
 *
 * This preset provides standalone "Highlight updates when components render"
 * functionality. Tap the icon to toggle highlights on/off.
 *
 * The overlay is automatically rendered by FloatingDevTools when the
 * @react-buoy/highlight-updates package is installed.
 *
 * Two presets available:
 * - highlightUpdatesPreset: Quick toggle (no modal)
 * - highlightUpdatesModalPreset: Full modal with filters and render list
 *
 * @example
 * ```tsx
 * import { highlightUpdatesPreset, highlightUpdatesModalPreset } from '@react-buoy/highlight-updates';
 *
 * // Toggle-only: Just tap to enable/disable highlighting
 * <FloatingDevTools apps={[highlightUpdatesPreset]} />
 *
 * // Modal: Opens interface with filters, render list, and controls
 * <FloatingDevTools apps={[highlightUpdatesModalPreset]} />
 * ```
 */

import React, { useState, useEffect } from "react";
import { StackPulseIcon, RenderCountIcon } from "@react-buoy/shared-ui";
import type { FloatingMenuActions } from "@react-buoy/core";
import HighlightUpdatesController from "./highlight-updates/utils/HighlightUpdatesController";
import { HighlightUpdatesModal } from "./highlight-updates/components/HighlightUpdatesModal";

/**
 * Icon component that changes color based on enabled state.
 *
 * ⚠️ IMPORTANT - DO NOT MODIFY THIS COMPONENT ⚠️
 * This component MUST use useState and useEffect hooks to subscribe to the controller.
 * It is rendered as a JSX component (<IconComponent />) in FloatingMenu and DialIcon,
 * which allows hooks to work properly.
 *
 * If you remove the hooks or change this to read isEnabled() directly,
 * the icon color will NOT update when the toggle is pressed.
 */
function HighlightIcon({ size }: { size: number }) {
  const [enabled, setEnabled] = useState(() => HighlightUpdatesController.isEnabled());

  useEffect(() => {
    const unsubscribe = HighlightUpdatesController.subscribe((isEnabled) => {
      setEnabled(isEnabled);
    });
    return unsubscribe;
  }, []);

  return <StackPulseIcon size={size} color={enabled ? "#10b981" : "#6b7280"} />;
}

/**
 * Empty component for toggle-only tools (no modal needed)
 * The actual overlay is rendered by FloatingDevTools automatically
 */
function EmptyComponent() {
  return null;
}

/**
 * Pre-configured highlight updates tool for FloatingDevTools.
 * Tap the icon to toggle component render highlighting on/off.
 *
 * Features:
 * - Standalone implementation - no DevTools connection required
 * - Simple direct toggle (no modal)
 * - Icon changes color: gray when off, green when on
 * - Overlay auto-rendered by FloatingDevTools
 */
export const highlightUpdatesPreset = {
  id: "highlight-updates",
  name: "UPDATES",
  description: "Toggle component render highlights",
  slot: "row" as const,
  icon: HighlightIcon,
  component: EmptyComponent,
  props: {},
  launchMode: "toggle-only" as const,
  onPress: () => {
    // Initialize on first press if not already initialized
    if (!HighlightUpdatesController.isInitialized()) {
      HighlightUpdatesController.initialize();
    }

    HighlightUpdatesController.toggle();
    // Icon updates automatically via subscription in HighlightIcon component
  },
};

/**
 * Create a custom highlight updates tool configuration.
 * Use this if you want to override default settings.
 *
 * @example
 * ```tsx
 * import { createHighlightUpdatesTool } from '@react-buoy/highlight-updates';
 *
 * const myHighlightTool = createHighlightUpdatesTool({
 *   name: "RENDERS",
 *   enabledColor: "#ec4899",
 *   disabledColor: "#9ca3af",
 *   autoInitialize: true,
 * });
 * ```
 */
export function createHighlightUpdatesTool(options?: {
  /** Tool name (default: "UPDATES") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color when enabled (default: "#10b981" - green) */
  enabledColor?: string;
  /** Icon color when disabled (default: "#6b7280" - gray) */
  disabledColor?: string;
  /** Custom tool ID (default: "highlight-updates") */
  id?: string;
  /** Auto-initialize on first render (default: false) */
  autoInitialize?: boolean;
}) {
  const enabledColor = options?.enabledColor || "#10b981";
  const disabledColor = options?.disabledColor || "#6b7280";

  // Auto-initialize if requested
  if (options?.autoInitialize) {
    // Delay to allow DevTools to connect
    setTimeout(() => {
      HighlightUpdatesController.initialize();
    }, 1000);
  }

  /**
   * Custom icon component with hooks - rendered as JSX component.
   *
   * ⚠️ IMPORTANT - DO NOT MODIFY THIS COMPONENT ⚠️
   * This component MUST use useState and useEffect hooks to subscribe to the controller.
   * See the comment on HighlightIcon above for full explanation.
   */
  const CustomHighlightIcon = ({ size }: { size: number }) => {
    const [enabled, setEnabled] = useState(() => HighlightUpdatesController.isEnabled());

    useEffect(() => {
      const unsubscribe = HighlightUpdatesController.subscribe((isEnabled) => {
        setEnabled(isEnabled);
      });
      return unsubscribe;
    }, []);

    return <StackPulseIcon size={size} color={enabled ? enabledColor : disabledColor} />;
  };

  return {
    id: options?.id || "highlight-updates",
    name: options?.name || "UPDATES",
    description:
      options?.description || "Toggle component render highlights",
    slot: "row" as const,
    icon: CustomHighlightIcon,
    component: EmptyComponent,
    props: {},
    launchMode: "toggle-only" as const,
    onPress: () => {
      // Initialize on first press if not already initialized
      if (!HighlightUpdatesController.isInitialized()) {
        HighlightUpdatesController.initialize();
      }

      HighlightUpdatesController.toggle();
      // Icon updates automatically via subscription
    },
  };
}

/**
 * Modal preset for highlight updates tool.
 * Opens a full modal interface with:
 * - List of tracked component renders
 * - Start/Stop and Pause/Resume controls
 * - Clear button to reset render counts
 * - Search bar in navbar (expandable)
 * - Filter by viewType, testID, nativeID, componentName
 *
 * Use this preset when you want detailed render tracking and filtering.
 */
export const highlightUpdatesModalPreset = {
  id: "highlight-updates-modal",
  name: "RENDERS",
  description: "View component render tracking modal",
  slot: "both" as const,
  icon: ({ size }: { size: number }) => (
    <RenderCountIcon size={size} color="#10b981" />
  ),
  component: HighlightUpdatesModal,
  props: {
    enableSharedModalDimensions: false,
  },
};

/**
 * Create a custom highlight updates modal tool configuration.
 * Use this if you want to override default settings for the modal version.
 *
 * @example
 * ```tsx
 * import { createHighlightUpdatesModalTool } from '@react-buoy/highlight-updates';
 *
 * const myRendersTool = createHighlightUpdatesModalTool({
 *   name: "PROFILER",
 *   enabledColor: "#8b5cf6",
 *   disabledColor: "#9ca3af",
 * });
 * ```
 */
export function createHighlightUpdatesModalTool(options?: {
  /** Tool name (default: "RENDERS") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color when tracking enabled (default: "#10b981" - green) */
  enabledColor?: string;
  /** Icon color when tracking disabled (default: "#6b7280" - gray) */
  disabledColor?: string;
  /** Custom tool ID (default: "highlight-updates-modal") */
  id?: string;
  /** Auto-initialize on first render (default: false) */
  autoInitialize?: boolean;
}) {
  const enabledColor = options?.enabledColor || "#10b981";
  const disabledColor = options?.disabledColor || "#6b7280";

  // Auto-initialize if requested
  if (options?.autoInitialize) {
    setTimeout(() => {
      HighlightUpdatesController.initialize();
    }, 1000);
  }

  return {
    id: options?.id || "highlight-updates-modal",
    name: options?.name || "RENDERS",
    description:
      options?.description || "View component render tracking modal",
    slot: "both" as const,
    icon: ({ size }: { size: number }) => (
      <RenderCountIcon size={size} color={enabledColor} />
    ),
    component: HighlightUpdatesModal,
    props: {
      enableSharedModalDimensions: false,
    },
  };
}
