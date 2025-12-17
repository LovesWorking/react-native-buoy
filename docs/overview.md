---
title: Overview
id: overview
---

Buoy is a floating dev tools menu for React Native. It speeds up developers, QA, and product teams by up to **200x** on tasks like regression testing, bug reproduction, and environment validation.

One floating button. Every tool your team needs. Works in dev, staging, and production.

## Who It's For

- **Developers** — Debug faster. See every network request, storage value, and environment variable without leaving your app.
- **QA** — Reproduce bugs instantly. Validate state, inspect storage, and verify configs on any build.
- **Product** — Watch user flows, check feature flags, and verify the right environment is active.

## What You Get

| Tool | What It Does |
|------|--------------|
| **Network** | See every API call — request, response, timing, errors |
| **Storage** | Browse and edit AsyncStorage & MMKV in real-time |
| **Environment** | Validate env vars with type checking and required field validation |
| **Debug Borders** | Tap any element to see its testID, accessibility label, and styles |
| **Route Events** | Track navigation changes and browse your route structure |
| **React Query** | Inspect query cache, trigger refetches, simulate offline mode |
| **Render Highlighter** | Spot unnecessary re-renders as they happen |

## Why Buoy

- **Zero config** — Install a package, it appears in the menu. No wiring.
- **Works everywhere** — Dev, staging, production. Same tools for everyone.
- **Modular** — Only install what you need. Each tool is a separate package.
- **Team-friendly** — Onboard new devs in minutes with consistent debugging.

## Quick Start

```tsx
import { FloatingDevTools } from "@react-buoy/core";

export default function App() {
  return (
    <>
      <YourApp />
      <FloatingDevTools environment="local" />
    </>
  );
}
```

Install any tool package and it automatically appears in the menu. No configuration needed.

## Build Your Own Tools

Need something specific to your app? Drop in any React component as a custom tool. Build internal debugging utilities, feature flag toggles, or team-specific inspectors that integrate seamlessly with the floating menu.

## Next Steps

- [Installation](./installation) — Add Buoy to your project
- [Quick Start](./quick-start) — Full setup in 2 minutes
- [Custom Tools](./custom-tools) — Build your own debugging tools
- [Tools Reference](./tools/network) — Detailed docs for each tool
