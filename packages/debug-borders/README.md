# @react-buoy/debug-borders

A visual layout debugging tool that adds colored borders around all React Native components to help you visualize component structure and nesting depth. Works with Expo, React Native CLI, and supports both the new architecture (Fabric) and legacy architecture.

## Features

- **Colored Borders**: Each nesting level gets a unique, vibrant color for easy identification
- **Real-Time Updates**: Automatically tracks layout changes (updates every 2 seconds)
- **Zero Configuration**: Works out of the box with the preset
- **Performance Optimized**: Minimal impact (~30ms to measure 400+ components)
- **Touch-Through**: Borders don't interfere with touch interactions (`pointerEvents="none"`)
- **Fiber Tree Traversal**: Uses React internals to find all components efficiently
- **Simple Toggle**: Easy on/off controls via modal interface

## Installation

This package is part of the React Buoy monorepo and is automatically available to other packages and the example app.

For external projects:

```bash
npm install @react-buoy/debug-borders
# or
pnpm add @react-buoy/debug-borders
# or
yarn add @react-buoy/debug-borders
```

## Quick Start

### Simplest Setup - Zero Config!

**Import the preset and add it to your tools array. Done!**

```typescript
import { debugBordersToolPreset, DebugBordersStandaloneOverlay } from '@react-buoy/debug-borders';
import { FloatingDevTools } from '@react-buoy/core';

const installedApps = [
  debugBordersToolPreset, // Add the tool to your menu
  // ...your other tools
];

function App() {
  return (
    <>
      <FloatingDevTools
        apps={installedApps}
        environment="local"
        userRole="admin"
      />
      
      {/* IMPORTANT: Render overlay at root level */}
      <DebugBordersStandaloneOverlay />
      
      {/* Your app content */}
      <YourAppContent />
    </>
  );
}
```

**Done!** The preset automatically:
- ✅ Adds BORDERS tool to your floating menu
- ✅ Toggles borders on/off when you tap the icon
- ✅ No modal needed - direct toggle!
- ✅ Updates borders in real-time

**⚠️ Important:** The `DebugBordersStandaloneOverlay` component MUST be rendered at the root level of your app (outside all modals and navigation containers) for borders to appear on top of everything.

## Usage

### Basic Usage with Preset

The simplest way to use debug borders - just tap the icon to toggle!

```typescript
import { debugBordersToolPreset, DebugBordersStandaloneOverlay } from '@react-buoy/debug-borders';

// Add to your FloatingDevTools apps array
const installedApps = [debugBordersToolPreset];

// Render overlay at root level
<DebugBordersStandaloneOverlay />

// That's it! Tap the BORDERS icon to toggle borders on/off
```

### Custom Configuration

Customize the tool appearance:

```typescript
import { createDebugBordersTool, DebugBordersStandaloneOverlay } from '@react-buoy/debug-borders';

const customBordersTool = createDebugBordersTool({
  name: "LAYOUT",
  description: "Layout visualizer",
  color: "#ec4899", // Pink icon
  id: "custom-borders",
});

const installedApps = [customBordersTool];

// Still need to render overlay at root
<DebugBordersStandaloneOverlay />

// Tap the icon to toggle borders
```

### Programmatic Control

Control borders programmatically without the modal:

```typescript
import { DebugBordersManager, DebugBordersStandaloneOverlay } from '@react-buoy/debug-borders';

// Enable borders
DebugBordersManager.enable();

// Disable borders
DebugBordersManager.disable();

// Toggle on/off
DebugBordersManager.toggle();

// Check status
const isEnabled = DebugBordersManager.isEnabled();

// Subscribe to state changes
const unsubscribe = DebugBordersManager.subscribe((enabled) => {
  console.log('Borders enabled:', enabled);
});

// Clean up
unsubscribe();

// Still need to render overlay
<DebugBordersStandaloneOverlay />
```

## API Reference

### Preset

#### `debugBordersToolPreset`

Pre-configured tool for FloatingDevTools with zero configuration needed. Tap the icon to toggle borders on/off.

```typescript
import { debugBordersToolPreset } from '@react-buoy/debug-borders';

const installedApps = [debugBordersToolPreset];
```

### Functions

#### `createDebugBordersTool(options?)`

Create a custom debug borders tool configuration.

**Options:**
- `name?: string` - Tool name (default: "BORDERS")
- `description?: string` - Tool description (default: "Visual layout debugger - tap to toggle")
- `color?: string` - Icon color (default: "#a78bfa" - purple)
- `id?: string` - Custom tool ID (default: "debug-borders")

**Example:**
```typescript
const customTool = createDebugBordersTool({
  name: "LAYOUT",
  color: "#10b981",
});
```

### Components

#### `<DebugBordersStandaloneOverlay />`

The main overlay component that renders colored borders. **Must be rendered at root level.**

```typescript
import { DebugBordersStandaloneOverlay } from '@react-buoy/debug-borders';

<DebugBordersStandaloneOverlay />
```

**Props:** None (controlled via `DebugBordersManager`)

