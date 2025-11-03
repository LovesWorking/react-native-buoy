/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

/**
 * Debug Borders Manager
 * 
 * Singleton manager for controlling debug borders state globally.
 * This allows imperative control (enable/disable/toggle) from anywhere in the app.
 */

let globalEnabled = false;
const listeners = new Set();

/**
 * Registers a listener that will be called when the enabled state changes
 * 
 * @param {Function} listener - Callback function (enabled: boolean) => void
 * @returns {Function} - Unsubscribe function
 */
function subscribe(listener) {
  listeners.add(listener);
  
  // Immediately call with current state
  listener(globalEnabled);
  
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Notifies all listeners of state change
 */
function notifyListeners() {
  listeners.forEach(listener => {
    try {
      listener(globalEnabled);
    } catch (error) {
      console.error('[DebugBorders] Error in listener:', error);
    }
  });
}

/**
 * Enables debug borders globally
 */
function enable() {
  if (globalEnabled) {
    console.log('[DebugBorders] Already enabled');
    return;
  }
  
  globalEnabled = true;
  console.log('[DebugBorders] Enabled');
  notifyListeners();
}

/**
 * Disables debug borders globally
 */
function disable() {
  if (!globalEnabled) {
    console.log('[DebugBorders] Already disabled');
    return;
  }
  
  globalEnabled = false;
  console.log('[DebugBorders] Disabled');
  notifyListeners();
}

/**
 * Toggles debug borders on/off
 */
function toggle() {
  if (globalEnabled) {
    disable();
  } else {
    enable();
  }
}

/**
 * Gets the current enabled state
 * 
 * @returns {boolean}
 */
function isEnabled() {
  return globalEnabled;
}

/**
 * Sets the enabled state
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
  isEnabled,
  setEnabled,
};

