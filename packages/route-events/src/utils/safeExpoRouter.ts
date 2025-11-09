/**
 * Safe wrapper for expo-router
 *
 * Provides optional imports for expo-router hooks and utilities.
 * Falls back to no-op implementations when expo-router is not installed.
 */

let expoRouter: any = null;
let isAvailable = false;
let checkedAvailability = false;

function checkExpoRouterAvailability(): boolean {
  if (checkedAvailability) return isAvailable;

  try {
    expoRouter = require("expo-router");
    isAvailable = expoRouter != null;
  } catch (error) {
    isAvailable = false;
    expoRouter = null;
  }

  checkedAvailability = true;
  return isAvailable;
}

// ============================================================================
// No-op implementations when expo-router is not available
// ============================================================================

function noOpUseRouter() {
  return {
    push: () => console.warn("[route-events] expo-router not installed: push() unavailable"),
    replace: () => console.warn("[route-events] expo-router not installed: replace() unavailable"),
    back: () => console.warn("[route-events] expo-router not installed: back() unavailable"),
    canGoBack: () => false,
    setParams: () => console.warn("[route-events] expo-router not installed: setParams() unavailable"),
    navigate: () => console.warn("[route-events] expo-router not installed: navigate() unavailable"),
  };
}

function noOpUsePathname(): string {
  return "/";
}

function noOpUseSegments(): string[] {
  return [];
}

function noOpUseGlobalSearchParams(): Record<string, string | string[]> {
  return {};
}

// ============================================================================
// Safe hook exports
// ============================================================================

export function useSafeRouter() {
  if (!checkExpoRouterAvailability()) {
    return noOpUseRouter();
  }

  try {
    return expoRouter.useRouter();
  } catch (error) {
    console.warn("[route-events] Failed to use expo-router.useRouter:", error);
    return noOpUseRouter();
  }
}

export function useSafePathname(): string {
  if (!checkExpoRouterAvailability()) {
    return noOpUsePathname();
  }

  try {
    return expoRouter.usePathname();
  } catch (error) {
    console.warn("[route-events] Failed to use expo-router.usePathname:", error);
    return noOpUsePathname();
  }
}

export function useSafeSegments(): string[] {
  if (!checkExpoRouterAvailability()) {
    return noOpUseSegments();
  }

  try {
    return expoRouter.useSegments();
  } catch (error) {
    console.warn("[route-events] Failed to use expo-router.useSegments:", error);
    return noOpUseSegments();
  }
}

export function useSafeGlobalSearchParams(): Record<string, string | string[]> {
  if (!checkExpoRouterAvailability()) {
    return noOpUseGlobalSearchParams();
  }

  try {
    return expoRouter.useGlobalSearchParams();
  } catch (error) {
    console.warn("[route-events] Failed to use expo-router.useGlobalSearchParams:", error);
    return noOpUseGlobalSearchParams();
  }
}

// ============================================================================
// Router instance getter (for imperative navigation)
// ============================================================================

export function getSafeRouter() {
  if (!checkExpoRouterAvailability()) {
    return null;
  }

  try {
    return expoRouter.router || null;
  } catch (error) {
    return null;
  }
}

// ============================================================================
// Availability check
// ============================================================================

export function isExpoRouterAvailable(): boolean {
  return checkExpoRouterAvailability();
}
