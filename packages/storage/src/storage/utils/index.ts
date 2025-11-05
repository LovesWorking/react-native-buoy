// Storage utilities
export { clearAllAppStorage } from "./clearAllStorage";

// MMKV Availability
export {
  isMMKVAvailable,
  getMMKVClass,
  getMMKVUnavailableMessage,
} from "./mmkvAvailability";

// AsyncStorage Event Listener
export {
  startListening,
  stopListening,
  addListener,
  removeAllListeners,
  isListening,
  getListenerCount,
  type AsyncStorageEvent,
  type AsyncStorageEventListener,
} from "./AsyncStorageListener";

// Re-export default listener instance
export { default as asyncStorageListener } from "./AsyncStorageListener";

// MMKV Instance Registry
export {
  registerMMKVInstance,
  unregisterMMKVInstance,
  mmkvInstanceRegistry,
  type MMKVInstanceInfo,
} from "./MMKVInstanceRegistry";

// MMKV Listener
export {
  addMMKVInstance,
  removeMMKVInstance,
  removeAllMMKVInstances,
  addMMKVListener,
  removeAllMMKVListeners,
  isMMKVInstanceMonitored,
  getMonitoredMMKVInstances,
  getMMKVInstanceCount,
  getMMKVListenerCount,
  isMMKVListening,
  mmkvListener,
  type MMKVEvent,
  type MMKVEventListener,
} from "./MMKVListener";

// MMKV Type Detection
export {
  detectMMKVType,
  formatMMKVValue,
  isTypeMatch,
  type MMKVValueType,
  type MMKVValueInfo,
} from "./mmkvTypeDetection";
