/**
 * MMKV Availability Detection
 *
 * Safely detects if react-native-mmkv is available in the current environment.
 * This allows the app to work in Expo Go where native modules aren't available.
 */

let _isMMKVAvailable: boolean | null = null;
let _MMKVClass: any = null;

/**
 * Check if MMKV is available in the current environment
 *
 * @returns True if react-native-mmkv is installed and available
 */
export function isMMKVAvailable(): boolean {
  // Cache the result after first check
  if (_isMMKVAvailable !== null) {
    return _isMMKVAvailable;
  }

  try {
    // Attempt to require MMKV
    const MMKVModule = require('react-native-mmkv');

    // v4 exports createMMKV function instead of MMKV class
    _MMKVClass = MMKVModule.MMKV || MMKVModule.createMMKV;
    _isMMKVAvailable = _MMKVClass !== undefined;
    return _isMMKVAvailable;
  } catch (error) {
    // MMKV is not available (e.g., Expo Go, not installed)
    _isMMKVAvailable = false;
    return false;
  }
}

/**
 * Get the MMKV class if available
 *
 * @returns MMKV class or null if not available
 */
export function getMMKVClass(): any | null {
  if (!isMMKVAvailable()) {
    return null;
  }
  return _MMKVClass;
}

/**
 * Get a user-friendly error message when MMKV is not available
 */
export function getMMKVUnavailableMessage(): string {
  return 'MMKV is not available in this environment. MMKV requires native modules and cannot run in Expo Go. Please use a development build or EAS Build.';
}
