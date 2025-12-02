// UI exports
export * from "./ui";

// Utils exports - selectively export to avoid conflicts
export {
  // Display utilities
  displayValue,
  parseDisplayValue,
  // Safe area utilities
  getSafeAreaInsets,
  // Async storage utilities (legacy - wraps persistentStorage)
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  isPersistentStorageAvailable,
  useSafeAsyncStorage,
  // Persistent storage utilities (new)
  persistentStorage,
  isUsingPersistentStorage,
  getStorageBackendType,
  // String utilities
  safeStringify,
  // Type helper utilities (excluding isPlainObject due to conflict)
  getValueType,
  isPrimitive,
  isJsonSerializable,
  isValidJson,
  getConstructorName,
  isEmpty,
  getValueSize,
  // Value formatting utilities
  parseValue,
  formatValue,
  getTypeColor,
  truncateText,
  flattenObject,
  formatPath,
  // Optional module loading utilities
  loadOptionalModule,
  getCachedOptionalModule,
} from "./utils";

// Also export formatting utils
export * from "./utils/formatting";
export * from "./utils/time";

// Type helper's isPlainObject as isPlainObjectUtil to avoid conflict
export { isPlainObject as isPlainObjectUtil } from "./utils/typeHelpers";

// Icons exports
export * from "./icons";

// Other exports
export * from "./clipboard";
export * from "./logger";
export * from "./settings";
export * from "./storage";
export { useSafeAreaInsets, useFilterManager } from "./hooks";

// JsModal
export { JsModal } from "./JsModal";
export type { ModalMode, ModalState } from "./JsModal";
// game ui colors
export { gameUIColors } from "./ui/gameUI/constants/gameUIColors";
export { macOSColors } from "./ui/gameUI/constants/macOSDesignSystemColors";
export { dialColors } from "./ui/gameUI/constants/gameUIColors";
export type { GameUIColorKey } from "./ui/gameUI/constants/gameUIColors";
//EnvironmentIndicator
export { EnvironmentIndicator } from "./env/EnvironmentIndicator";
export type { Environment } from "./types/types";

// Context exports
export { HintsProvider, useHintsDisabled, useHintsContext } from "./context";
