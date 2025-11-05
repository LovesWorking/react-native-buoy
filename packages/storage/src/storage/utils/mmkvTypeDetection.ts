/**
 * MMKV Type Detection Utilities
 *
 * MMKV stores values with native types (string, number, boolean, ArrayBuffer).
 * This module provides utilities to detect the type of a stored value by trying
 * each getter sequentially.
 */

// Use 'any' type for MMKV to avoid hard dependency on react-native-mmkv
type MMKV = any;

export type MMKVValueType = 'string' | 'number' | 'boolean' | 'buffer' | 'unknown';

export interface MMKVValueInfo {
  value: any;
  type: MMKVValueType;
}

/**
 * Detect the type of a value stored in MMKV by trying each getter.
 *
 * Since MMKV doesn't provide a getType() method, we must try each getter
 * (getString, getNumber, getBoolean, getBuffer) until one returns a value.
 *
 * Order matters: We try in order of most common types first.
 *
 * @param instance - MMKV instance to read from
 * @param key - Storage key
 * @returns Value and its detected type
 *
 * @example
 * ```typescript
 * const instance = createMMKV();
 * instance.set('name', 'John');
 * instance.set('age', 30);
 * instance.set('active', true);
 *
 * detectMMKVType(instance, 'name');   // { value: 'John', type: 'string' }
 * detectMMKVType(instance, 'age');    // { value: 30, type: 'number' }
 * detectMMKVType(instance, 'active'); // { value: true, type: 'boolean' }
 * detectMMKVType(instance, 'missing');// { value: undefined, type: 'unknown' }
 * ```
 */
export function detectMMKVType(instance: MMKV, key: string): MMKVValueInfo {
  // Try string (most common)
  const stringValue = instance.getString(key);
  if (stringValue !== undefined) {
    return { value: stringValue, type: 'string' };
  }

  // Try number
  const numberValue = instance.getNumber(key);
  if (numberValue !== undefined) {
    return { value: numberValue, type: 'number' };
  }

  // Try boolean
  const booleanValue = instance.getBoolean(key);
  if (booleanValue !== undefined) {
    return { value: booleanValue, type: 'boolean' };
  }

  // Try buffer (least common)
  const bufferValue = instance.getBuffer(key);
  if (bufferValue !== undefined) {
    // Format buffer for display (don't return raw ArrayBuffer)
    return {
      value: `<ArrayBuffer ${bufferValue.byteLength} bytes>`,
      type: 'buffer',
    };
  }

  // Key doesn't exist or unknown type
  return { value: undefined, type: 'unknown' };
}

/**
 * Format an MMKV value for display in the UI.
 *
 * @param value - The value to format
 * @param type - The detected type
 * @returns Formatted string representation
 *
 * @example
 * ```typescript
 * formatMMKVValue('hello', 'string');  // '"hello"'
 * formatMMKVValue(42, 'number');       // '42'
 * formatMMKVValue(true, 'boolean');    // 'true'
 * formatMMKVValue('<ArrayBuffer 1024 bytes>', 'buffer'); // '<ArrayBuffer 1024 bytes>'
 * ```
 */
export function formatMMKVValue(value: any, type: MMKVValueType): string {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';

  switch (type) {
    case 'string':
      return `"${value}"`;
    case 'number':
      return String(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'buffer':
      // Value is already formatted as "<ArrayBuffer X bytes>"
      return value;
    case 'unknown':
      return 'unknown';
    default:
      return String(value);
  }
}

/**
 * Check if a value type matches an expected type for validation.
 *
 * @param actualType - Detected type
 * @param expectedType - Expected type from configuration
 * @returns True if types match
 *
 * @example
 * ```typescript
 * isTypeMatch('string', 'string');  // true
 * isTypeMatch('number', 'string');  // false
 * ```
 */
export function isTypeMatch(actualType: MMKVValueType, expectedType: string): boolean {
  return actualType === expectedType;
}
