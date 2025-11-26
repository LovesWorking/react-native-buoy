/**
 * Auto-detect Clipboard Implementation
 *
 * This module re-exports clipboard functionality that was configured
 * at install time by the postinstall script (scripts/detect-clipboard.js).
 *
 * The postinstall script detects which clipboard library is installed:
 * 1. expo-clipboard (preferred for Expo projects)
 * 2. @react-native-clipboard/clipboard (for RN CLI projects)
 * 3. none (graceful degradation)
 *
 * This is a TRUE zero-config solution because:
 * - No metro.config.js changes needed
 * - Detection happens at install time (not bundle time)
 * - Metro sees static imports only
 * - Works with any Metro version
 */

// Re-export everything from the generated implementation
export {
  clipboardFunction,
  clipboardType,
  isClipboardAvailable,
  type ClipboardFunction,
} from "./clipboard-impl";

// For backwards compatibility, also export these wrapper functions
import {
  clipboardFunction,
  isClipboardAvailable as _isClipboardAvailable,
} from "./clipboard-impl";

/**
 * Attempts to auto-detect and return a clipboard implementation.
 * Returns null if no clipboard library is available.
 */
export function createAutoDetectedClipboard(): typeof clipboardFunction | null {
  if (_isClipboardAvailable()) {
    return clipboardFunction;
  }
  return null;
}

/**
 * Gets the auto-detected clipboard function.
 * Returns a function that will attempt to copy text and return success/failure.
 * If no clipboard library is available, it logs an error and returns false.
 */
export function getAutoDetectedClipboard(): typeof clipboardFunction {
  return clipboardFunction;
}
