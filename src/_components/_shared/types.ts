// Shared type definitions for the dev tools

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | { [key: string]: JsonValue }
  | Date
  | Error
  | Map<unknown, unknown>
  | Set<unknown>
  | RegExp
  | ((...args: unknown[]) => unknown)
  | symbol
  | bigint
  | unknown;

// Type guard to check if a value is a plain object (not Date, Array, etc.)
export function isPlainObject(
  value: unknown
): value is { [key: string]: JsonValue } {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof Error) &&
    !(value instanceof Map) &&
    !(value instanceof Set) &&
    !(value instanceof RegExp) &&
    typeof value !== "function"
  );
}
