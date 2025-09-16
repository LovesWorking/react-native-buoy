// UI exports
export * from "./ui";

// Utils exports - selectively export to avoid conflicts
export {
  // Display utilities
  displayValue,
  parseDisplayValue,
  // Safe area utilities
  getSafeAreaInsets,
  // Async storage utilities
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  isPersistentStorageAvailable,
  useSafeAsyncStorage,
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
} from "./utils";

// Also export formatting utils
export * from "./utils/formatting";

// Type helper's isPlainObject as isPlainObjectUtil to avoid conflict
export { isPlainObject as isPlainObjectUtil } from "./utils/typeHelpers";

// Icons exports
export * from "./icons";

// Other exports
export * from "./clipboard";
export * from "./logger";
export * from "./settings";

// JsModal
export { JsModal } from "./JsModal";
export type { ModalMode } from "./JsModal";
