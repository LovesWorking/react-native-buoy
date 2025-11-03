/**
 * Type definitions for debug-borders package
 */

/**
 * Props for the DebugBordersModal component
 */
export interface DebugBordersModalProps {
  /** Enable shared modal dimensions */
  enableSharedModalDimensions?: boolean;
}

/**
 * Debug Borders Manager API
 */
export interface DebugBordersManagerAPI {
  /** Enable debug borders */
  enable: () => void;
  /** Disable debug borders */
  disable: () => void;
  /** Toggle debug borders on/off */
  toggle: () => void;
  /** Check if debug borders are enabled */
  isEnabled: () => boolean;
  /** Set enabled state */
  setEnabled: (enabled: boolean) => void;
  /** Subscribe to state changes */
  subscribe: (callback: (enabled: boolean) => void) => () => void;
}

/**
 * Rectangle measurement data
 */
export interface RectangleMeasurement {
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
}

/**
 * Component instance with fiber node reference
 */
export interface ComponentInstance {
  node: any; // Fiber node
  depth: number;
}

