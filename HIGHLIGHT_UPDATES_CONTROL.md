# Controlling "Highlight Updates When Components Render" Feature

## Overview

This document provides a comprehensive guide to programmatically controlling React Native DevTools' "Highlight updates when components render" feature. This feature highlights components on screen when they re-render, helping developers identify performance issues.

---

## Architecture Overview

### System Flow

```
React DevTools Frontend (Chrome/Flipper)
    ↓ (sends drawTraceUpdates event)
React DevTools Agent (__REACT_DEVTOOLS_GLOBAL_HOOK__.reactDevtoolsAgent)
    ↓ (emits event to listeners)
DebuggingOverlayRegistry (singleton listener)
    ↓ (processes component bounds)
DebuggingOverlay (native component)
    ↓ (renders highlights on screen)
```

---

## Key Files & Locations

### Core Type Definitions

**File:** `packages/react-native/Libraries/Types/ReactDevToolsTypes.js`

```javascript
export type ReactDevToolsAgentEvents = {
  drawTraceUpdates: [Array<{node: InstanceFromReactDevTools, color: string}>],
  disableTraceUpdates: [],
  showNativeHighlight: [nodes: Array<InstanceFromReactDevTools>],
  hideNativeHighlight: [],
  shutdown: [],
  startInspectingNative: [],
  stopInspectingNative: [],
};

export type ReactDevToolsAgent = {
  selectNode(node: mixed): void,
  stopInspectingNative(value: boolean): void,
  addListener<Event: $Keys<ReactDevToolsAgentEvents>>(
    event: Event,
    listener: (...ReactDevToolsAgentEvents[Event]) => void,
  ): void,
  removeListener(
    event: $Keys<ReactDevToolsAgentEvents>,
    listener: () => void,
  ): void,
};

export type ReactDevToolsGlobalHook = {
  on: (eventName: string, (agent: ReactDevToolsAgent) => void) => void,
  off: (eventName: string, (agent: ReactDevToolsAgent) => void) => void,
  reactDevtoolsAgent?: ReactDevToolsAgent,
  resolveRNStyle?: mixed,
  nativeStyleEditorValidAttributes?: Array<string>,
};
```

### Native Component Types

**File:** `packages/react-native/src/private/specs_DEPRECATED/components/DebuggingOverlayNativeComponent.js`

```javascript
export type TraceUpdate = {
  id: number,
  rectangle: ElementRectangle,
  color: ?ProcessedColorValue,
};

export type ElementRectangle = {
  x: number,
  y: number,
  width: number,
  height: number,
};

interface NativeCommands {
  +highlightTraceUpdates: (
    viewRef: React.ElementRef<DebuggingOverlayNativeComponentType>,
    updates: $ReadOnlyArray<TraceUpdate>,
  ) => void;
  +highlightElements: (
    viewRef: React.ElementRef<DebuggingOverlayNativeComponentType>,
    elements: $ReadOnlyArray<ElementRectangle>,
  ) => void;
  +clearElementsHighlights: (
    viewRef: React.ElementRef<DebuggingOverlayNativeComponentType>,
  ) => void;
}
```

### Registry Types

**File:** `packages/react-native/Libraries/Debugging/DebuggingOverlayRegistry.js`

```javascript
export type DebuggingOverlayRegistrySubscriberProtocol = {
  rootViewRef: AppContainerRootViewRef,
  debuggingOverlayRef: DebuggingOverlayRef,
};

type ModernNodeUpdate = {
  id: number,
  instance: ReactNativeElement,
  color: string,
};

type LegacyNodeUpdate = {
  id: number,
  instance: HostInstance,
  color: string,
};
```

**Ref Types (from AppContainer-dev.js:200-208):**
```javascript
export type AppContainerRootViewRef = React.RefObject<React.ElementRef<typeof View> | null>;
export type InspectedViewRef = React.RefObject<React.ElementRef<typeof View> | null>;
export type DebuggingOverlayRef = React.RefObject<React.ElementRef<typeof DebuggingOverlay> | null>;
```

---

## Registry API

**File:** `packages/react-native/Libraries/Debugging/DebuggingOverlayRegistry.js`

### DebuggingOverlayRegistry Class