**Note:** This component must be rendered at the root level of your app, outside all modals and navigation containers, for borders to appear on top of everything.

#### `<DebugBordersModal />` [DEPRECATED]

Modal component with toggle controls. **Note:** The preset now uses direct toggle without a modal. This component is kept for backwards compatibility but not recommended for new code.

```typescript
import { DebugBordersModal } from '@react-buoy/debug-borders';

// Not needed with the preset - it toggles directly!
```

### Manager API

#### `DebugBordersManager`

Global state manager for controlling debug borders.

**Methods:**
- `enable()` - Enable debug borders
- `disable()` - Disable debug borders
- `toggle()` - Toggle borders on/off
- `isEnabled(): boolean` - Check if borders are enabled
- `setEnabled(enabled: boolean)` - Set enabled state
- `subscribe(callback: (enabled: boolean) => void): () => void` - Subscribe to state changes

**Example:**
```typescript
import { DebugBordersManager } from '@react-buoy/debug-borders';

// Enable borders
DebugBordersManager.enable();

// Subscribe to changes
const unsubscribe = DebugBordersManager.subscribe((enabled) => {
  console.log('Borders:', enabled ? 'ON' : 'OFF');
});

// Clean up
unsubscribe();
```

## How It Works

This implementation uses the same proven approach as React Native's built-in dev tools:

1. **Access Fiber Tree** - Uses `__REACT_DEVTOOLS_GLOBAL_HOOK__` to access React internals
2. **Find Components** - Traverses the fiber tree to find all host components (View, Text, etc.)
3. **Measure Positions** - Uses component measurement APIs (`measure()` callback)
4. **Generate Colors** - Assigns colors based on nesting depth using the golden angle (137.5°)
5. **Render Borders** - Draws colored borders as absolutely-positioned views
6. **Update Loop** - Refreshes every 2 seconds when enabled

### Color Scheme

Colors are assigned based on component nesting depth using the golden angle for maximum distinctiveness:

| Depth | Color Type | Visual |
|-------|------------|---------|
| 0 (root) | Red-Orange | Outer components |
| 1 | Green | First level children |
| 2 | Blue | Second level |
| 3 | Magenta | Third level |
| 4 | Yellow | Fourth level |
| 5+ | Continues with golden angle distribution | Deep nesting |

## Architecture

### Simple Toggle Design

The debug borders tool uses a direct toggle approach - no modal needed!

1. **Icon Press** → Directly toggles borders on/off via `DebugBordersManager.toggle()`
2. **Overlay Component** (`DebugBordersStandaloneOverlay`)
   - Lives at app root level
   - Renders the actual colored borders
   - Uses `pointerEvents="none"` to not interfere with touches
   - Subscribes to `DebugBordersManager` for state updates

### State Management

- `DebugBordersManager` holds global enabled/disabled state
- Uses subscribe/unsubscribe pattern for React components
- Overlay subscribes to the manager for real-time updates
- Direct toggle via `DebugBordersManager.toggle()` when icon is tapped
- Persistent across component remounts

## Performance

- **Measurement Time:** ~30ms for 400+ components
- **Update Frequency:** Every 2 seconds (configurable in source)
- **Memory Impact:** Minimal (only stores rectangle data)
- **Runtime Impact:** Zero when disabled, minimal when enabled

## Compatibility

- ✅ React Native >= 0.70.0
- ✅ Fabric (New Architecture)
- ✅ Paper (Legacy Architecture)
- ✅ Expo
- ✅ React Native CLI

## Troubleshooting

### Borders not showing?

1. Make sure `DebugBordersStandaloneOverlay` is rendered at root level (outside modals/navigation)
2. Check that borders are enabled by tapping the icon again (it toggles on/off)
3. Check console for any errors - you should see "[DebugBorders] Debug borders enabled"
4. Verify you're in development mode (`__DEV__` is true)

### Performance issues?

1. The tool is optimized but scanning 1000+ components may take longer
2. Update frequency is 2 seconds by default (modify in source if needed)
3. Disable borders when not actively debugging

### Components not tracked?

The tool tracks all host components (View, Text, Image, etc.). Custom components are tracked through their host component children.

## Development

### Building

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

### Clean Build

```bash
pnpm clean
```

## Structure

```
debug-borders/
├── src/
│   ├── index.tsx              # Main exports
│   ├── preset.tsx             # Preset configuration with direct toggle
│   └── debug-borders/
│       ├── components/
│       │   ├── DebugBordersModal.tsx           # [Deprecated] Control modal
│       │   └── DebugBordersStandaloneOverlay.tsx # Border overlay
│       ├── utils/
│       │   ├── DebugBordersManager.js          # State manager
│       │   ├── fiberTreeTraversal.js           # Fiber tree traversal
│       │   ├── componentMeasurement.js         # Component measurements
│       │   └── colorGeneration.js              # Color generation
│       ├── types.ts           # TypeScript types
│       └── index.ts           # Feature exports
├── package.json
└── README.md
```

## Credits

Inspired by React Native's built-in Element Inspector and the debug borders feature from Chrome DevTools.

## License

MIT
