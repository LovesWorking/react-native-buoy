import { Dimensions } from "react-native";

/**
 * Shared constants for onboarding tooltip positioning
 * These ensure the floating menu aligns perfectly under the tooltip arrow
 * All positions are calculated dynamically based on screen size
 */

// Arrow dimensions (relative positioning)
export const ARROW_BOTTOM_OFFSET = -40; // Arrow extends below tooltip
export const ARROW_HEIGHT = 20; // borderTopWidth of arrow
export const SPACING_GAP = 10; // Gap between arrow tip and target element

/**
 * Calculate the center Y position of the screen
 * This is used to vertically center the onboarding UI
 *
 * @returns Y coordinate at the center of the screen
 */
export function getScreenCenterY(): number {
  const { height: screenHeight } = Dimensions.get("window");
  return screenHeight / 2;
}

/**
 * Calculate the tooltip position to center it vertically on screen
 * Uses flexbox-style centering - tooltip will center itself with its actual size
 *
 * @returns Distance from screen bottom for tooltip positioning
 */
export function calculateTooltipPosition(): number {
  // Position from center - tooltip will be centered with transform or flex
  // We return a value that's slightly above center to account for the arrow below
  const centerY = getScreenCenterY();

  // Approximate offset to center the tooltip+arrow combo
  // This is a reasonable estimate that works for most tooltip sizes
  const estimatedHalfHeight = 130; // ~half of (tooltip + arrow)

  return centerY - estimatedHalfHeight;
}

/**
 * Calculate the position where a target element should be placed
 * to align directly under the tooltip arrow
 *
 * @returns Distance from screen bottom where element should be positioned
 */
export function calculateTargetPosition(): number {
  const tooltipBottom = calculateTooltipPosition();

  // Arrow tip position = tooltip bottom + arrow offset (arrow extends below, so negative)
  const arrowTipFromBottom = tooltipBottom + ARROW_BOTTOM_OFFSET;

  // Subtract arrow height to get to the actual tip
  const actualArrowTip = arrowTipFromBottom - ARROW_HEIGHT;

  // Subtract spacing gap to position element below arrow
  return actualArrowTip - SPACING_GAP;
}
