---
title: Quick Start
id: quick-start
---

Get React Buoy running in your React Native app in under 2 minutes.

## Installation

```bash
npm install @react-buoy/core
# or
yarn add @react-buoy/core
# or
pnpm add @react-buoy/core
```

## Basic Setup

Add the `FloatingDevTools` component to your app's root:

```tsx
import { FloatingDevTools } from "@react-buoy/core";

export default function App() {
  return (
    <>
      {/* Your existing app content */}
      <YourApp />

      {/* Add this at the end */}
      <FloatingDevTools
        environment="local"
        userRole="admin"
      />
    </>
  );
}
```

That's it! You should now see a floating button in the corner of your app.

## Adding Your First Tool

Install the environment inspector tool:

```bash
npm install @react-buoy/env
```

The tool will automatically appear in your floating menu. No additional configuration needed!

## Environment-Based Display

Control when the devtools are visible:

```tsx
<FloatingDevTools
  environment={__DEV__ ? "local" : "production"}
  userRole="admin"
  // Only show in development by default
/>
```

## Next Steps

- [Installation](./installation) - Complete installation guide with all options
- [FloatingDevTools](./floating-devtools) - Full API reference
- [Custom Tools](./custom-tools) - Build your own debugging tools
