# React Buoy Devtools

**Zero-config mobile dev tools that just work.**

A single floating menu gives your entire team instant access to powerful debugging tools—in dev, staging, AND production. No configuration, no complexity. Just install packages and they automatically appear.

![React Buoy Demo](https://github.com/user-attachments/assets/a732d6a3-9963-49e3-b0f1-0d974a0a74d7)

[![npm version](https://img.shields.io/npm/v/@react-buoy/core?color=brightgreen)](https://www.npmjs.com/package/@react-buoy/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ⚡ 2-Minute Setup

### 1. Install Core + Tools

```bash
npm install @react-buoy/core @react-buoy/env @react-buoy/network
# or: pnpm add / yarn add / bun add
```

### 2. Add to Your App

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

### 3. That's It! 🎉

All installed tools automatically appear in your floating menu. No config needed.

> 💡 **Pro Tip**: Install all tools at once:
>
> ```bash
> npm i @react-buoy/{core,env,network,storage,react-query,route-events,debug-borders}
> ```

---

## 🎯 What You Get

**✨ Zero Configuration** – Install packages, they auto-appear. No manual setup.

**🏷️ Always-Visible Context** – See your environment (dev/staging/prod) and role at a glance.

**🔄 Persistent State** – Tools remember their position and state through reloads.

**👥 Team-Friendly** – Same tools everywhere. Onboard new devs in minutes.

**🎨 Beautiful UI** – Draggable menu with modal and bottom-sheet views.

**🔌 Fully Extensible** – Drop in any React component as a custom tool.

---

## 📦 Available Tools

Install any combination to customize your dev menu:

| Tool               | Package                     | What It Does                   | Key Features                                  |
| ------------------ | --------------------------- | ------------------------------ | --------------------------------------------- |
| 🌍 **ENV**         | `@react-buoy/env`           | Environment variable inspector | Validation, search, type checking, warnings   |
| 📡 **Network**     | `@react-buoy/network`       | API request monitor            | Timeline view, filtering, performance metrics |
| 💾 **Storage**     | `@react-buoy/storage`       | AsyncStorage/MMKV browser      | View/edit/delete, bulk ops, validation        |
| ⚡ **React Query** | `@react-buoy/react-query`   | TanStack Query devtools        | Cache inspector, offline toggle, refetch      |
| 🧭 **Routes**      | `@react-buoy/route-events`  | Route & navigation tracker     | Sitemap, stack view, event timeline           |
| 🎨 **Borders**     | `@react-buoy/debug-borders` | Visual layout debugger         | Colored component boundaries                  |

**Installation Pattern**: All packages follow the same simple pattern:

```bash
npm install @react-buoy/{tool-name}
# Peer dependencies auto-detected (e.g., @tanstack/react-query, @react-native-async-storage/async-storage)
```

**That's it!** Once installed, each tool automatically appears in `FloatingDevTools`.

<details>
<summary>📸 View screenshots for each tool</summary>

### Environment Inspector

<details>
<summary>Show preview</summary>

![ENV Tool](https://github.com/user-attachments/assets/75651046-33a0-4257-9011-3bcc4818a964)

</details>

### Network Monitor

<details>
<summary>Show preview</summary>

![Network Tool](https://github.com/user-attachments/assets/473ddf83-03cd-4bd1-8dc3-0f66eda9fa8a)

</details>

### Storage Browser

<details>
<summary>Show preview</summary>

![Storage Tool](https://github.com/user-attachments/assets/80ef1c60-d20c-4d8b-97e6-f37b21b315ea)

</details>

### React Query DevTools

<details>
<summary>Show preview</summary>

![React Query Tool](https://github.com/user-attachments/assets/258e892d-3eaf-41f8-9fae-d7d2dcd6c39d)

</details>

### Route Tracker

<details>
<summary>Show preview</summary>

![Routes Tool](https://github.com/user-attachments/assets/90e55dc7-f8ab-423a-9770-84b9ff9c8446)

</details>

### Debug Borders

<details>
<summary>Show preview</summary>

![Debug Borders](https://github.com/user-attachments/assets/945fdb5d-2546-442d-98e7-ef73231abbba)

</details>

</details>

---

## 🚀 Choose Your Path

**👶 Just Starting?**

- Follow the [2-Minute Setup](#-2-minute-setup) above
- All tools work with zero config

**🔧 Need Validation?**

- See [Configuration](#-configuration) below for env var and storage validation

**🎨 Building Custom Tools?**

- Check out [Custom Tools](#-custom-tools) section

**📖 Want Deep Dive?**

- View [detailed package docs](#-package-details) (collapsed sections)

---

## ⚙️ Configuration

### Basic Usage (Zero Config)

```tsx
<FloatingDevTools environment="local" userRole="admin" />
```

That's all you need! But if you want validation...

### With Environment Variable Validation

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import type { EnvVarConfig } from "@react-buoy/core";

const requiredEnvVars: EnvVarConfig[] = [
  "API_URL", // Just check if exists
  { key: "DEBUG_MODE", expectedType: "boolean" },
  { key: "ENVIRONMENT", expectedValue: "development" },
];

<FloatingDevTools
  requiredEnvVars={requiredEnvVars}
  environment="local"
  userRole="admin"
/>;
```

### With Storage Key Validation

```tsx
import type { StorageKeyConfig } from "@react-buoy/core";

const requiredStorageKeys: StorageKeyConfig[] = [
  {
    key: "@app/session",
    expectedType: "string",
    description: "User session token",
    storageType: "async", // "async" | "mmkv" | "secure"
  },
];

<FloatingDevTools
  requiredStorageKeys={requiredStorageKeys}
  environment="local"
/>;
```

### Complete Example with React Query

```tsx
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FloatingDevTools } from "@react-buoy/core";
import type { EnvVarConfig, StorageKeyConfig } from "@react-buoy/core";

export default function App() {
  const queryClient = new QueryClient();

  const requiredEnvVars: EnvVarConfig[] = [
    "EXPO_PUBLIC_API_URL",
    { key: "EXPO_PUBLIC_DEBUG_MODE", expectedType: "boolean" },
  ];

  const requiredStorageKeys: StorageKeyConfig[] = [
    {
      key: "@app/session",
      expectedType: "string",
      storageType: "async",
    },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app content */}

      <FloatingDevTools
        requiredEnvVars={requiredEnvVars}
        requiredStorageKeys={requiredStorageKeys}
        environment="local"
        userRole="admin"
      />
    </QueryClientProvider>
  );
}
```

> 💡 **Note**: All types (`EnvVarConfig`, `StorageKeyConfig`, etc.) are exported from `@react-buoy/core`

---

## 🔧 How It Works

React Buoy uses **automatic package discovery**. When you render `<FloatingDevTools />`, it:

1. **Checks** which `@react-buoy/*` packages are installed
2. **Loads** only the installed packages (lazy + safe)
3. **Renders** them automatically in the floating menu

No registration, no imports, no config arrays. Just install and go.

**Behind the scenes**: The core package attempts to `require()` each plugin. If installed, it loads. If not, it silently skips. This means:

- ✅ Zero config for the 90% use case
- ✅ No crashes from missing packages
- ✅ Automatic updates when you install new tools

**Want full control?** You can still manually configure tools with the `apps` prop (see [Advanced Configuration](#advanced-configuration)).

---

## 🎨 Custom Tools

Any React component can be a dev tool! Perfect for:

- 🚀 Feature flag toggles
- 👤 User impersonation panels
- ✅ QA checklists
- 📊 Analytics dashboards
- 🗄️ Database browsers
- 📱 Push notification testers

### Basic Custom Tool

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import type { InstalledApp } from "@react-buoy/core";

// Your custom tool - just a React component
function FeatureFlagsModal({ onClose }) {
  return (
    <View style={{ padding: 20 }}>
      <Text>Feature Flags</Text>
      {/* Your UI here */}
      <Button title="Close" onPress={onClose} />
    </View>
  );
}

// Define the tool
const customTools: InstalledApp[] = [
  {
    id: "feature-flags",
    name: "FLAGS",
    description: "Toggle feature flags",
    slot: "both", // "row" | "dial" | "both"
    icon: ({ size }) => <YourIcon size={size} />,
    component: FeatureFlagsModal,
    props: {},
  },
];

// Add to FloatingDevTools
<FloatingDevTools
  apps={customTools} // Your custom tools
  environment="local"
/>;
```

> ✨ **Auto-discovery still works!** Custom tools merge with auto-discovered tools. Same ID = your custom tool overrides.

---

## 📚 Package Details

<details>
<summary><strong>🌍 Environment Inspector (@react-buoy/env)</strong></summary>

### What It Does

Visual health check for your app configuration. Validates environment variables, checks types, and warns about missing/incorrect values.

### Install

```bash
npm install @react-buoy/env
```

### Features

- ✅ Visual validation of required environment variables
- 🔍 Search and filter across all env vars
- 🎯 Type checking (string, number, boolean, object)
- ⚠️ Clear warnings for missing or incorrect values
- 📋 Copy values to clipboard

### Optional: Helper Functions for Better DX

```tsx
import { createEnvVarConfig, envVar } from "@react-buoy/env";
import type { EnvVarConfig } from "@react-buoy/core";

const requiredEnvVars: EnvVarConfig[] = createEnvVarConfig([
  envVar("API_URL").exists(),
  envVar("DEBUG_MODE").withType("boolean").build(),
  envVar("ENVIRONMENT").withValue("development").build(),
]);
```

</details>

<details>
<summary><strong>📡 Network Inspector (@react-buoy/network)</strong></summary>

### What It Does

Real-time network request monitoring with timeline view, detailed inspection, and performance stats.

### Install

```bash
npm install @react-buoy/network
```

### Features

- 📊 Timeline view of all network requests
- 🔍 Detailed request/response inspection with JSON viewer
- ⚡ Performance metrics and timing breakdown
- 🎛️ Filter by status, method, URL patterns
- 📋 Copy request details (curl, JSON, etc.)
- 🔴 Highlight failed requests

</details>

<details>
<summary><strong>💾 Storage Explorer (@react-buoy/storage)</strong></summary>

### What It Does

Real-time storage browser for AsyncStorage, MMKV, and SecureStore with live updates and bulk operations.

### Install

```bash
npm install @react-buoy/storage
npm install @react-native-async-storage/async-storage  # peer dependency
```

### Features

- 🗂️ Browse all AsyncStorage, MMKV, and SecureStore data
- ✏️ Edit storage values in real-time
- 🗑️ Bulk delete operations
- 🔍 Search and filter storage keys
- ⚠️ Validation for required storage keys
- 📋 Copy keys/values

### Supports Multiple Storage Types

- **AsyncStorage**: React Native standard
- **MMKV**: Encrypted, faster alternative
- **SecureStore**: iOS Keychain / Android Keystore

</details>

<details>
<summary><strong>⚡ React Query DevTools (@react-buoy/react-query)</strong></summary>

### What It Does

TanStack Query devtools adapted for mobile with query explorer, cache manipulation, and offline toggle.

### Install

```bash
npm install @react-buoy/react-query
npm install @tanstack/react-query  # peer dependency (v5+)
```

### Setup

Wrap your app with `QueryClientProvider`:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FloatingDevTools } from "@react-buoy/core";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app */}
      <FloatingDevTools environment="local" />
    </QueryClientProvider>
  );
}
```

### Features

- 🔍 Query explorer with real-time data
- 🗂️ Cache inspection and manipulation
- 📊 Query performance metrics
- 🔄 Manual query refetching and invalidation
- 📶 **WiFi Toggle** - Simulate offline mode
- 🎨 Query state visualization (loading, error, success)

</details>

<details>
<summary><strong>🧭 Route Events (@react-buoy/route-events)</strong></summary>

### What It Does

Comprehensive route tracking and visualization for Expo Router applications. Monitor route changes, explore your app's sitemap, and visualize the navigation stack.

### Install

```bash
npm install @react-buoy/route-events
npm install expo-router @react-navigation/native  # peer dependencies
```

### Features

- 🗺️ **Route Sitemap** - Browse all routes with search
- 📊 **Event Timeline** - Chronological route changes
- 🏗️ **Navigation Stack** - Real-time stack visualization
- 🔍 **Event Inspection** - Detailed params, segments, timing
- 🎯 **Filtering** - Filter by pathname patterns
- ⏱️ **Performance Metrics** - Navigation timing
- ✨ **Zero Config** - Auto-tracks when modal opens

### Bonus: Custom Analytics Hook

```tsx
import { useRouteObserver } from "@react-buoy/route-events";

export default function RootLayout() {
  useRouteObserver((event) => {
    analytics.trackPageView({
      path: event.pathname,
      params: event.params,
      timeSpent: event.timeSincePrevious,
    });
  });

  return <Stack />;
}
```

</details>

<details>
<summary><strong>🎨 Debug Borders (@react-buoy/debug-borders)</strong></summary>

### What It Does

Visual debugging tool that adds colored borders around all React Native components to identify layout issues and component boundaries.

### Install

```bash
npm install @react-buoy/debug-borders
```

### Features

- 🎨 Colored borders around all components
- 🎯 Instant layout debugging
- 🔍 Component nesting visualization
- 🎭 **Direct Toggle** - Tap icon to enable/disable
- 💚 **Visual Feedback** - Icon changes color (gray → green)
- ⚡ Zero performance impact when disabled

### Usage

**Zero Config (Recommended)**: Just install and it auto-appears as a "BORDERS" button in the floating menu.

**Standalone (without FloatingDevTools)**:

```tsx
import { DebugBordersStandaloneOverlay } from "@react-buoy/debug-borders";

function App() {
  return (
    <>
      {/* Your app */}
      <DebugBordersStandaloneOverlay />
    </>
  );
}
```

</details>

---

## 🏗️ Advanced Configuration

<details>
<summary>📚 Expand for advanced topics</summary>

### Manual Tool Configuration

Want to override auto-discovery with full control? Use factory functions:

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import { createEnvTool } from "@react-buoy/env";
import { createNetworkTool } from "@react-buoy/network";

const customTools = [
  createEnvTool({
    name: "ENVIRONMENT",  // Custom name
    iconColor: "#9333EA",  // Custom color
    requiredEnvVars: [...],
  }),
  createNetworkTool({
    name: "API MONITOR",
    iconColor: "#EC4899",
  }),
];

<FloatingDevTools
  apps={customTools}  // Overrides auto-discovery for these IDs
  environment="production"
/>
```

### Complete Manual Setup (No Auto-Discovery)

```tsx
import type { InstalledApp } from "@react-buoy/core";
import { EnvVarsModal } from "@react-buoy/env";
import { NetworkModal } from "@react-buoy/network";
import { EnvLaptopIcon, WifiCircuitIcon } from "@react-buoy/shared-ui";

const manualTools: InstalledApp[] = [
  {
    id: "env",
    name: "ENV",
    description: "Environment debugger",
    slot: "both",
    icon: ({ size }) => <EnvLaptopIcon size={size} colorPreset="green" noBackground />,
    component: EnvVarsModal,
    props: { requiredEnvVars: [...] },
  },
  {
    id: "network",
    name: "NET",
    description: "Network logger",
    slot: "both",
    icon: ({ size }) => <WifiCircuitIcon size={size} colorPreset="cyan" noBackground />,
    component: NetworkModal,
    props: {},
  },
];

<FloatingDevTools apps={manualTools} environment="local" />
```

### Slot Types

Control where tools appear:

```typescript
type AppSlot = "row" | "dial" | "both";
```

- **"row"**: Always-visible header (environment/role badges)
- **"dial"**: Floating expandable menu
- **"both"**: Available in both locations (default)

### Launch Modes

```typescript
type LaunchMode = "self-modal" | "host-modal" | "inline" | "toggle-only";
```

- **"self-modal"**: Tool manages its own modal (default for most)
- **"host-modal"**: Core manages the modal lifecycle
- **"inline"**: Renders inline (no modal)
- **"toggle-only"**: Just triggers an action (e.g., debug-borders)

</details>

---

## 🧩 Advanced Features

<details>
<summary><strong>JSON Viewer & Diff Tools</strong></summary>

All tools that display data (Network, Storage, React Query) use optimized JSON viewers:

### Tree View

Like Redux DevTools - explore nested objects with expand/collapse

### Side-by-Side Diff

Like VS Code - compare payloads visually

### Type Filtering

Quickly find what you need in large payloads:

- String values
- Numbers
- Booleans
- Null/undefined
- Objects
- Arrays
- Functions

**Example**: Debugging a 5MB API response → filter only booleans to check feature flags, or search undefined keys to spot missing data.

</details>

<details>
<summary><strong>State Persistence</strong></summary>

React Buoy remembers:

- Which tools are open
- Tool positions (if dragged)
- User preferences

**Storage Key**: `@apphost_open_apps`

This means your debugging session survives:

- ✅ Hot reloads
- ✅ App restarts
- ✅ Crash recovery

</details>

<details>
<summary><strong>Production Usage</strong></summary>

React Buoy is **production-safe** with proper access controls:

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import { useUser } from "./auth";

function App() {
  const user = useUser();
  const showDevTools = user.role === "admin" || __DEV__;

  return (
    <>
      {/* Your app */}
      {showDevTools && (
        <FloatingDevTools
          environment={process.env.ENVIRONMENT}
          userRole={user.role}
        />
      )}
    </>
  );
}
```

**Recommendation**: Gate with your existing authentication/authorization system.

</details>

---

## 🆚 Why React Buoy?

### vs. Reactotron

- ✅ Zero config (Reactotron requires manual command registration)
- ✅ In-app UI (Reactotron requires external app)
- ✅ Production-safe with auth (Reactotron is dev-only)
- ✅ Plugin architecture (install packages = auto-appear)

### vs. Flipper

- ✅ Zero setup (Flipper requires native config + desktop app)
- ✅ Works on physical devices out-of-the-box
- ✅ Lightweight (Flipper is heavy)
- ✅ Team-friendly (no desktop app to install)

### vs. react-native-debugger

- ✅ Modern (supports Hermes, new architecture)
- ✅ In-app (no external tools)
- ✅ Extensible (custom tools as React components)
- ✅ Production-ready

---

## 🤝 Real-World Use Case

**Scenario**: Debugging a payment flow issue in staging

1. **Environment badge** shows you're in staging (not prod!)
2. **Role badge** confirms you're logged in as "QA"
3. Tap **Network** to watch API calls in real-time
4. Open **Storage** to see what's persisted locally
5. Check **React Query** to inspect cached payment data
6. Use **Routes** to see the navigation flow
7. Launch your custom **Payment Debug** tool

All from one floating menu that follows you through every screen.

---

## 📝 License

MIT © React Buoy Team

---

## 🚀 Learn More

**Resources**:

- [Example App](./example) - Full working example with all packages
- [Package Source](./packages) - Individual package source code
- [Changelog](./CHANGELOG.md) - Version history

**Contributing**:

- Report bugs: [GitHub Issues](https://github.com/yourusername/react-buoy/issues)
- Feature requests welcome!

---

## 💙 Credits

Big thanks to [galaxies.dev](https://galaxies.dev) — their content helped me get up to speed with React Native early on, and I strongly recommend it as a resource for anyone making the jump from web to mobile.

<a href="https://galaxies.dev">
  <img src="https://github.com/Galaxies-dev/react-native-ecommerce/blob/main/banner.png?raw=true" width="100%" />
</a>