```javascript
class DebuggingOverlayRegistry {
  // Private fields
  #registry: Set<DebuggingOverlayRegistrySubscriberProtocol>
  #reactDevToolsAgent: ReactDevToolsAgent | null

  // Public methods
  subscribe(subscriber: DebuggingOverlayRegistrySubscriberProtocol): void
  unsubscribe(subscriber: DebuggingOverlayRegistrySubscriberProtocol): void

  // Private event handlers (called by DevTools agent)
  #onDrawTraceUpdates: (...ReactDevToolsAgentEvents['drawTraceUpdates']) => void
  #onHighlightElements: (...ReactDevToolsAgentEvents['showNativeHighlight']) => void
  #onClearElementsHighlights: (...ReactDevToolsAgentEvents['hideNativeHighlight']) => void

  // Private helper methods
  #onReactDevToolsAgentAttached(agent: ReactDevToolsAgent): void
  #drawTraceUpdatesModern(updates: Array<ModernNodeUpdate>): void
  #drawTraceUpdatesLegacy(updates: Array<LegacyNodeUpdate>): void
}

// Singleton instance
const debuggingOverlayRegistryInstance: DebuggingOverlayRegistry = new DebuggingOverlayRegistry();
export default debuggingOverlayRegistryInstance;
```

**Key Logic (Line 87-93):**
```javascript
#onReactDevToolsAgentAttached = (agent: ReactDevToolsAgent): void => {
  this.#reactDevToolsAgent = agent;

  agent.addListener('drawTraceUpdates', this.#onDrawTraceUpdates);
  agent.addListener('showNativeHighlight', this.#onHighlightElements);
  agent.addListener('hideNativeHighlight', this.#onClearElementsHighlights);
};
```

---

## Global Hook Access

**File:** `packages/react-native/Libraries/Core/setUpReactDevTools.js`

The React DevTools hook is initialized at app startup and available globally:

```javascript
const reactDevToolsHook: ?ReactDevToolsGlobalHook = (window: $FlowFixMe)
  .__REACT_DEVTOOLS_GLOBAL_HOOK__;
```

**Initialization (Line 64-65):**
```javascript
const { initialize, connectToDevTools, connectWithCustomMessagingProtocol } =
  require('react-devtools-core');
initialize(hookSettings, shouldStartProfilingNow, initialProfilingSettings);
```

---

## Integration Points

### AppContainer Integration

**File:** `packages/react-native/Libraries/ReactNative/AppContainer-dev.js`

**Refs Setup (Line 98-100):**
```javascript
const appContainerRootViewRef: AppContainerRootViewRef = useRef(null);
const innerViewRef: InspectedViewRef = useRef(null);
const debuggingOverlayRef: DebuggingOverlayRef = useRef(null);
```

**Registry Subscription (Line 102-105):**
```javascript
useSubscribeToDebuggingOverlayRegistry(
  appContainerRootViewRef,
  debuggingOverlayRef,
);
```

**Overlay Rendering (Line 173):**
```javascript
<DebuggingOverlay ref={debuggingOverlayRef} />
```

### Subscription Hook

**File:** `packages/react-native/Libraries/Debugging/useSubscribeToDebuggingOverlayRegistry.js`

```javascript
const useSubscribeToDebuggingOverlayRegistry = (
  rootViewRef: AppContainerRootViewRef,
  debuggingOverlayRef: DebuggingOverlayRef,
) => {
  useEffect(() => {
    const subscriber = {rootViewRef, debuggingOverlayRef};

    DebuggingOverlayRegistry.subscribe(subscriber);
    return () => DebuggingOverlayRegistry.unsubscribe(subscriber);
  }, [rootViewRef, debuggingOverlayRef]);
};
```

---

## Implementation Plan: Option 1 - Agent Listener Interception

### Strategy

Intercept the `drawTraceUpdates` event listener on the React DevTools agent to conditionally allow/block highlight rendering without modifying React Native internals.

### Pros
- ✅ No modification to React Native source code
- ✅ Works with existing DevTools infrastructure
- ✅ Can be toggled at runtime
- ✅ Preserves all other DevTools functionality
- ✅ Clean enable/disable API

