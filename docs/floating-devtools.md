---
title: FloatingDevTools
id: floating-devtools
---

The `FloatingDevTools` component is the core of React Buoy. It renders a draggable floating button that opens a menu containing all your debugging tools.

## Basic Usage

```tsx
import { FloatingDevTools } from "@react-buoy/core";

function App() {
  return (
    <>
      <YourApp />
      <FloatingDevTools environment="local" userRole="admin" />
    </>
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `environment` | `string` | `"local"` | Current environment (e.g., "local", "staging", "production") |
| `userRole` | `string` | `undefined` | Current user's role for display |
| `customTools` | `CustomTool[]` | `[]` | Array of custom tool components |
| `position` | `"top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `"bottom-right"` | Initial button position |
| `disabled` | `boolean` | `false` | Disable the devtools entirely |

## Environment Display

The environment badge is always visible on the floating button, helping your team quickly identify which environment they're using:

```tsx
<FloatingDevTools
  environment={
    __DEV__ ? "local" :
    process.env.EXPO_PUBLIC_ENV === "staging" ? "staging" :
    "production"
  }
/>
```

## Position

Set the initial corner for the floating button:

```tsx
<FloatingDevTools
  environment="local"
  position="top-right"
/>
```

The button can be dragged to any position and will remember its location between app sessions.

## Disabling in Production

You can conditionally disable the devtools:

```tsx
<FloatingDevTools
  environment="production"
  disabled={!__DEV__}
/>
```

Or simply don't render the component:

```tsx
{__DEV__ && <FloatingDevTools environment="local" />}
```

## Custom Tools

Add your own tools to the menu:

```tsx
import { FloatingDevTools } from "@react-buoy/core";

const MyDebugTool = () => (
  <View>
    <Text>My custom debugging tool</Text>
  </View>
);

function App() {
  return (
    <FloatingDevTools
      environment="local"
      customTools={[
        {
          name: "Debug",
          component: MyDebugTool,
          icon: "🔧",
        },
      ]}
    />
  );
}
```

See [Custom Tools](./custom-tools) for more details.

## Next Steps

- [Custom Tools](./custom-tools) - Create your own debugging tools
- [Environment & Roles](./environment-roles) - Advanced configuration
