/**
 * Safely stringifies objects with circular references by:
 * 1. Pre-processing to detect and temporarily replace circular references
 * 2. Handling special JS types that JSON.stringify can't serialize
 * 3. Restoring original object structure after stringification
 * 4. Inspired by fast-safe-stringify with additional type handling
 */

interface SafeStringifyOptions {
  depthLimit?: number;
  edgesLimit?: number;
}

const CIRCULAR_REPLACE_NODE = "[Circular]";
const LIMIT_REPLACE_NODE = "[...]";

export function safeStringify(
  obj: any,
  space?: number,
  options: SafeStringifyOptions = {}
): string {
  const {
    depthLimit = Number.MAX_SAFE_INTEGER,
    edgesLimit = Number.MAX_SAFE_INTEGER,
  } = options;
  const arr: any[] = []; // Store original values to restore after stringification

  // Pre-process the object to handle circular references and depth limits
  function decirc(
    val: any,
    k: string | number,
    edgeIndex: number,
    stack: any[],
    parent: any,
    depth: number
  ): void {
    depth += 1;

    if (typeof val === "object" && val !== null) {
      // Check for circular references
      for (let i = 0; i < stack.length; i++) {
        if (stack[i] === val) {
          setReplace(CIRCULAR_REPLACE_NODE, val, k, parent);
          return;
        }
      }

      // Check depth limit
      if (depth > depthLimit) {
        setReplace(LIMIT_REPLACE_NODE, val, k, parent);
        return;
      }

      // Check edges limit
      if (edgeIndex + 1 > edgesLimit) {
        setReplace(LIMIT_REPLACE_NODE, val, k, parent);
        return;
      }

      stack.push(val);

      // Optimize for Arrays
      if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          decirc(val[i], i, i, stack, val, depth);
        }
      } else {
        const keys = Object.keys(val);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          decirc(val[key], key, i, stack, val, depth);
        }
      }

      stack.pop();
    }
  }

  function setReplace(
    replace: any,
    val: any,
    k: string | number,
    parent: any
  ): void {
    const propertyDescriptor = Object.getOwnPropertyDescriptor(parent, k);
    if (propertyDescriptor?.get !== undefined) {
      if (propertyDescriptor.configurable) {
        Object.defineProperty(parent, k, { value: replace });
        arr.push([parent, k, val, propertyDescriptor]);
      } else {
        // Handle non-configurable getters - skip for now
        return;
      }
    } else {
      (parent as any)[k] = replace;
      arr.push([parent, k, val]);
    }
  }

  // Custom replacer for special types
  const replacer = (key: string, value: any): any => {
    // Handle primitives that JSON.stringify can't handle
    if (typeof value === "bigint") return `${value.toString()}n`;
    if (typeof value === "symbol") return value.toString();
    if (typeof value === "undefined") return "undefined";
    if (typeof value === "function") {
      return `[Function: ${value.name || "anonymous"}]`;
    }

    // Handle special number values
    if (typeof value === "number") {
      if (value === Infinity) return "Infinity";
      if (value === -Infinity) return "-Infinity";
      if (Number.isNaN(value)) return "NaN";
    }

    // Handle special objects
    if (value instanceof Error) {
      const errorObj: any = {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
      // Include custom properties
      Object.getOwnPropertyNames(value).forEach((prop) => {
        if (!["name", "message", "stack"].includes(prop)) {
          try {
            errorObj[prop] = (value as any)[prop];
          } catch {
            // Skip properties that can't be accessed
          }
        }
      });
      return errorObj;
    }

    if (value instanceof Date) return value.toISOString();
    if (value instanceof RegExp) return value.toString();

    // Handle Map objects
    if (value instanceof Map) {
      const mapObj: any = { __type: "Map", entries: [] };
      try {
        value.forEach((val, mapKey) => {
          mapObj.entries.push([mapKey, val]);
        });
      } catch {
        // Handle cases where Map iteration fails
        mapObj.entries = "[Map iteration failed]";
      }
      return mapObj;
    }

    // Handle Set objects
    if (value instanceof Set) {
      try {
        return {
          __type: "Set",
          values: Array.from(value),
        };
      } catch {
        return {
          __type: "Set",
          values: "[Set iteration failed]",
        };
      }
    }

    return value;
  };

  // Pre-process to handle circular references
  try {
    decirc(obj, "", 0, [], undefined, 0);

    // Stringify with custom replacer
    const result = JSON.stringify(obj, replacer, space);

    return result;
  } catch {
    // Fallback for complex circular references
    return JSON.stringify(
      "[unable to serialize, circular reference is too complex to analyze]"
    );
  } finally {
    // Restore original object structure
    while (arr.length !== 0) {
      const part = arr.pop();
      if (part.length === 4) {
        // Restore property descriptor
        Object.defineProperty(part[0], part[1], part[3]);
      } else {
        // Restore simple property
        part[0][part[1]] = part[2];
      }
    }
  }
}