### Cons
- ⚠️ Relies on internal event system structure
- ⚠️ May need adjustment if DevTools agent implementation changes
- ⚠️ Requires accessing private listener list

---

## Implementation Code

### Step 1: Create Control Module

**Create file:** `HighlightUpdatesController.js`

```javascript
/**
 * Controller for React Native DevTools "Highlight Updates" feature
 * Allows programmatic control over component render highlighting
 */

class HighlightUpdatesController {
  constructor() {
    this.enabled = true;
    this.originalListener = null;
    this.controlledListener = null;
    this.agent = null;
    this.initialized = false;
  }

  /**
   * Initialize the controller by intercepting DevTools agent
   * Call this after React DevTools has connected
   * @returns {boolean} True if successfully initialized
   */
  initialize() {
    if (this.initialized) {
      console.warn('[HighlightUpdatesController] Already initialized');
      return true;
    }

    // Access the global React DevTools hook
    const hook = window?.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    if (!hook) {
      console.error('[HighlightUpdatesController] React DevTools hook not found');
      return false;
    }

    this.agent = hook.reactDevtoolsAgent;
    if (!this.agent) {
      console.error('[HighlightUpdatesController] React DevTools agent not connected');
      return false;
    }

    // Access internal listener storage
    // react-devtools-core uses EventEmitter pattern with _listeners map
    const listeners = this._getListeners('drawTraceUpdates');

    if (!listeners || listeners.length === 0) {
      console.warn('[HighlightUpdatesController] No drawTraceUpdates listeners found');
      // Still initialize - listener might be added later
    } else {
      // Store the original listener (DebuggingOverlayRegistry's handler)
      this.originalListener = listeners[0];

      // Remove original listener
      this.agent.removeListener('drawTraceUpdates', this.originalListener);
    }

    // Create controlled wrapper
    this.controlledListener = (traceUpdates) => {
      if (this.enabled && this.originalListener) {
        this.originalListener(traceUpdates);
      }
      // If disabled, simply don't call the original listener
    };

    // Add controlled listener
    this.agent.addListener('drawTraceUpdates', this.controlledListener);

    this.initialized = true;
    console.log('[HighlightUpdatesController] Successfully initialized');
    return true;
  }

  /**
   * Helper to get listeners for an event
   * Handles different EventEmitter implementations
   * @private
   */
  _getListeners(eventName) {
    if (!this.agent) return [];

    // Try different EventEmitter patterns
    if (this.agent._listeners) {
      // Map-based implementation
      return this.agent._listeners.get?.(eventName) || [];
    } else if (this.agent.listeners) {
      // Function-based implementation
      return this.agent.listeners(eventName);
    }

    return [];
  }

  /**
   * Enable highlight updates rendering
   */
  enable() {
    if (!this.initialized) {
      console.error('[HighlightUpdatesController] Not initialized. Call initialize() first');
      return;
    }

    this.enabled = true;
    console.log('[HighlightUpdatesController] Highlights enabled');
  }

  /**
   * Disable highlight updates rendering
   */
  disable() {
    if (!this.initialized) {
      console.error('[HighlightUpdatesController] Not initialized. Call initialize() first');
      return;
    }

    this.enabled = false;
    console.log('[HighlightUpdatesController] Highlights disabled');
  }

  /**
   * Toggle highlight updates on/off
   * @returns {boolean} New enabled state
   */
  toggle() {
    if (!this.initialized) {
      console.error('[HighlightUpdatesController] Not initialized. Call initialize() first');
      return this.enabled;
    }

    this.enabled = !this.enabled;
    console.log(`[HighlightUpdatesController] Highlights ${this.enabled ? 'enabled' : 'disabled'}`);
    return this.enabled;
  }

  /**
   * Get current enabled state
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Cleanup and restore original listener
   */
  destroy() {
    if (!this.initialized) {
      return;
    }

    if (this.agent && this.controlledListener) {
      this.agent.removeListener('drawTraceUpdates', this.controlledListener);

      if (this.originalListener) {
        this.agent.addListener('drawTraceUpdates', this.originalListener);
      }
    }

    this.enabled = true;
    this.originalListener = null;
    this.controlledListener = null;
    this.agent = null;
    this.initialized = false;

    console.log('[HighlightUpdatesController] Destroyed and restored original state');
  }
}

// Export singleton instance
const highlightUpdatesController = new HighlightUpdatesController();

// Expose globally for easy access (optional)
if (__DEV__ && typeof window !== 'undefined') {
  window.__HIGHLIGHT_UPDATES_CONTROLLER__ = highlightUpdatesController;
}

export default highlightUpdatesController;
```

