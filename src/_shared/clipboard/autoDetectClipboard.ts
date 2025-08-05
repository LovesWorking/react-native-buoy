// Define the clipboard function type locally
export type ClipboardFunction = (text: string) => Promise<boolean>;

let cachedClipboard: ClipboardFunction | null = null;
let hasWarned = false;

/**
 * Attempts to auto-detect and use the appropriate clipboard implementation
 * Tries Expo Clipboard first, then React Native CLI Clipboard
 */
export function createAutoDetectedClipboard(): ClipboardFunction | null {
  // Return cached clipboard if already detected
  if (cachedClipboard) {
    return cachedClipboard;
  }

  // Try Expo Clipboard first
  try {
    // Use require to avoid build-time errors if the package doesn't exist
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ExpoClipboard = require("expo-clipboard");
    if (ExpoClipboard && ExpoClipboard.setStringAsync) {
      cachedClipboard = async (text: string) => {
        try {
          await ExpoClipboard.setStringAsync(text);
          return true;
        } catch (error) {
          console.error("[RnBetterDevTools] Expo clipboard copy failed:", error);
          return false;
        }
      };
      console.log("[RnBetterDevTools] Auto-detected Expo Clipboard");
      return cachedClipboard;
    }
  } catch {
    // Expo clipboard not available, continue to try RN CLI
  }

  // Try React Native CLI Clipboard
  try {
    // Use require to avoid build-time errors if the package doesn't exist
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RNClipboard = require("@react-native-clipboard/clipboard");
    if (RNClipboard && (RNClipboard.default || RNClipboard).setString) {
      const Clipboard = RNClipboard.default || RNClipboard;
      cachedClipboard = async (text: string) => {
        try {
          await Clipboard.setString(text);
          return true;
        } catch (error) {
          console.error("[RnBetterDevTools] RN CLI clipboard copy failed:", error);
          return false;
        }
      };
      console.log("[RnBetterDevTools] Auto-detected React Native CLI Clipboard");
      return cachedClipboard;
    }
  } catch {
    // RN CLI clipboard not available
  }

  // Neither clipboard library was found
  if (!hasWarned) {
    hasWarned = true;
    console.warn(
      "[RnBetterDevTools] No clipboard library detected. Copy functionality will be disabled.\n" +
      "To enable copy functionality, install one of the following:\n" +
      "- For Expo: expo install expo-clipboard\n" +
      "- For React Native CLI: npm install @react-native-clipboard/clipboard\n" +
      "Or provide a custom onCopy function to RnBetterDevToolsBubble"
    );
  }

  return null;
}

/**
 * Gets the auto-detected clipboard function with proper error handling
 */
export function getAutoDetectedClipboard(): ClipboardFunction {
  const clipboard = createAutoDetectedClipboard();
  
  if (!clipboard) {
    // Return a function that always fails with a helpful error message
    return async (text: string) => {
      console.error(
        "[RnBetterDevTools] Copy failed: No clipboard library found.\n" +
        `Attempted to copy: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\n` +
        "Install expo-clipboard or @react-native-clipboard/clipboard, or provide a custom onCopy function."
      );
      return false;
    };
  }

  return clipboard;
}