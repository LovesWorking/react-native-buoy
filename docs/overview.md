---
title: Overview
---

BUOY is currently in alpha and its API is subject to change.

## What is BUOY?

BUOY is a zero-config mobile dev tools library for React Native. It provides a floating menu that gives your entire team instant access to powerful debugging tools—in dev, staging, AND production.

## Key Features

- **Zero Configuration** - Install packages and they automatically appear in the floating menu. No manual setup, no wiring, no configuration files.
- **Built for React Native** - Designed specifically for React Native applications with mobile-first UI and gesture support.
- **Team-Friendly** - Same tools everywhere—dev, staging, production. Onboard new developers in minutes with consistent debugging experience.
- **Fully Extensible** - Drop in any React component as a custom tool. Build team-specific debugging utilities that integrate seamlessly.

## Available Tools

| Tool | Package | Description |
|------|---------|-------------|
| Environment Inspector | `@react-buoy/env` | Validate and inspect environment variables |
| Network Monitor | `@react-buoy/network` | Real-time API request monitoring |
| Storage Explorer | `@react-buoy/storage` | Browse AsyncStorage/MMKV data |
| React Query DevTools | `@react-buoy/react-query` | TanStack Query cache inspector |
| Route Events | `@react-buoy/route-events` | Navigation tracking and visualization |
| Debug Borders | `@react-buoy/debug-borders` | Visual layout debugging |
| Highlight Updates | `@react-buoy/highlight-updates` | Re-render detection |

## Quick Example

```tsx
import { FloatingDevTools } from "@react-buoy/core";

function App() {
  return (
    <>
      {/* Your app content */}
      <FloatingDevTools environment="local" userRole="admin" />
    </>
  );
}
```

That's it! All installed `@react-buoy/*` packages automatically appear in the floating menu.
