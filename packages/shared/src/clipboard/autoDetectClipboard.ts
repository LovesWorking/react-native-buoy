// Define the clipboard function type locally
export type ClipboardFunction = (text: string) => Promise<boolean>;

const log = (...args: unknown[]) => {
  if (typeof __DEV__ !== "undefined" && __DEV__) {
    console.log("[RnBetterDevTools][clipboard]", ...args);
  }
};

let cachedClipboard: ClipboardFunction | null = null;
let loadPromise: Promise<ClipboardFunction | null> | null = null;
let warnedMissing = false;

async function loadClipboard(): Promise<ClipboardFunction | null> {
  if (cachedClipboard) {
    return cachedClipboard;
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      // Try Expo clipboard first
      try {
        const expoClipboardModule = await import("expo-clipboard");
        const expoClipboard =
          (expoClipboardModule as any)?.default || expoClipboardModule;
        if (expoClipboard?.setStringAsync) {
          log("Detected expo-clipboard module");
          return async (text: string) => {
            try {
              await expoClipboard.setStringAsync(text);
              return true;
            } catch (error) {
              console.error(
                "[RnBetterDevTools] Expo clipboard copy failed:",
                error,
              );
              return false;
            }
          };
        }
      } catch (error) {
        log("expo-clipboard import failed", error);
      }

      // Fallback to React Native CLI clipboard
      try {
        const rnClipboardModule = await import(
          "@react-native-clipboard/clipboard"
        );
        const rnClipboard =
          (rnClipboardModule as any)?.default || rnClipboardModule;
        if (rnClipboard?.setString) {
          log("Detected @react-native-clipboard/clipboard module");
          return async (text: string) => {
            try {
              await rnClipboard.setString(text);
              return true;
            } catch (error) {
              console.error(
                "[RnBetterDevTools] RN CLI clipboard copy failed:",
                error,
              );
              return false;
            }
          };
        }
      } catch (error) {
        log("@react-native-clipboard/clipboard import failed", error);
      }

      return null;
    })();
  }

  const clipboard = await loadPromise;
  loadPromise = null;

  if (clipboard) {
    cachedClipboard = clipboard;
    return cachedClipboard;
  }

  if (!warnedMissing) {
    warnedMissing = true;
    console.warn(
      "[RnBetterDevTools] No clipboard library detected. Copy functionality will be disabled.\n" +
        "To enable copy functionality, install one of the following:\n" +
        "- For Expo: expo install expo-clipboard\n" +
        "- For React Native CLI: npm install @react-native-clipboard/clipboard\n" +
        "Or provide a custom onCopy function to RnBetterDevToolsBubble",
    );
  }

  return null;
}

/**
 * Attempts to auto-detect and cache a clipboard implementation. Returns the cached implementation
 * if one has already been detected synchronously; otherwise returns null and triggers async loading.
 */
export function createAutoDetectedClipboard(): ClipboardFunction | null {
  if (cachedClipboard) {
    return cachedClipboard;
  }

  // Kick off the async load; ignore errors here.
  void loadClipboard();
  return null;
}

/**
 * Gets the auto-detected clipboard function with proper error handling.
 * The returned function will lazily import the clipboard implementation the first time it runs.
 */
export function getAutoDetectedClipboard(): ClipboardFunction {
  return async (text: string) => {
    const clipboard = await loadClipboard();
    if (clipboard) {
      return clipboard(text);
    }

    console.error(
      "[RnBetterDevTools] Copy failed: No clipboard library found.\n" +
        `Attempted to copy: ${text.substring(0, 50)}${
          text.length > 50 ? "..." : ""
        }\n` +
        "Install expo-clipboard or @react-native-clipboard/clipboard, or provide a custom onCopy function.",
    );
    return false;
  };
}
