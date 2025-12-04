/**
 * Label Positioning Utility
 *
 * Resolves overlapping labels by repositioning them.
 * Uses a greedy algorithm that processes labels once and offsets
 * any that would overlap with already-placed labels.
 *
 * Time Complexity: O(n²) worst case, but typically much faster
 * since we only compare against nearby labels and use early exit.
 */

"use strict";

/**
 * Configuration for label positioning
 */
const CONFIG = {
  // Minimum spacing between labels (pixels)
  LABEL_SPACING: 0,
  // Maximum vertical offset before giving up (pixels)
  MAX_VERTICAL_OFFSET: 100,
  // Label height estimate (used for offset increments)
  LABEL_HEIGHT: 10,
  // Padding around labels for collision detection
  PADDING: 0,
};

/**
 * Check if two rectangles overlap
 *
 * @param {Object} a - First rectangle {x, y, width, height}
 * @param {Object} b - Second rectangle {x, y, width, height}
 * @returns {boolean} - True if rectangles overlap
 */
function rectsOverlap(a, b) {
  const padding = CONFIG.PADDING;

  const aLeft = a.x - padding;
  const aRight = a.x + a.width + padding;
  const aTop = a.y - padding;
  const aBottom = a.y + a.height + padding;

  const bLeft = b.x - padding;
  const bRight = b.x + b.width + padding;
  const bTop = b.y - padding;
  const bBottom = b.y + b.height + padding;

  // No overlap if one is completely to the side or above/below the other
  return !(aRight < bLeft || aLeft > bRight || aBottom < bTop || aTop > bBottom);
}

/**
 * Estimate label width based on text length
 * (Used when actual measurement isn't available)
 *
 * @param {string} text - Label text
 * @returns {number} - Estimated width in pixels
 */
function estimateLabelWidth(text) {
  if (!text) return 0;
  // Approximate: 5px per character for 8pt monospace font + padding
  return text.length * 5 + 8;
}

/**
 * Resolve overlapping labels by stacking them upward like a menu
 *
 * Strategy: Process labels in order. For each label, check if it overlaps
 * with any already-placed label. If so, stack it above (going upward).
 * Labels are positioned above their boxes, stacking upward with no gaps.
 *
 * @param {Array<Object>} rectangles - Array of rectangle data with componentInfo
 * @returns {Array<Object>} - Same array with added labelOffset property
 */
function resolveOverlappingLabels(rectangles) {
  if (!rectangles || rectangles.length === 0) {
    return rectangles;
  }

  // Filter to only rectangles with valid labels (testID or accessibilityLabel)
  const validRectangles = rectangles.filter((rect) => {
    const info = rect.componentInfo;
    return info && (info.testID || info.accessibilityLabel);
  });

  // Build label rects with estimated dimensions
  // Labels are positioned ABOVE the box (y - labelHeight)
  const labelRects = rectangles.map((rect, index) => {
    const info = rect.componentInfo;
    const hasValidLabel = info && (info.testID || info.accessibilityLabel);
    const labelText = hasValidLabel ? info.primaryLabel : "";
    const labelWidth = estimateLabelWidth(labelText);

    return {
      index,
      hasValidLabel,
      // Label position is above the box
      x: rect.x,
      y: rect.y - CONFIG.LABEL_HEIGHT, // Position above the box
      width: labelWidth,
      height: CONFIG.LABEL_HEIGHT,
      // Track the offset we apply (going upward, so negative)
      offsetY: 0,
    };
  });

  // Sort by position (top-to-bottom, left-to-right) for consistent placement
  const sortedIndices = labelRects
    .map((_, i) => i)
    .filter((i) => labelRects[i].hasValidLabel) // Only process valid labels
    .sort((a, b) => {
      const rectA = rectangles[a];
      const rectB = rectangles[b];
      // Primary sort by Y, secondary by X
      if (Math.abs(rectA.y - rectB.y) > 10) {
        return rectA.y - rectB.y;
      }
      return rectA.x - rectB.x;
    });

  // Track placed labels for collision detection
  const placedLabels = [];

  // Process each label in sorted order
  for (const idx of sortedIndices) {
    const label = labelRects[idx];

    // Skip empty labels
    if (label.width === 0) {
      continue;
    }

    let offsetY = 0;
    let hasOverlap = true;
    let attempts = 0;
    const maxAttempts = Math.ceil(CONFIG.MAX_VERTICAL_OFFSET / CONFIG.LABEL_HEIGHT);

    while (hasOverlap && attempts < maxAttempts) {
      // Create test rect with current offset (going upward)
      const testRect = {
        x: label.x,
        y: label.y - offsetY, // Subtract to go upward
        width: label.width,
        height: label.height,
      };

      // Check against all placed labels
      hasOverlap = placedLabels.some((placed) => rectsOverlap(testRect, placed));

      if (hasOverlap) {
        // Stack upward with no spacing
        offsetY += CONFIG.LABEL_HEIGHT;
        attempts++;
      }
    }

    // Store the offset
    label.offsetY = offsetY;

    // Add to placed labels with final position
    placedLabels.push({
      x: label.x,
      y: label.y - offsetY,
      width: label.width,
      height: label.height,
    });
  }

  // Apply offsets to original rectangles
  return rectangles.map((rect, index) => ({
    ...rect,
    labelOffsetY: labelRects[index].offsetY,
  }));
}

/**
 * Quick check if any labels might overlap (for early exit optimization)
 *
 * @param {Array<Object>} rectangles - Array of rectangle data
 * @returns {boolean} - True if there might be overlaps worth resolving
 */
function mightHaveOverlaps(rectangles) {
  if (!rectangles || rectangles.length < 2) {
    return false;
  }

  // Quick heuristic: check if any boxes are close together
  for (let i = 0; i < Math.min(rectangles.length, 20); i++) {
    for (let j = i + 1; j < Math.min(rectangles.length, 20); j++) {
      const a = rectangles[i];
      const b = rectangles[j];

      // If boxes are within label height of each other vertically
      // and overlap horizontally, we might have label overlaps
      if (
        Math.abs(a.y - b.y) < CONFIG.LABEL_HEIGHT * 2 &&
        !(a.x + 100 < b.x || b.x + 100 < a.x)
      ) {
        return true;
      }
    }
  }

  return false;
}

module.exports = {
  resolveOverlappingLabels,
  rectsOverlap,
  estimateLabelWidth,
  mightHaveOverlaps,
  CONFIG,
};