### Step 2: Initialize in Your App

**In your app's entry point (e.g., `index.js` or `App.js`):**

```javascript
import HighlightUpdatesController from './HighlightUpdatesController';

// Option A: Initialize when DevTools connects
if (__DEV__) {
  const hook = window?.__REACT_DEVTOOLS_GLOBAL_HOOK__;

  if (hook?.reactDevtoolsAgent) {
    // Agent already connected
    HighlightUpdatesController.initialize();
  } else if (hook) {
    // Wait for agent to connect
    hook.on?.('react-devtools', () => {
      // Small delay to ensure listener is registered
      setTimeout(() => {
        HighlightUpdatesController.initialize();
      }, 100);
    });
  }
}

// Option B: Initialize after a delay (simpler, less reliable)
if (__DEV__) {
  setTimeout(() => {
    HighlightUpdatesController.initialize();
  }, 2000);
}
```

### Step 3: Usage Examples

```javascript
import HighlightUpdatesController from './HighlightUpdatesController';

// Disable highlights
HighlightUpdatesController.disable();

// Enable highlights
HighlightUpdatesController.enable();

// Toggle
HighlightUpdatesController.toggle();

// Check state
const isEnabled = HighlightUpdatesController.isEnabled();
console.log('Highlights enabled:', isEnabled);

// Access from console (if global exposure enabled)
window.__HIGHLIGHT_UPDATES_CONTROLLER__.toggle();
```

### Step 4: UI Integration Example

**Create a toggle button component:**

```javascript
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import HighlightUpdatesController from './HighlightUpdatesController';

const HighlightToggleButton = () => {
  const [isEnabled, setIsEnabled] = useState(
    HighlightUpdatesController.isEnabled()
  );

  useEffect(() => {
    // Ensure controller is initialized
    if (!HighlightUpdatesController.initialized) {
      HighlightUpdatesController.initialize();
    }
  }, []);

  const handleToggle = () => {
    const newState = HighlightUpdatesController.toggle();
    setIsEnabled(newState);
  };

  if (!__DEV__) {
    return null; // Only show in development
  }

  return (
    <TouchableOpacity
      style={[styles.button, isEnabled ? styles.enabled : styles.disabled]}
      onPress={handleToggle}
    >
      <Text style={styles.text}>
        {isEnabled ? '🟢 Highlights ON' : '🔴 Highlights OFF'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    padding: 12,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  enabled: {
    backgroundColor: '#4CAF50',
  },
  disabled: {
    backgroundColor: '#F44336',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default HighlightToggleButton;
```

---

## Testing Plan

### 1. Verify Initialization
```javascript
// In Chrome DevTools console
window.__REACT_DEVTOOLS_GLOBAL_HOOK__
// Should show the hook object

window.__REACT_DEVTOOLS_GLOBAL_HOOK__.reactDevtoolsAgent
// Should show the agent with addListener/removeListener methods

window.__HIGHLIGHT_UPDATES_CONTROLLER__.initialized
// Should be true after initialization
```

### 2. Test Toggle Functionality
1. Open React Native DevTools in Chrome
2. Navigate to Profiler tab → Settings
3. Enable "Highlight updates when components render"
4. Trigger some component updates
5. Verify highlights appear
6. Call `HighlightUpdatesController.disable()`
7. Trigger more updates
8. Verify highlights no longer appear

### 3. Test State Persistence
```javascript
// Disable
HighlightUpdatesController.disable();
console.log(HighlightUpdatesController.isEnabled()); // false

// Enable
HighlightUpdatesController.enable();
console.log(HighlightUpdatesController.isEnabled()); // true
```

### 4. Test Cleanup
```javascript
// Destroy controller
HighlightUpdatesController.destroy();

// Verify original functionality restored
// Highlights should work normally from DevTools
```

