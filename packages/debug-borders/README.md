# @react-buoy/debug-borders

A visual layout debugging tool for React Native that highlights components with colored borders and labels. Features three display modes, smart filtering to show only meaningful components, and tap-to-inspect functionality. Works with Expo, React Native CLI, and supports both the new architecture (Fabric) and legacy architecture.

## Features

- **Three Display Modes**: Cycle through Off → Borders → Labels with a single tap
- **Smart Filtering**: Only shows borders/labels for components with `testID` or `accessibilityLabel`
- **Tap-to-Inspect**: Tap any label to see detailed component information in a modal
- **Color-Coded Labels**: Labels match border colors based on identifier type (testID = green, accessibilityLabel = pink)
- **Label Stacking**: Overlapping labels automatically stack upward like a menu
- **Hidden Screen Detection**: Automatically hides borders on inactive screens in stack navigators
- **DevTools Aware**: Hides borders when DevTools modals are open
- **Real-Time Updates**: Automatically tracks layout changes (updates every 2 seconds)
- **Touch-Through**: Borders don't interfere with touch interactions
- **Performance Optimized**: Minimal impact (~30ms to measure 400+ components)

## Installation

```bash
npm install @react-buoy/debug-borders
# or
pnpm add @react-buoy/debug-borders
# or
yarn add @react-buoy/debug-borders
```

## Quick Start

```tsx
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

**Done!** Tap the BORDERS icon in the floating menu to cycle through modes.

## Display Modes

The tool cycles through three modes when you tap the icon:

| Mode | Icon Color | Description |
|------|------------|-------------|
| **Off** | Gray | No borders displayed |
| **Borders** | Green | Rainbow-colored borders for all components (depth-based colors) |
| **Labels** | Cyan | Borders + labels only for components with `testID` or `accessibilityLabel` |

### Labels Mode Features

In Labels mode, the tool provides focused debugging:

- **Only shows components with identifiers** - Components with `testID` or `accessibilityLabel` get borders and labels
- **Color-coded by identifier type**:
  - 🟢 Green = `testID`
  - 🩷 Pink = `accessibilityLabel`
- **Labels positioned above boxes** - Easy to read without obscuring content
- **Automatic stacking** - Overlapping labels stack upward like a menu
- **Tap to inspect** - Tap any label to see full component details

## Tap-to-Inspect Modal

Tap any label in Labels mode to open a detailed inspection modal showing:

### Identifiers
- `testID` (green)
- `accessibilityLabel` (pink)
- `nativeID` (amber)
- `key`

### Component Info
- Component Name (the React component that rendered this)
- Parent Component
- Display Name (friendly name like "View", "Text")
- Native View Type (e.g., "RCTView", "RCTText")
- Fiber Tag

### Position & Size
- X, Y coordinates
- Width, Height
- Depth in component tree

### Accessibility
- Role
- Hint
- State (displayed with interactive DataViewer)

### Styles
- Full computed styles (displayed with interactive DataViewer)

## Usage Examples

### Basic Usage with Preset

```tsx
import { debugBordersToolPreset, DebugBordersStandaloneOverlay } from '@react-buoy/debug-borders';

// Add to your FloatingDevTools apps array
const installedApps = [debugBordersToolPreset];

// Render overlay at root level
<DebugBordersStandaloneOverlay />

// Tap the BORDERS icon to cycle: Off → Borders → Labels → Off
```

### Custom Configuration

```tsx
import { createDebugBordersTool, DebugBordersStandaloneOverlay } from '@react-buoy/debug-borders';

const customBordersTool = createDebugBordersTool({
  name: "LAYOUT",
  description: "Layout visualizer",
  offColor: "#9ca3af",      // Gray when off
  bordersColor: "#ec4899",  // Pink in borders mode
  labelsColor: "#8b5cf6",   // Purple in labels mode
  id: "custom-borders",
});

const installedApps = [customBordersTool];
```

### Programmatic Control

```tsx
import { DebugBordersManager, DebugBordersStandaloneOverlay } from '@react-buoy/debug-borders';

// Get current mode
const mode = DebugBordersManager.getMode(); // "off" | "borders" | "labels"

// Set specific mode
DebugBordersManager.setMode("borders");
DebugBordersManager.setMode("labels");
DebugBordersManager.setMode("off");

// Cycle to next mode
DebugBordersManager.cycle(); // off → borders → labels → off

// Check if labels should be shown
const showLabels = DebugBordersManager.showLabels(); // true when mode is "labels"

// Subscribe to mode changes
const unsubscribe = DebugBordersManager.subscribe((mode) => {
  console.log('Mode changed to:', mode);
});

// Clean up
unsubscribe();
```

## API Reference

### Preset

#### `debugBordersToolPreset`

Pre-configured tool for FloatingDevTools. Shows only in the floating menu (not the dial).

```tsx
import { debugBordersToolPreset } from '@react-buoy/debug-borders';

