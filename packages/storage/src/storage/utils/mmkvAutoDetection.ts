/**
 * MMKV Auto-Detection
 *
 * Automatically detects and registers MMKV instances that are exported
 * from common locations in React Native apps. This allows zero-config
 * setup - just create your MMKV instances and export them, and they'll
 * be automatically detected by the dev tools.
 *
 * Detection Strategy:
 * 1. Check global.__mmkvInstances (if app manually adds them)
 * 2. Scan common import paths for exported MMKV instances
 * 3. Listen for new instances via monkey-patching MMKV constructor
 */

import { isMMKVAvailable, getMMKVClass } from './mmkvAvailability';
import { mmkvInstanceRegistry } from './MMKVInstanceRegistry';
import { mmkvListener } from './MMKVListener';

interface GlobalWithMMKV {
  __mmkvInstances?: Map<string, any>;
  __mmkvAutoDetectionEnabled?: boolean;
}

declare const global: GlobalWithMMKV;

let isAutoDetectionSetup = false;
let detectedInstances = new Map<any, string>();

/**
 * Auto-detect MMKV instances by monkey-patching createMMKV function
 *
 * This intercepts all createMMKV() calls and automatically registers them.
 */
function setupConstructorInterception() {
  if (!isMMKVAvailable()) return;

  try {
    const mmkvModule = require('react-native-mmkv');

    // v4 uses createMMKV function instead of MMKV class
    const originalCreateMMKV = mmkvModule.createMMKV;

    if (!originalCreateMMKV) {
      console.warn('[DevTools] createMMKV function not found in react-native-mmkv');
      return;
    }

    // Check if already patched
    if ((originalCreateMMKV as any).__patched) {
      return;
    }

    // Create wrapper that auto-registers instances
    const patchedCreateMMKV = function(config?: any) {
      // Call original createMMKV
      const instance = originalCreateMMKV(config);

      // Auto-register this instance
      const instanceId = config?.id || 'mmkv.default';
      const encrypted = config?.encryptionKey !== undefined;

      // Register if not already registered
      if (!mmkvInstanceRegistry.has(instanceId)) {
        mmkvInstanceRegistry.register(instanceId, instance, { encrypted });
        mmkvListener.addInstance(instance, instanceId);
        detectedInstances.set(instance, instanceId);
      }

      return instance;
    };

    // Mark as patched
    (patchedCreateMMKV as any).__patched = true;

    // Replace the exported createMMKV function
    mmkvModule.createMMKV = patchedCreateMMKV;
  } catch (error) {
    // Silently fail - manual registration will work instead
  }
}

/**
 * Scan for existing MMKV instances in the global scope
 */
function scanGlobalInstances() {
  // Check if app has manually registered instances
  if (global.__mmkvInstances) {
    global.__mmkvInstances.forEach((instance, id) => {
      if (!mmkvInstanceRegistry.has(id)) {
        mmkvInstanceRegistry.register(id, instance);
        mmkvListener.addInstance(instance, id);
        detectedInstances.set(instance, id);
      }
    });
  }
}

/**
 * Try to import and scan common storage module paths
 *
 * Note: Dynamic require with variable paths doesn't work with Metro bundler,
 * so we skip this in React Native. Constructor interception will catch instances instead.
 */
function scanCommonPaths() {
  // Skip path scanning in React Native - Metro bundler doesn't support dynamic requires
  // Constructor interception will catch all instances anyway
  return;
}

/**
 * Scan a module for MMKV instances
 */
function scanModuleForMMKV(module: any, modulePath: string) {
  if (!module || typeof module !== 'object') return;

  const MMKVClass = getMMKVClass();
  if (!MMKVClass) return;

  Object.keys(module).forEach((key) => {
    const value = module[key];

    // Check if this is an MMKV instance
    if (value && value instanceof MMKVClass) {
      // Generate instance ID from export name
      const instanceId = key === 'default' ? 'mmkv.default' : key;

      if (!mmkvInstanceRegistry.has(instanceId) && !detectedInstances.has(value)) {
        // Try to detect if encrypted (heuristic: if it's named 'secure' or 'encrypted')
        const encrypted = /secure|encrypted|private/i.test(key);

        mmkvInstanceRegistry.register(instanceId, value, { encrypted });
        mmkvListener.addInstance(value, instanceId);
        detectedInstances.set(value, instanceId);
      }
    }
  });
}

/**
 * Enable auto-detection of MMKV instances
 *
 * This should be called once when the dev tools initialize.
 * It will automatically find and register any MMKV instances.
 *
 * @example
 * ```typescript
 * // In your app initialization (or FloatingDevTools component)
 * if (__DEV__) {
 *   enableMMKVAutoDetection();
 * }
 * ```
 */
export function enableMMKVAutoDetection() {
  if (!isMMKVAvailable()) {
    return;
  }

  if (isAutoDetectionSetup) {
    return;
  }

  // 1. Scan for existing instances
  scanGlobalInstances();
  scanCommonPaths();

  // 2. Setup constructor interception for future instances
  setupConstructorInterception();

  isAutoDetectionSetup = true;
  global.__mmkvAutoDetectionEnabled = true;
}

/**
 * Disable auto-detection (cleanup)
 */
export function disableMMKVAutoDetection() {
  isAutoDetectionSetup = false;
  detectedInstances.clear();
  global.__mmkvAutoDetectionEnabled = false;
}

/**
 * Manual registration helper (for when auto-detection doesn't work)
 *
 * This is a simplified one-liner for manual registration.
 *
 * @example
 * ```typescript
 * import { MMKV } from 'react-native-mmkv';
 * import { registerMMKV } from '@react-buoy/storage';
 *
 * const storage = new MMKV();
 * registerMMKV('storage', storage); // One line!
 * ```
 */
export function registerMMKV(
  id: string,
  instance: any,
  options?: { encrypted?: boolean }
) {
  if (!isMMKVAvailable()) {
    return;
  }

  mmkvInstanceRegistry.register(id, instance, options);
  mmkvListener.addInstance(instance, id);
  detectedInstances.set(instance, id);
}

/**
 * Get all detected instances
 */
export function getDetectedInstances(): string[] {
  return Array.from(detectedInstances.values());
}

/**
 * Check if auto-detection is enabled
 */
export function isAutoDetectionEnabled(): boolean {
  return isAutoDetectionSetup;
}
