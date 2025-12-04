/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

"use strict";

/**
 * Debug Borders Manager
 *
 * Singleton manager for controlling debug borders state globally.
 * Supports three modes:
 * - "off" - No borders shown
 * - "borders" - Borders only (no labels)
 * - "labels" - Borders with component labels
 *
 * This allows imperative control from anywhere in the app.
 */

/**
 * Display mode for debug borders
 * @typedef {"off" | "borders" | "labels"} DisplayMode
 */

/** @type {DisplayMode} */
let globalMode = "off";

/** @type {Set<Function>} */
const listeners = new Set();

/**
 * Mode cycle order for toggle()
 * @type {DisplayMode[]}
 */
const MODE_CYCLE = ["off", "borders", "labels"];

/**
 * Registers a listener that will be called when the mode changes
 *
 * @param {Function} listener - Callback function (mode: DisplayMode) => void
 * @returns {Function} - Unsubscribe function
 */
function subscribe(listener) {
  listeners.add(listener);

  // Immediately call with current state
  listener(globalMode);

  return () => {
    listeners.delete(listener);
  };
}

/**
 * Notifies all listeners of state change
 */
function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener(globalMode);
    } catch (error) {
      console.error("[DebugBorders] Error in listener:", error);
    }
  });
}

/**
 * Sets the display mode
 *
 * @param {DisplayMode} mode - The mode to set
 */
function setMode(mode) {
  if (globalMode === mode) {
    return;
  }

  globalMode = mode;
  notifyListeners();
}

/**
 * Gets the current display mode
 *
 * @returns {DisplayMode}
 */
function getMode() {
  return globalMode;
}

/**
 * Cycles through display modes: off -> borders -> labels -> off
 */
function cycle() {
  const currentIndex = MODE_CYCLE.indexOf(globalMode);
  const nextIndex = (currentIndex + 1) % MODE_CYCLE.length;
  setMode(MODE_CYCLE[nextIndex]);
}

/**
 * Enables debug borders (borders mode)
 */
function enable() {
  setMode("borders");
}

/**
 * Disables debug borders (off mode)
 */
function disable() {
  setMode("off");
}

/**
 * Toggles between off and borders mode (legacy behavior)
 * For cycling through all modes, use cycle() instead
 */
function toggle() {
  cycle();
}

/**
 * Gets whether borders are currently enabled (any mode except "off")
 *
 * @returns {boolean}
 */
function isEnabled() {
  return globalMode !== "off";
}

/**
 * Gets whether labels should be shown
 *
 * @returns {boolean}
 */
function showLabels() {
  return globalMode === "labels";
}

/**
 * Sets the enabled state (legacy API)
 *
 * @param {boolean} enabled
 */
function setEnabled(enabled) {
  if (enabled) {
    enable();
  } else {
    disable();
  }
}

module.exports = {
  subscribe,
  enable,
  disable,
  toggle,
  cycle,
  isEnabled,
  showLabels,
  setEnabled,
  getMode,
  setMode,
  MODE_CYCLE,
};
