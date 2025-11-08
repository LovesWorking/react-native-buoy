/**
 * Safe wrapper for @react-navigation/native
 *
 * Provides optional imports for React Navigation hooks.
 * Falls back to no-op implementations when @react-navigation/native is not installed.
 */

import { useMemo } from "react";

let reactNavigation: any = null;
let isAvailable = false;
let checkedAvailability = false;

function checkReactNavigationAvailability(): boolean {
  if (checkedAvailability) return isAvailable;

  try {
    reactNavigation = require("@react-navigation/native");
    isAvailable = reactNavigation != null;
  } catch (error) {
    isAvailable = false;
    reactNavigation = null;
  }

  checkedAvailability = true;
  return isAvailable;
}

// ============================================================================
// No-op implementations when @react-navigation/native is not available
// ============================================================================

function noOpUseNavigation() {
  return useMemo(
    () => ({
      navigate: () =>
        console.warn("[route-events] @react-navigation/native not installed: navigate() unavailable"),
      goBack: () =>
        console.warn("[route-events] @react-navigation/native not installed: goBack() unavailable"),
      canGoBack: () => false,
      reset: () =>
        console.warn("[route-events] @react-navigation/native not installed: reset() unavailable"),
      setParams: () =>
        console.warn("[route-events] @react-navigation/native not installed: setParams() unavailable"),
      dispatch: () =>
        console.warn("[route-events] @react-navigation/native not installed: dispatch() unavailable"),
      isFocused: () => true,
      addListener: () => () => {},
      removeListener: () => {},
      getParent: () => undefined,
      getState: () => undefined,
      getId: () => undefined,
    }),
    []
  );
}

function noOpUseNavigationState(selector: (state: any) => any) {
  return useMemo(() => {
    // Return a minimal state structure
    const emptyState = {
      key: "default",
      index: 0,
      routeNames: [],
      routes: [],
      type: "stack",
    };

    try {
      return selector ? selector(emptyState) : emptyState;
    } catch {
      return emptyState;
    }
  }, [selector]);
}

// ============================================================================
// Safe hook exports
// ============================================================================

export function useSafeNavigation() {
  if (!checkReactNavigationAvailability()) {
    return noOpUseNavigation();
  }

  try {
    return reactNavigation.useNavigation();
  } catch (error) {
    console.warn("[route-events] Failed to use @react-navigation/native.useNavigation:", error);
    return noOpUseNavigation();
  }
}

export function useSafeNavigationState(selector: (state: any) => any) {
  if (!checkReactNavigationAvailability()) {
    return noOpUseNavigationState(selector);
  }

  try {
    return reactNavigation.useNavigationState(selector);
  } catch (error) {
    console.warn("[route-events] Failed to use @react-navigation/native.useNavigationState:", error);
    return noOpUseNavigationState(selector);
  }
}

// ============================================================================
// Availability check
// ============================================================================

export function isReactNavigationAvailable(): boolean {
  return checkReactNavigationAvailability();
}
