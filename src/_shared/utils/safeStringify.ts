import { JsonValue } from "../types/types";

type SerializedError = {
  name: string;
  message: string;
  stack?: string;
  [key: string]: JsonValue | undefined;
};

type JsonObject = { [key: string | number]: JsonValue };

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
  obj: JsonValue,
  space?: number,
  options: SafeStringifyOptions = {}
): string {
  const {
    depthLimit = Number.MAX_SAFE_INTEGER,
    edgesLimit = Number.MAX_SAFE_INTEGER,
  } = options;
  type RestoreEntry =
    | [JsonObject, string | number, JsonValue]
    | [JsonObject, string | number, JsonValue, PropertyDescriptor];
  const arr: RestoreEntry[] = []; // Store original values to restore after stringification

  // Pre-process the object to handle circular references and depth limits
  function decirc(
    val: JsonValue,
    k: string | number,
    edgeIndex: number,
    stack: JsonValue[],
    parent: JsonObject | null,
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
        const arrayParent = val as unknown as JsonObject;
        for (let i = 0; i < val.length; i++) {
          decirc(val[i], i, i, stack, arrayParent, depth);
        }
      } else if (
        val instanceof Map ||
        val instanceof Set ||
        val instanceof RegExp ||
        val instanceof Date ||
        val instanceof Error
      ) {
        // Skip special objects
        stack.pop();
        return;
      } else {
        const objParent = val as JsonObject;
        const keys = Object.keys(objParent);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          decirc(objParent[key], key, i, stack, objParent, depth);
        }
      }

      stack.pop();
    }
  }

  function setReplace(
    replace: JsonValue,
    val: JsonValue,
    k: string | number,
    parent: JsonObject | null
  ): void {
    if (!parent) return;

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
      parent[k] = replace;
      arr.push([parent, k, val]);
    }
  }

  // Custom replacer for special types
  const replacer = (key: string, value: JsonValue): JsonValue => {
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
      const errorObj: SerializedError = {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
      // Include custom properties
      Object.getOwnPropertyNames(value).forEach((prop) => {
        if (!["name", "message", "stack"].includes(prop)) {
          try {
            const propValue = (value as unknown as Record<string, unknown>)[
              prop
            ];
            if (propValue !== undefined) {
              errorObj[prop] = propValue as JsonValue;
            }
          } catch {
            // Skip properties that can't be accessed
          }
        }
      });
      return errorObj as JsonValue;
    }

    if (value instanceof Date) return value.toISOString();
    if (value instanceof RegExp) return value.toString();

    // Handle Map objects
    if (value instanceof Map) {
      try {
        const entries = Array.from(value.entries()).map(([mapKey, val]) => [
          String(mapKey),
          val,
        ]);
        return {
          __type: "Map",
          entries: entries as JsonValue[],
        };
      } catch {
        // Handle cases where Map iteration fails
        return {
          __type: "Map",
          entries: "[Map iteration failed]" as string,
        };
      }
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
    decirc(obj, "", 0, [], null, 0);

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
      if (part && part.length === 4) {
        // Restore property descriptor
        const [targetObj, key, , descriptor] = part;
        if (targetObj && typeof targetObj === "object" && descriptor) {
          Object.defineProperty(targetObj, key, descriptor);
        }
      } else if (part) {
        // Restore simple property
        const [targetObj, key, value] = part;
        if (
          targetObj &&
          typeof targetObj === "object" &&
          (typeof key === "string" || typeof key === "number")
        ) {
          (targetObj as JsonObject)[key] = value;
        }
      }
    }
  }
}
