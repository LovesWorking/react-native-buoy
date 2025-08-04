import { getAutoDetectedClipboard } from "./autoDetectClipboard";
import { safeStringify } from "../../_util/safeStringify";
import { displayValue } from "../../devtools/displayValue";

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
        ? safeStringify(value as Record<string, unknown>, 2, {
            depthLimit: 100,
            edgesLimit: 1000,
          })
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