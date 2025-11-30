# @react-buoy/highlight-updates

Control React DevTools' "Highlight updates when components render" feature directly from your React Native app.

## Overview

This tool intercepts the React DevTools agent's `drawTraceUpdates` event to provide programmatic control over component render highlighting. When DevTools has "Highlight updates when components render" enabled, this tool lets you toggle the highlighting on/off without navigating to DevTools settings.

## Installation

```bash
npm install @react-buoy/highlight-updates
# or
yarn add @react-buoy/highlight-updates
# or
pnpm add @react-buoy/highlight-updates
```

## Usage

### With FloatingDevTools (Recommended)

The easiest way to use this tool is with the FloatingDevTools menu:

```tsx
import { FloatingDevTools, autoDiscoverPresets } from '@react-buoy/core';

// The highlight updates tool is automatically discovered if installed
const apps = autoDiscoverPresets();

function App() {
  return (
    <FloatingDevTools apps={apps}>
      <YourApp />
    </FloatingDevTools>
  );
}
```

Or explicitly add the preset:

```tsx
import { FloatingDevTools } from '@react-buoy/core';
import { highlightUpdatesPreset } from '@react-buoy/highlight-updates';

function App() {
  return (
    <FloatingDevTools apps={[highlightUpdatesPreset]}>
      <YourApp />
    </FloatingDevTools>
  );
}
```

### Standalone Controller

You can also use the controller directly without the FloatingDevTools menu:

```tsx
import { HighlightUpdatesController } from '@react-buoy/highlight-updates';

// Initialize when DevTools is connected
HighlightUpdatesController.initialize();

// Toggle highlights
HighlightUpdatesController.toggle();

// Enable/disable directly
HighlightUpdatesController.enable();
HighlightUpdatesController.disable();

// Check state
const isEnabled = HighlightUpdatesController.isEnabled();

// Subscribe to state changes
const unsubscribe = HighlightUpdatesController.subscribe((enabled) => {
  console.log('Highlights enabled:', enabled);
});

// Cleanup when done
HighlightUpdatesController.destroy();
```

### Custom Configuration

Create a customized version of the tool:

```tsx
import { createHighlightUpdatesTool } from '@react-buoy/highlight-updates';

const myHighlightTool = createHighlightUpdatesTool({
  name: 'RENDERS',
  enabledColor: '#ec4899', // Pink when enabled
  disabledColor: '#9ca3af', // Gray when disabled
  autoInitialize: true, // Initialize automatically
});
```

## Requirements

For this tool to work:

1. **React DevTools must be connected** (Chrome DevTools or Flipper)
2. **"Highlight updates when components render" must be enabled** in DevTools Profiler settings

This tool then allows you to temporarily disable the highlighting without going back to DevTools settings.

## How It Works

The tool intercepts the DevTools agent's `drawTraceUpdates` event listener. When disabled, it simply doesn't forward the event to the original handler, effectively blocking the highlight rendering.

```
React DevTools Frontend (Chrome/Flipper)
    | (sends drawTraceUpdates event)
    v
React DevTools Agent
    | (event intercepted by HighlightUpdatesController)
    v
HighlightUpdatesController.controlledListener
    | (if enabled, forwards to original)
    v
DebuggingOverlayRegistry (original listener)
    | (processes component bounds)
    v
DebuggingOverlay (native component)
    | (renders highlights on screen)
```

## API Reference

### `highlightUpdatesPreset`

Pre-configured preset for use with FloatingDevTools.

### `createHighlightUpdatesTool(options?)`

Factory function to create a customized tool.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | `"UPDATES"` | Display name in the menu |
| `description` | `string` | `"Toggle component render highlights"` | Tool description |
| `enabledColor` | `string` | `"#10b981"` | Icon color when enabled (green) |
| `disabledColor` | `string` | `"#6b7280"` | Icon color when disabled (gray) |
| `id` | `string` | `"highlight-updates"` | Unique tool identifier |
| `autoInitialize` | `boolean` | `false` | Initialize automatically on load |

### `HighlightUpdatesController`

Standalone controller for programmatic use.

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize the controller. Returns `true` on success. |
| `enable()` | Enable highlight rendering |
| `disable()` | Disable highlight rendering |
| `toggle()` | Toggle the enabled state |
| `isEnabled()` | Get current enabled state |
| `setEnabled(enabled)` | Set enabled state |
| `isInitialized()` | Check if controller is initialized |
| `subscribe(callback)` | Subscribe to state changes. Returns unsubscribe function. |
| `destroy()` | Cleanup and restore original listener |

## Console Access

When in development mode, the controller is exposed globally:

```javascript
// In Chrome DevTools console
window.__HIGHLIGHT_UPDATES_CONTROLLER__.toggle();
window.__HIGHLIGHT_UPDATES_CONTROLLER__.isEnabled();
```

## Troubleshooting

### Controller Not Initializing

**Problem:** `initialize()` returns false

**Solutions:**
1. Check DevTools is connected: `window.__REACT_DEVTOOLS_GLOBAL_HOOK__.reactDevtoolsAgent`
2. Add initialization delay: Wait 1-2 seconds after app launch
3. Ensure "Highlight updates" is enabled in DevTools first

### Highlights Still Showing After Disable

**Problem:** Highlights appear even when disabled

**Solutions:**
1. Verify controller is initialized: `HighlightUpdatesController.isInitialized()`
2. Check enabled state: `HighlightUpdatesController.isEnabled()`
3. Ensure listener was properly intercepted (check console logs)

## Development

### Building

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

## License

MIT
