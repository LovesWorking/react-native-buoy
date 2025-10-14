/**
 * Storage keys for persisting floating tools state
 */
export const STORAGE_KEYS = {
  BUBBLE_POSITION_X: '@floating_tools_bubble_position_x',
  BUBBLE_POSITION_Y: '@floating_tools_bubble_position_y',
} as const;

/**
 * Default configuration values for floating tools
 */
export const DEFAULTS = {
  VISIBLE_HANDLE_WIDTH: 32,
  DEBOUNCE_DELAY_MS: 500,
  TAP_THRESHOLD_PX: 5,
  SAFE_AREA_TOP_PADDING: 20,
  DEFAULT_BUBBLE_MARGIN: 20,
  DEFAULT_Y_FALLBACK: 100,
} as const;