---

## Troubleshooting

### Controller Not Initializing

**Problem:** `initialize()` returns false

**Solutions:**
1. Check DevTools is connected: `window.__REACT_DEVTOOLS_GLOBAL_HOOK__.reactDevtoolsAgent`
2. Add initialization delay: Wait 1-2 seconds after app launch
3. Listen for agent connection event instead of immediate initialization

### Highlights Still Showing After Disable

**Problem:** Highlights appear even when disabled

**Solutions:**
1. Verify controller is initialized: `HighlightUpdatesController.initialized`
2. Check enabled state: `HighlightUpdatesController.isEnabled()`
3. Ensure listener was properly intercepted (check console logs)

### Listener Not Found

**Problem:** Original listener is null

**Reasons:**
1. Registry hasn't attached listener yet (timing issue)
2. EventEmitter implementation changed
3. DevTools version incompatibility

**Solutions:**
1. Increase initialization delay
2. Initialize on first `drawTraceUpdates` event
3. Check react-devtools-core version (should be ^6.1.5)

---

## Alternative Approaches (Not Recommended)

### Alternative 1: Modify DebuggingOverlayRegistry Source

**File:** `packages/react-native/Libraries/Debugging/DebuggingOverlayRegistry.js`

Add a flag to the registry class:

```javascript
class DebuggingOverlayRegistry {
  #highlightsEnabled = true;

  enableHighlights() { this.#highlightsEnabled = true; }
  disableHighlights() { this.#highlightsEnabled = false; }

  #onDrawTraceUpdates = traceUpdates => {
    if (!this.#highlightsEnabled) return; // Add this check
    // ... rest of implementation
  };
}
```

**Cons:** Requires modifying React Native source code

### Alternative 2: Conditionally Render DebuggingOverlay

**File:** `packages/react-native/Libraries/ReactNative/AppContainer-dev.js`

Make overlay rendering conditional:

```javascript
{shouldShowDebuggingOverlay && <DebuggingOverlay ref={debuggingOverlayRef} />}
```

**Cons:** Requires modifying React Native source code, breaks when overlay isn't mounted

### Alternative 3: Patch Commands

Intercept native commands before they reach the native layer:

```javascript
const Commands = require('react-native/src/private/specs_DEPRECATED/components/DebuggingOverlayNativeComponent').Commands;

const originalHighlightTraceUpdates = Commands.highlightTraceUpdates;
Commands.highlightTraceUpdates = (viewRef, updates) => {
  if (highlightsEnabled) {
    originalHighlightTraceUpdates(viewRef, updates);
  }
};
```

**Cons:** Patches generated code, fragile, may not work with all bundler configs

---

## Dependencies

- **react-devtools-core**: ^6.1.5 (from `packages/react-native/package.json:188`)
- **React Native**: Compatible with 0.70+
- **Development mode only**: Feature only works in `__DEV__` builds

---

## References

### Key Files
1. `packages/react-native/Libraries/Types/ReactDevToolsTypes.js` - Type definitions
2. `packages/react-native/Libraries/Debugging/DebuggingOverlayRegistry.js` - Event handler
3. `packages/react-native/Libraries/Debugging/DebuggingOverlay.js` - React component
4. `packages/react-native/src/private/specs_DEPRECATED/components/DebuggingOverlayNativeComponent.js` - Native interface
5. `packages/react-native/Libraries/ReactNative/AppContainer-dev.js` - Integration point
6. `packages/react-native/Libraries/Core/setUpReactDevTools.js` - Initialization

### External Documentation
- React DevTools Core: https://github.com/facebook/react/tree/main/packages/react-devtools-core
- React DevTools: https://github.com/facebook/react/tree/main/packages/react-devtools

---

## Summary

**Recommended Approach:** Option 1 - Agent Listener Interception

This approach provides the cleanest solution without modifying React Native source code. The controller module intercepts the DevTools agent's event system to conditionally allow or block highlight rendering.

**Next Steps:**
1. Create `HighlightUpdatesController.js` module
2. Initialize in app entry point
3. Add UI controls (optional)
4. Test with DevTools profiler
5. Integrate into your development workflow

**Estimated Implementation Time:** 1-2 hours including testing
