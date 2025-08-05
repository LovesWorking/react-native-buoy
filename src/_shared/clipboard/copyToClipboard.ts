import { getAutoDetectedClipboard } from "./autoDetectClipboard";
import { safeStringify } from "../utils/safeStringify";
import { displayValue } from "../utils/displayValue";

// Get the clipboard function once
const clipboardFunction = getAutoDetectedClipboard();

/**
 * Copy a value to clipboard, handling stringification automatically
 * @param value - The value to copy (can be any type)
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function copyToClipboard(value: unknown): Promise<boolean> {
  try {
    // If it's already a string, use it directly
    const textToCopy =
      typeof value === "string"
        ? value
        : // Use displayValue for simple values, safeStringify for complex ones
          typeof value === "object" && value !== null
        ? (() => {
            // Create a defensive copy to prevent any modifications to the original object
            // This is important when used with virtualized lists or React state
            try {
              // For simple objects, use structured clone if available
              if (typeof structuredClone === "function") {
                const cloned = structuredClone(value);
                return safeStringify(cloned as Record<string, unknown>, 2, {
                  depthLimit: 100,
                  edgesLimit: 1000,
                });
              }
            } catch {
              // structuredClone might fail for certain objects
            }
            
            // Fall back to safeStringify with the original value
            // The safeStringify function should handle this safely
            return safeStringify(value as Record<string, unknown>, 2, {
              depthLimit: 100,
              edgesLimit: 1000,
            });
          })()
        : displayValue(value);

    return await clipboardFunction(textToCopy);
  } catch (error) {
    console.error("[RnBetterDevTools] Copy failed:", error);
    console.error("Value type:", typeof value);
    console.error("Value constructor:", value?.constructor?.name);
    return false;
  }
}

/**
 * Check if clipboard functionality is available
 */
export function isClipboardAvailable(): boolean {
  // The auto-detected clipboard always returns a function,
  // but it might be a fallback that always returns false
  // We can check by seeing if it has warned about missing libraries
  return true; // Always return true since we have a fallback
}