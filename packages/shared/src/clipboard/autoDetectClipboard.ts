import { loadOptionalModule } from "../utils/loadOptionalModule";

// Define the clipboard function type locally
export type ClipboardFunction = (text: string) => Promise<boolean>;

// Debug logging removed for production

let cachedClipboard: ClipboardFunction | null = null;
let loadPromise: Promise<ClipboardFunction | null> | null = null;
let warnedMissing = false;

async function loadClipboard(): Promise<ClipboardFunction | null> {
  if (cachedClipboard) {
    return cachedClipboard;
  }

  if (!loadPromise) {
    loadPromise = (async () => {
      // Try expo-clipboard first (common in Expo projects)
      // Note: We intentionally do NOT provide a custom loader here.
      // The loadOptionalModule utility uses dynamic require/import via
      // Function constructor which Metro cannot statically analyze.
      // This allows the module to be truly optional at build time.
      const expoClipboard = await loadOptionalModule<any>("expo-clipboard", {
        logger: {
          log: () => {},
          warn: () => {},
          error: (...args: unknown[]) =>
            console.error("[RnBetterDevTools]", ...args),
        },
      });

      if (expoClipboard?.setStringAsync) {
        return async (text: string) => {
          try {
            await expoClipboard.setStringAsync(text);
            return true;
          } catch (error) {
            console.error(
              "[RnBetterDevTools] Expo clipboard copy failed:",
              error
            );
            return false;
          }
        };
      }

      // Try @react-native-clipboard/clipboard (common in RN CLI projects)
      const rnClipboard = await loadOptionalModule<any>(
        "@react-native-clipboard/clipboard",
        {
          logger: {
            log: () => {},
            warn: () => {},
            error: (...args: unknown[]) =>
              console.error("[RnBetterDevTools]", ...args),
          },
        }
      );

      if (rnClipboard?.setString) {
        return async (text: string) => {
          try {
            await rnClipboard.setString(text);
            return true;
          } catch (error) {
            console.error(
              "[RnBetterDevTools] RN CLI clipboard copy failed:",
              error
            );
            return false;
          }
        };
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
    // Clipboard library not found - copy functionality disabled
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
