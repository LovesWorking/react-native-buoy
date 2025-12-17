---
title: Quick Start
id: quick-start
---

From zero to debugging in under 2 minutes.

## 1. Install the core

<!-- ::pm npm="npm install @react-buoy/core" yarn="yarn add @react-buoy/core" pnpm="pnpm add @react-buoy/core" bun="bun add @react-buoy/core" -->

## 2. Add to your app

Drop `FloatingDevTools` at the root of your app:

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

A floating button appears in the corner of your app. Tap it to open the menu.

## 3. Add tools

Install any tool package — it automatically appears in the menu. No wiring, no config.

<!-- ::pm npm="npm install @react-buoy/network" yarn="yarn add @react-buoy/network" pnpm="pnpm add @react-buoy/network" bun="bun add @react-buoy/network" -->

That's it. Open the menu, tap Network, and you're watching every API call in real-time.

## Available tools

<!-- ::tools-table -->

Install what you need. Skip what you don't.

## Control who sees devtools

Only show devtools to specific users — admins, QA, internal team members, or whoever your business needs:

```tsx
import { FloatingDevTools } from "@react-buoy/core";

export default function App() {
  const { user } = useAuth();

  // Only render for internal users, admins, or QA
  const showDevTools =
    user?.role === "admin" ||
    user?.role === "qa" ||
    user?.email?.endsWith("@yourcompany.com");

  return (
    <>
      <YourApp />
      {showDevTools && (
        <FloatingDevTools
          environment={__DEV__ ? "local" : "production"}
          userRole={user?.role}
        />
      )}
    </>
  );
}
```

Or keep it available for everyone — your QA and support teams will thank you.

## What's next

- [FloatingDevTools](./floating-devtools) — Core component reference
- [Custom Tools](./custom-tools) — Build your own debugging tools
