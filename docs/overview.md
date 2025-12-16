---
title: Overview
id: overview
---

React Buoy is a **zero-config mobile dev tools framework** that gives your entire team instant access to powerful debugging tools.

## What is React Buoy?

React Buoy provides a single floating menu that gives you access to various debugging tools—in dev, staging, AND production. No configuration, no complexity. Just install packages and they automatically appear.

> [!IMPORTANT]
> React Buoy is currently in **alpha** and its API is subject to change.

## Key Features

- **Zero Configuration** – Install packages, they auto-appear. No manual setup required.
- **Always-Visible Context** – See your environment (dev/staging/prod) and role at a glance.
- **Persistent State** – Tools remember their position and state through app reloads.
- **Team-Friendly** – Same tools everywhere. Onboard new developers in minutes.
- **Fully Extensible** – Drop in any React component as a custom tool.

## Available Tools

| Tool | Package | What It Does |
|------|---------|--------------|
| ENV | `@react-buoy/env` | Environment variable inspector |
| Network | `@react-buoy/network` | API request monitor |
| Storage | `@react-buoy/storage` | AsyncStorage/MMKV browser |
| React Query | `@react-buoy/react-query` | TanStack Query devtools |

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

## Next Steps

- [Quick Start](./quick-start) - Get up and running in 2 minutes
- [Installation](./installation) - Detailed installation guide
- [FloatingDevTools](./floating-devtools) - Core component documentation
