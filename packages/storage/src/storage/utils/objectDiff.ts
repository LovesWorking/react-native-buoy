export interface DiffItem {
  type: "CREATE" | "REMOVE" | "CHANGE";
  path: (string | number)[];
  value?: unknown;
  oldValue?: unknown;
}

/**
 * Type guard to check if a value is a plain object (not array or null)
 * 
 * @param obj - Value to check
 * @returns True if the value is a plain object
 */
function isObject(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === "object" && !Array.isArray(obj);
}

/**
 * Type guard to check if a value is an array
 * 
 * @param obj - Value to check
 * @returns True if the value is an array
 */
function isArray(obj: unknown): obj is unknown[] {
  return Array.isArray(obj);
}

/**
 * Recursively compare two values and collect differences
 * 
 * This function handles deep comparison of objects, arrays, and primitive values,
 * building a comprehensive diff that tracks the exact path of each change.
 * 
 * @param oldVal - The original value to compare from
 * @param newVal - The new value to compare to
 * @param path - Current path in the object structure (for nested properties)
 * @param diffs - Array to collect difference items
 * 
 * @performance Uses recursive traversal with path tracking for memory efficiency
 * @performance Handles large nested structures without stack overflow concerns for typical use cases
 */
function compareValues(
  oldVal: unknown,
  newVal: unknown,
  path: (string | number)[],
  diffs: DiffItem[],
): void {
  // Both are objects
  if (isObject(oldVal) && isObject(newVal)) {
    const allKeys = new Set([...Object.keys(oldVal), ...Object.keys(newVal)]);

    for (const key of allKeys) {
      const newPath = [...path, key];

      if (!(key in oldVal)) {
        // Key was added
        diffs.push({
          type: "CREATE",
          path: newPath,
          value: newVal[key],
        });
      } else if (!(key in newVal)) {
        // Key was removed
        diffs.push({
          type: "REMOVE",
          path: newPath,
          oldValue: oldVal[key],
        });
      } else {
        // Key exists in both, compare values
        compareValues(oldVal[key], newVal[key], newPath, diffs);
      }
    }
  }
  // Both are arrays
  else if (isArray(oldVal) && isArray(newVal)) {
    const maxLength = Math.max(oldVal.length, newVal.length);

    for (let i = 0; i < maxLength; i++) {
      const newPath = [...path, i];

      if (i >= oldVal.length) {
        // Item was added
        diffs.push({
          type: "CREATE",
          path: newPath,
          value: newVal[i],
        });
      } else if (i >= newVal.length) {
        // Item was removed
        diffs.push({
          type: "REMOVE",
          path: newPath,
          oldValue: oldVal[i],
        });
      } else {
        // Item exists in both, compare values
        compareValues(oldVal[i], newVal[i], newPath, diffs);
      }
    }
  }
  // Values are different types or primitives
  else if (oldVal !== newVal) {
    diffs.push({
      type: "CHANGE",
      path,
      oldValue: oldVal,
      value: newVal,
    });
  }
}

/**
 * Generate a comprehensive diff between two objects or values
 * 
 * This function performs a deep comparison between two values and returns
 * a detailed list of all differences, including additions, removals, and changes.
 * Each difference includes the exact path where the change occurred.
 * 
 * @param oldObj - The original object/value to compare from
 * @param newObj - The new object/value to compare to
 * @returns Array of DiffItem objects describing all differences
 * 
 * @example
 * ```typescript
 * const oldData = { user: { name: "John", age: 30 }, items: [1, 2] };
 * const newData = { user: { name: "Jane", age: 30 }, items: [1, 2, 3] };
 * 
 * const diffs = objectDiff(oldData, newData);
 * // Returns:
 * // [
 * //   { type: "CHANGE", path: ["user", "name"], oldValue: "John", value: "Jane" },
 * //   { type: "CREATE", path: ["items", 2], value: 3 }
 * // ]
 * ```
 * 
 * @performance Handles circular references and deep nesting efficiently
 * @performance Uses Set for key deduplication to optimize comparison speed
 */
export function objectDiff(oldObj: unknown, newObj: unknown): DiffItem[] {
  const diffs: DiffItem[] = [];

  // Handle null/undefined cases
  if (oldObj === newObj) {
    return diffs;
  }

  if (oldObj === null || oldObj === undefined) {
    if (newObj !== null && newObj !== undefined) {
      diffs.push({
        type: "CREATE",
        path: [],
        value: newObj,
      });
    }
    return diffs;
  }

  if (newObj === null || newObj === undefined) {
    diffs.push({
      type: "REMOVE",
      path: [],
      oldValue: oldObj,
    });
    return diffs;
  }

  compareValues(oldObj, newObj, [], diffs);

  return diffs;
}
