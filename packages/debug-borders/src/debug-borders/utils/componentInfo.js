/**
 * Component Info Extraction
 *
 * Extracts identifying information from React fiber nodes for display labels.
 * Uses a priority order similar to highlight-updates:
 * 1. testID (green)
 * 2. nativeID (amber)
 * 3. componentName (purple) - React component name from fiber
 * 4. accessibilityLabel (pink)
 * 5. displayName - Friendly name from ViewTypeMapper
 * 6. viewType - Native class name fallback
 */

"use strict";

const { getComponentDisplayName } = require("./ViewTypeMapper");
const { getNativeViewClassName, getComponentName } = require("./fiberTreeTraversal");

/**
 * Identifier types with their display configuration
 */
const IDENTIFIER_CONFIG = {
  testID: {
    label: "test",
    color: "#10b981", // Green
  },
  nativeID: {
    label: "native",
    color: "#f59e0b", // Amber
  },
  component: {
    label: "comp",
    color: "#a855f7", // Purple
  },
  accessibilityLabel: {
    label: "a11y",
    color: "#ec4899", // Pink
  },
  viewType: {
    label: "view",
    color: "#6b7280", // Gray (fallback)
  },
};

/**
 * Extracts component information from a fiber node
 *
 * @param {Object} fiber - The fiber node
 * @param {Object} stateNode - The fiber's stateNode (public instance)
 * @returns {Object} - Component info with label, type, and color
 */
function extractComponentInfo(fiber, stateNode) {
  const props = fiber.memoizedProps || fiber.pendingProps || {};

  // Get native view class name (e.g., "RCTView", "RCTText")
  const viewType = getNativeViewClassName(stateNode) || "Unknown";

  // Get friendly display name (e.g., "View", "Text")
  const displayName = getComponentDisplayName(viewType);

  // Get React component name from fiber (walks up tree to find user component)
  const componentName = getComponentName(fiber);

  // Extract identifiers from props
  const testID = props.testID || null;
  const nativeID = props.nativeID || null;
  const accessibilityLabel = props.accessibilityLabel || props.accessible?.label || null;

  // Extract additional accessibility props
  const accessibilityRole = props.accessibilityRole || props.role || null;
  const accessibilityHint = props.accessibilityHint || null;
  const accessibilityState = props.accessibilityState || null;

  // Extract style info (flatten if array)
  let styleInfo = null;
  if (props.style) {
    try {
      const flatStyle = Array.isArray(props.style)
        ? Object.assign({}, ...props.style.filter(Boolean))
        : props.style;
      styleInfo = flatStyle;
    } catch (e) {
      styleInfo = null;
    }
  }

  // Get fiber debug info
  const fiberTag = fiber.tag;
  const fiberKey = fiber.key;

  // Get parent component name
  let parentComponentName = null;
  let parentFiber = fiber.return;
  while (parentFiber) {
    if (parentFiber.type && typeof parentFiber.type === "function") {
      parentComponentName = parentFiber.type.displayName || parentFiber.type.name || null;
      if (parentComponentName) break;
    }
    parentFiber = parentFiber.return;
  }

  // Build the info object
  const info = {
    viewType,
    displayName,
    componentName,
    parentComponentName,
    testID,
    nativeID,
    accessibilityLabel,
    accessibilityRole,
    accessibilityHint,
    accessibilityState,
    fiberTag,
    fiberKey,
    styleInfo,
    // Primary identifier (following priority order)
    primaryLabel: null,
    primaryType: null,
    primaryColor: null,
  };

  // Determine primary label following priority order
  // 1. testID (most specific)
  // 2. accessibilityLabel (user-facing identifier)
  // 3. everything else (componentName, nativeID, viewType)
  if (testID) {
    info.primaryLabel = testID;
    info.primaryType = "testID";
    info.primaryColor = IDENTIFIER_CONFIG.testID.color;
  } else if (accessibilityLabel) {
    info.primaryLabel = accessibilityLabel;
    info.primaryType = "accessibilityLabel";
    info.primaryColor = IDENTIFIER_CONFIG.accessibilityLabel.color;
  } else if (componentName) {
    info.primaryLabel = componentName;
    info.primaryType = "component";
    info.primaryColor = IDENTIFIER_CONFIG.component.color;
  } else if (nativeID) {
    info.primaryLabel = nativeID;
    info.primaryType = "nativeID";
    info.primaryColor = IDENTIFIER_CONFIG.nativeID.color;
  } else {
    // Fallback to display name
    info.primaryLabel = displayName;
    info.primaryType = "viewType";
    info.primaryColor = IDENTIFIER_CONFIG.viewType.color;
  }

  return info;
}

/**
 * Gets a short label for display (truncates long values)
 *
 * @param {string} label - The full label
 * @param {number} maxLength - Maximum length (default 20)
 * @returns {string} - Truncated label
 */
function getShortLabel(label, maxLength = 20) {
  if (!label) return "";
  if (label.length <= maxLength) return label;
  return label.substring(0, maxLength - 1) + "…";
}

/**
 * Gets the type prefix for a label (e.g., "test:", "a11y:")
 *
 * @param {string} type - The identifier type
 * @returns {string} - The prefix
 */
function getLabelPrefix(type) {
  const config = IDENTIFIER_CONFIG[type];
  return config ? config.label + ":" : "";
}

module.exports = {
  extractComponentInfo,
  getShortLabel,
  getLabelPrefix,
  IDENTIFIER_CONFIG,
};
