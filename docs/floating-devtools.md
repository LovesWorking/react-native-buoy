---
title: FloatingDevTools
id: floating-devtools
---

The `FloatingDevTools` component is the entry point for React Buoy. It renders a draggable floating button that opens a menu containing all your installed debugging tools.

## Basic Usage

```tsx
import { FloatingDevTools } from "@react-buoy/core";

function App() {
  return (
    <>
      <YourApp />
      <FloatingDevTools environment="qa" />
    </>
  );
}
```

That's it. Any Buoy tool packages you've installed will automatically appear in the menu.

## Environment Badge

The floating button displays your current environment, helping your team instantly know where they are:

```tsx
<FloatingDevTools environment="qa" />
```

Common values: `"local"`, `"dev"`, `"staging"`, `"qa"`, `"production"`

## How Tools Auto-Register

When you install a Buoy tool package (like `@react-buoy/network` or `@react-buoy/storage`), it automatically registers itself with the floating menu. No imports, no configuration, no wiring.

```bash
npm install @react-buoy/network
```

The Network tool now appears in your menu. That's the magic of Buoy.

## Custom Tools

Need something specific to your app? Add your own tools:

```tsx
import { FloatingDevTools } from "@react-buoy/core";

const FeatureFlagTool = () => (
  <View>
    <Text>Toggle feature flags here</Text>
  </View>
);

function App() {
  return (
    <FloatingDevTools
      environment="qa"
      customTools={[
        {
          name: "Flags",
          component: FeatureFlagTool,
          icon: "🚩",
        },
      ]}
    />
  );
}
```

See [Custom Tools](./custom-tools) for more details on building your own debugging tools.

## Draggable Button

The floating button can be dragged anywhere on screen. It remembers its position between sessions, so it stays where your team likes it.

## Next Steps

- [Custom Tools](./custom-tools) — Build team-specific debugging tools
- [Quick Start](./quick-start) — Full setup walkthrough