const installedApps = [debugBordersToolPreset];
```

### Functions

#### `createDebugBordersTool(options?)`

Create a custom debug borders tool configuration.

**Options:**
- `name?: string` - Tool name (default: "BORDERS")
- `description?: string` - Tool description
- `offColor?: string` - Icon color when off (default: "#6b7280" gray)
- `bordersColor?: string` - Icon color in borders mode (default: "#10b981" green)
- `labelsColor?: string` - Icon color in labels mode (default: "#06b6d4" cyan)
- `id?: string` - Custom tool ID (default: "debug-borders")

### Components

#### `<DebugBordersStandaloneOverlay />`

The main overlay component that renders borders and labels. **Must be rendered at root level.**

```tsx
import { DebugBordersStandaloneOverlay } from '@react-buoy/debug-borders';

<DebugBordersStandaloneOverlay />
```

**Note:** This component must be rendered at the root level of your app, outside all modals and navigation containers, for borders to appear on top of everything.

### Manager API

#### `DebugBordersManager`

Global state manager for controlling debug borders.

**Methods:**
- `getMode(): "off" | "borders" | "labels"` - Get current display mode
- `setMode(mode)` - Set display mode
- `cycle()` - Cycle to next mode (off → borders → labels → off)
- `showLabels(): boolean` - Check if labels should be shown (mode === "labels")
- `subscribe(callback: (mode) => void): () => void` - Subscribe to mode changes

## How It Works

### Smart Filtering

The tool intelligently filters what it displays:

1. **Hidden Screen Detection** - Skips components in inactive screens (React Navigation stack)
2. **SVG Filtering** - Excludes SVG elements (RNSVG* components)
3. **DevTools Filtering** - Excludes FloatingDevTools, modals, and other dev tool components
4. **Identifier Filtering** (Labels mode) - Only shows components with `testID` or `accessibilityLabel`

### Label Positioning

Labels are positioned above their component boxes and automatically stack when they would overlap:

```
┌─────────────────────────────────────┐
│ [submitButton]                      │  ← Labels stack upward
│ [formContainer]                     │
├─────────────────────────────────────┤
│                                     │
│        Component Content            │
│                                     │
└─────────────────────────────────────┘
```

### Color Scheme

**Borders Mode** - Colors based on nesting depth using golden angle (137.5°):
| Depth | Color |
|-------|-------|
| 0 | Red-Orange |
| 1 | Green |
| 2 | Blue |
| 3+ | Continues with golden angle |

**Labels Mode** - Colors based on identifier type:
| Identifier | Color |
|------------|-------|
| testID | Green (#10b981) |
| accessibilityLabel | Pink (#ec4899) |
| componentName | Purple (#a855f7) |
| nativeID | Amber (#f59e0b) |
| viewType (fallback) | Gray (#6b7280) |

## Performance

- **Measurement Time:** ~30ms for 400+ components
- **Update Frequency:** Every 2 seconds when enabled
- **Memory Impact:** Minimal (only stores rectangle data)
- **Runtime Impact:** Zero when disabled
- **Label Positioning:** O(n²) worst case, optimized with early exits

## Compatibility

- React Native >= 0.70.0
- Fabric (New Architecture)
- Paper (Legacy Architecture)
- Expo
- React Native CLI

## Troubleshooting

### Borders not showing?

1. Make sure `DebugBordersStandaloneOverlay` is rendered at root level
2. Tap the icon to cycle modes - you may be in "off" mode
3. In Labels mode, borders only show for components with `testID` or `accessibilityLabel`
4. Verify you're in development mode (`__DEV__` is true)

### Labels overlapping content?

Labels are positioned above component boxes. If they still overlap, they automatically stack upward. Very dense UIs may have many stacked labels.

### Can't tap labels?

Make sure you're in Labels mode (cyan icon). In Borders mode, labels aren't shown and tapping doesn't work.

### Modal not scrolling?

The inspection modal uses the standard JsModal component. Swipe up to expand it or drag the handle to resize.

## Structure

```
debug-borders/
├── src/
│   ├── index.tsx              # Main exports
│   ├── preset.tsx             # Preset configuration
│   └── debug-borders/
│       ├── components/
│       │   └── DebugBordersStandaloneOverlay.tsx
│       └── utils/
│           ├── DebugBordersManager.js    # State manager (3 modes)
│           ├── fiberTreeTraversal.js     # Fiber traversal + filtering
│           ├── componentMeasurement.js   # Component measurements
│           ├── componentInfo.js          # Label extraction
│           ├── labelPositioning.js       # Overlap resolution
│           ├── ViewTypeMapper.ts         # Native → friendly names
│           └── colorGeneration.js        # Color generation
├── package.json
└── README.md
```

## License

MIT
