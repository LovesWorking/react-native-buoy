# React Buoy Devtools

**The floating control panel for your entire mobile app team.**

A persistent, draggable menu that’s always available—showing your current environment and role, while giving instant access to the tools anyone in your org needs. From impersonating users in production for customer support, to debugging storage, network, or cache issues across environments, to testing feature flags or building entirely custom workflows—React Buoy makes it easy to create and share powerful tools with your whole team.

![devtools](https://github.com/user-attachments/assets/a732d6a3-9963-49e3-b0f1-0d974a0a74d7)

## ✨ Features

- **Always visible** – Shows environment & user role in a draggable row that survives reloads
- **Consistent everywhere** – Same tools in dev, staging, and production
- **Bring your own tools** – Drop in any React component as a tool
- **Team-friendly** – Each engineer can show/hide the tools they need
- **Smart interactions** – Double-tap to switch between bottom sheet and floating modal, triple-tap to close, swipe down to dismiss

## 🧩 JSON Viewer & Diff

React Buoy includes optimized JSON viewers and comparison tools:

- **Tree view** – Like Redux DevTools for exploring nested objects
- **Side-by-side diff view** – Like VS Code for comparing payloads
- **Type filtering** – Quickly find exactly what you need in large payloads:
  - string
  - number
  - boolean
  - undefined
  - null
  - object
  - array
  - function

Example: debugging a large response payload → filter only booleans to check feature flags, or search for undefined keys to spot missing data instantly.

## 🚀 Step 1: Basic Setup (2 minutes)

Get the floating menu working in your app with just the core functionality.

### Install Core Package

**npm**

```bash
npm install @react-buoy/core
```

**pnpm**

```bash
pnpm add @react-buoy/core
```

**yarn**

```bash
yarn add @react-buoy/core
```

**bun**

```bash
bun add @react-buoy/core
```

### Add to Your App

**Option 1: Zero-Config Auto-Discovery (Simplest!)**

Just install the dev tool packages you want, and they'll automatically load:

```tsx
import { FloatingDevTools } from "@react-buoy/core";

function App() {
  return (
    <>
      {/* Your existing app content */}
      <FloatingDevTools environment="local" userRole="admin" />
    </>
  );
}
```

**That's it!** All installed dev tool packages will automatically appear in your floating menu. No configuration, no imports, just install and go!

**Option 2: With Custom Config (When You Need Validation)**

Customize specific tools while auto-discovering the rest:

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import type { EnvVarConfig } from "@react-buoy/core";
import type { StorageKeyConfig } from "@react-buoy/core";

const requiredEnvVars: EnvVarConfig[] = [
  "API_URL", // Just check if exists
  { key: "DEBUG_MODE", expectedType: "boolean" },
];

const requiredStorageKeys: StorageKeyConfig[] = [
  {
    key: "@app/session",
    expectedType: "string",
    storageType: "async",
  },
];

function App() {
  return (
    <>
      {/* Your existing app content */}
      <FloatingDevTools
        requiredEnvVars={requiredEnvVars}
        requiredStorageKeys={requiredStorageKeys}
        environment="local"
        userRole="admin"
      />
    </>
  );
}
```

**Note:** Core types come from `@react-buoy/core`. Individual package types like `Environment` and `UserRole` come from their respective packages (e.g., `@react-buoy/env`).

---

## 📦 Available Packages

Add any combination of these developer tools to your floating menu:

<details>
<summary><strong>🌍 Environment Inspector (@react-buoy/env)</strong></summary>

Visual health check for your app configuration. See all environment variables with validation, search, and filtering.

![env1](https://github.com/user-attachments/assets/75651046-33a0-4257-9011-3bcc4818a964)

### Install

**npm**

```bash
npm install @react-buoy/env
```

**pnpm**

```bash
pnpm add @react-buoy/env
```

**yarn**

```bash
yarn add @react-buoy/env
```

**bun**

```bash
bun add @react-buoy/env
```

**That's it!** Once installed, the ENV tool automatically appears in your FloatingDevTools. No imports, no configuration needed.

### Add Custom Validation (Optional)

Want to validate specific environment variables? Pass them directly to `FloatingDevTools`:

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import type { EnvVarConfig } from "@react-buoy/core";

const requiredEnvVars: EnvVarConfig[] = [
  "API_URL", // Just check if exists
  { key: "DEBUG_MODE", expectedType: "boolean" },
  { key: "ENVIRONMENT", expectedValue: "development" },
];

function App() {
  return (
    <FloatingDevTools requiredEnvVars={requiredEnvVars} environment="local" />
  );
}
```

**Using helper functions for better DX:**

```tsx
import { createEnvVarConfig, envVar } from "@react-buoy/env";
import type { EnvVarConfig } from "@react-buoy/core";

const requiredEnvVars: EnvVarConfig[] = createEnvVarConfig([
  envVar("API_URL").exists(),
  envVar("DEBUG_MODE").withType("boolean").build(),
  envVar("ENVIRONMENT").withValue("development").build(),
]);
```

### What you get:

- ✅ Visual validation of required environment variables
- 🔍 Search and filter environment variables
- 🎯 Type checking (string, number, boolean, object)
- ⚠️ Clear warnings for missing or incorrect values

</details>

<details>
<summary><strong>📡 Network Inspector (@react-buoy/network)</strong></summary>

Real-time network request monitoring with timeline view, detailed inspection, and performance stats.

![net1](https://github.com/user-attachments/assets/473ddf83-03cd-4bd1-8dc3-0f66eda9fa8a)

### Install

**npm**

```bash
npm install @react-buoy/network
```

**pnpm**

```bash
pnpm add @react-buoy/network
```

**yarn**

```bash
yarn add @react-buoy/network
```

**bun**

```bash
bun add @react-buoy/network
```

**That's it!** Once installed, the Network tool automatically appears in your FloatingDevTools. No imports, no configuration needed.

### What you get:

- 📊 Timeline view of all network requests
- 🔍 Detailed request/response inspection
- ⚡ Performance metrics and timing
- 🎛️ Request filtering and search
- 📋 Copy request details for debugging

</details>

<details>
<summary><strong>💾 Storage Explorer (@react-buoy/storage)</strong></summary>

Real-time AsyncStorage browser with live updates, bulk operations, and storage validation.

![stor1](https://github.com/user-attachments/assets/80ef1c60-d20c-4d8b-97e6-f37b21b315ea)

### Install

**npm**

```bash
npm install @react-buoy/storage
npm install @react-native-async-storage/async-storage  # peer dependency
```

**pnpm**

```bash
pnpm add @react-buoy/storage
pnpm add @react-native-async-storage/async-storage  # peer dependency
```

**yarn**

```bash
yarn add @react-buoy/storage
yarn add @react-native-async-storage/async-storage  # peer dependency
```

**bun**

```bash
bun add @react-buoy/storage
bun add @react-native-async-storage/async-storage  # peer dependency
```

**That's it!** Once installed, the Storage tool automatically appears in your FloatingDevTools. No imports, no configuration needed.

### Add Custom Validation (Optional)

Want to validate specific storage keys? Pass them directly to `FloatingDevTools`:

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import type { StorageKeyConfig } from "@react-buoy/core";

const requiredStorageKeys: StorageKeyConfig[] = [
  {
    key: "@app/session",
    expectedType: "string",
    description: "User session token",
    storageType: "async",
  },
  {
    key: "@app/settings:theme",
    expectedValue: "dark",
    storageType: "mmkv",
  },
];

function App() {
  return (
    <FloatingDevTools
      requiredStorageKeys={requiredStorageKeys}
      environment="local"
    />
  );
}
```

### What you get:

- 🗂️ Browse all AsyncStorage, SecureStore, and MMKV data
- ✏️ Edit storage values in real-time
- 🗑️ Bulk delete operations
- 🔍 Search and filter storage keys
- ⚠️ Validation for required storage keys

</details>

<details>
<summary><strong>⚡ React Query DevTools (@react-buoy/react-query)</strong></summary>

TanStack Query devtools adapted for mobile with query explorer, cache manipulation, and offline toggle.

![rq1](https://github.com/user-attachments/assets/258e892d-3eaf-41f8-9fae-d7d2dcd6c39d)

### Install

**npm**

```bash
npm install @react-buoy/react-query
npm install @tanstack/react-query  # peer dependency
```

**pnpm**

```bash
pnpm add @react-buoy/react-query
pnpm add @tanstack/react-query  # peer dependency
```

**yarn**

```bash
yarn add @react-buoy/react-query
yarn add @tanstack/react-query  # peer dependency
```

**bun**

```bash
bun add @react-buoy/react-query
bun add @tanstack/react-query  # peer dependency
```

### Setup QueryClient

Wrap your app with QueryClientProvider:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FloatingDevTools } from "@react-buoy/core";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* Your app content */}
      <FloatingDevTools environment="local" />
    </QueryClientProvider>
  );
}
```

**That's it!** Once installed, both React Query DevTools and WiFi Toggle automatically appear in your FloatingDevTools. No imports, no configuration needed.

### What you get:

- 🔍 Query explorer with real-time data
- 🗂️ Cache manipulation and inspection
- 📊 Query performance metrics
- 🔄 Manual query refetching
- 📶 **WiFi Toggle** - Simulate offline mode to test error handling and retry logic

</details>

<details>
<summary><strong>🧭 Route Events (@react-buoy/route-events)</strong></summary>

Comprehensive route tracking and visualization for Expo Router applications. Monitor route changes, explore your app's sitemap, and visualize the navigation stack in real-time.

![routes](https://github.com/user-attachments/assets/90e55dc7-f8ab-423a-9770-84b9ff9c8446)


**Zero Configuration Required** - Just add the component and everything works automatically!

### Install

**npm**

```bash
npm install @react-buoy/route-events
npm install expo-router @react-navigation/native  # peer dependencies
```

**pnpm**

```bash
pnpm add @react-buoy/route-events
pnpm add expo-router @react-navigation/native  # peer dependencies
```

**yarn**

```bash
yarn add @react-buoy/route-events
yarn add expo-router @react-navigation/native  # peer dependencies
```

**bun**

```bash
bun add @react-buoy/route-events
bun add expo-router @react-navigation/native  # peer dependencies
```

**That's it!** Once installed, the Route Events tool automatically appears in your FloatingDevTools. No imports, no configuration needed - route tracking starts automatically!

### What you get:

- 🗺️ **Route Sitemap** - Browse all routes in your app with search and navigation
- 📊 **Event Timeline** - View chronological timeline of all route changes
- 🏗️ **Navigation Stack** - Real-time visualization of the navigation stack
- 🔍 **Event Inspection** - Detailed view of route params, segments, and timing
- 🎯 **Filtering** - Filter events by pathname patterns
- 📋 **Copy Support** - Copy route data for debugging
- ⏱️ **Performance Metrics** - Track navigation timing and performance
- ✨ **Zero Config** - Route tracking starts automatically when you open the modal

</details>

<details>
<summary><strong>🎨 Debug Borders (@react-buoy/debug-borders)</strong></summary>


Visual debugging tool that adds colored borders around all React Native components to help identify layout issues, nesting problems, and component boundaries.

![border s](https://github.com/user-attachments/assets/945fdb5d-2546-442d-98e7-ef73231abbba)


### Install

**npm**

```bash
npm install @react-buoy/debug-borders
```

**pnpm**

```bash
pnpm add @react-buoy/debug-borders
```

**yarn**

```bash
yarn add @react-buoy/debug-borders
```

**bun**

```bash
bun add @react-buoy/debug-borders
```

### Quick Setup

**Zero Configuration - Auto-Discovery (Recommended)**

Just install the package and it automatically integrates with FloatingDevTools:

```tsx
import { FloatingDevTools } from "@react-buoy/core";

function App() {
  return <FloatingDevTools environment="local" userRole="admin" />;
}
```

**That's it!** Debug borders will automatically:

- ✅ Appear as a "BORDERS" button in the dial and floating menu
- ✅ Tap the icon to toggle borders on/off (no modal!)
- ✅ Icon changes color: gray when off, green when on
- ✅ Overlay automatically renders when package is installed

**Alternative: Standalone (without FloatingDevTools)**

If you want to use debug borders without the full FloatingDevTools:

```tsx
import { DebugBordersStandaloneOverlay } from "@react-buoy/debug-borders";

function App() {
  return (
    <>
      {/* Your app content */}
      <DebugBordersStandaloneOverlay />
    </>
  );
}
```

### What you get:

- 🎨 **Visual Borders** - Colored borders around all components
- 🎯 **Layout Debugging** - Identify component boundaries instantly
- 🔍 **Nesting Visualization** - See component hierarchy visually
- 🎭 **Direct Toggle** - Tap the icon to toggle on/off (no modal needed!)
- 💚 **Visual Feedback** - Icon changes from gray (off) to green (on)
- ⚡ **Zero Performance Impact** - Only active when enabled

### Controls:

- **Tap to Toggle** - Click the BORDERS icon in dial/floating menu to toggle on/off
- **No Modal** - Direct toggle action, no popup needed
- **Visual State** - Icon color shows current state (gray = off, green = on)
- Automatically integrated with FloatingDevTools when installed
- Overlay renders automatically when enabled
- Can be used standalone if needed

</details>

<details>
<summary><strong>Dev Tool Settings Menu</strong></summary>

###

![set](https://github.com/user-attachments/assets/f8033982-e802-48f8-bd07-824121d557a2)

</details>

---

## 🔥 Complete Example

Here's a full working example with all packages using the simplest setup (same as our [example app](./example/app/_layout.tsx)):

<details>
<summary><strong>Click to see the complete setup - everything from @react-buoy/core!</strong></summary>

```tsx
import React, { useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FloatingDevTools } from "@react-buoy/core";
import type { EnvVarConfig, StorageKeyConfig } from "@react-buoy/core";
import type { Environment, UserRole } from "@react-buoy/env";

export default function App() {
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({});
  }

  const requiredEnvVars: EnvVarConfig[] = [
    "EXPO_PUBLIC_API_URL",
    { key: "EXPO_PUBLIC_DEBUG_MODE", expectedType: "boolean" },
    { key: "EXPO_PUBLIC_ENVIRONMENT", expectedValue: "development" },
  ];

  const requiredStorageKeys: StorageKeyConfig[] = [
    {
      key: "@app/session",
      expectedType: "string",
      description: "Current user session token",
      storageType: "async",
    },
    {
      key: "@app/settings:theme",
      expectedValue: "dark",
      description: "Preferred theme",
      storageType: "async",
    },
  ];

  const environment: Environment = "local";
  const userRole: UserRole = "admin";

  return (
    <QueryClientProvider client={queryClientRef.current!}>
      <YourAppContent />

      <FloatingDevTools
        requiredEnvVars={requiredEnvVars}
        requiredStorageKeys={requiredStorageKeys}
        environment={environment}
        userRole={userRole}
      />
    </QueryClientProvider>
  );
}
```

**That's it!** Just ~40 lines of setup for all dev tools (ENV, Network, Storage, React Query, Routes, and Debug Borders), all imported from `@react-buoy/core`! ✨

</details>

<details>
<summary><strong>Alternative: Manual setup (more control)</strong></summary>

If you need full control, you can configure each tool manually:

```tsx
import React, { useMemo, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FloatingDevTools, type InstalledApp } from "@react-buoy/core";
import { EnvVarsModal, createEnvVarConfig, envVar } from "@react-buoy/env";
import { NetworkModal } from "@react-buoy/network";
import { StorageModalWithTabs } from "@react-buoy/storage";
import { ReactQueryDevToolsModal } from "@react-buoy/react-query";
import { RouteEventsModalWithTabs } from "@react-buoy/route-events";
import {
  EnvLaptopIcon,
  ReactQueryIcon,
  StorageStackIcon,
  WifiCircuitIcon,
  RouteMapIcon,
} from "@react-buoy/shared-ui";

export default function App() {
  // Setup QueryClient
  const queryClientRef = useRef<QueryClient | null>(null);
  if (!queryClientRef.current) {
    queryClientRef.current = new QueryClient({});
  }

  // Configure environment variables to validate
  const requiredEnvVars = createEnvVarConfig([
    envVar("EXPO_PUBLIC_API_URL").exists(),
    envVar("EXPO_PUBLIC_DEBUG_MODE").withType("boolean").build(),
    envVar("EXPO_PUBLIC_ENVIRONMENT").withValue("development").build(),
  ]);

  // Configure storage keys to monitor
  const requiredStorageKeys = useMemo(
    () => [
      {
        key: "@app/session",
        expectedType: "string",
        description: "Current user session token",
        storageType: "async",
      },
      {
        key: "@app/settings:theme",
        expectedValue: "dark",
        description: "Preferred theme",
        storageType: "async",
      },
    ],
    []
  );

  // Configure all development tools manually
  const installedApps: InstalledApp[] = useMemo(
    () => [
      {
        id: "env",
        name: "ENV",
        description: "Environment variables debugger",
        slot: "both",
        icon: ({ size }) => (
          <EnvLaptopIcon size={size} colorPreset="green" noBackground />
        ),
        component: EnvVarsModal,
        props: { requiredEnvVars },
      },
      {
        id: "network",
        name: "NET",
        description: "Network request logger",
        slot: "both",
        icon: ({ size }) => (
          <WifiCircuitIcon
            size={size}
            colorPreset="cyan"
            strength={4}
            noBackground
          />
        ),
        component: NetworkModal,
        props: {},
      },
      {
        id: "storage",
        name: "STORAGE",
        description: "AsyncStorage browser",
        slot: "both",
        icon: ({ size }) => (
          <StorageStackIcon size={size} colorPreset="green" noBackground />
        ),
        component: StorageModalWithTabs,
        props: { requiredStorageKeys },
      },
      {
        id: "query",
        name: "QUERY",
        description: "React Query inspector",
        slot: "both",
        icon: ({ size }) => (
          <ReactQueryIcon size={size} colorPreset="red" noBackground />
        ),
        component: ReactQueryDevToolsModal,
        props: {},
      },
      {
        id: "route-events",
        name: "ROUTES",
        description: "Route tracking & navigation inspector",
        slot: "both",
        icon: ({ size }) => (
          <RouteMapIcon size={size} colorPreset="orange" noBackground />
        ),
        component: RouteEventsModalWithTabs,
        props: {},
      },
    ],
    [requiredEnvVars, requiredStorageKeys]
  );

  return (
    <QueryClientProvider client={queryClientRef.current!}>
      {/* Your existing app content */}
      <YourAppContent />

      {/* The floating menu with all tools */}
      <FloatingDevTools
        apps={installedApps}
        actions={{}}
        environment="local"
        userRole="admin"
      />
    </QueryClientProvider>
  );
}
```

</details>

---

## 🚀 Zero-Config Auto-Discovery

**The absolute simplest way to use React Buoy** - just install the packages you want, and they'll automatically load!

### How It Works

The core package automatically discovers and loads any installed dev tool packages. No configuration needed!

```tsx
import { FloatingDevTools } from "@react-buoy/core";

function App() {
  return <FloatingDevTools environment="local" userRole="admin" />;
}
```

**What happens:**

1. `FloatingDevTools` automatically checks if dev tool packages are installed
2. If installed, automatically imports and loads the preset
3. If not installed, silently skips it
4. All discovered tools appear in your menu automatically!

### Installing Tools

Just install the packages you want to use:

```bash
# Install only what you need
pnpm add @react-buoy/env @react-buoy/network @react-buoy/react-query

# Or install everything
pnpm add @react-buoy/env @react-buoy/network @react-buoy/storage @react-buoy/react-query @react-buoy/route-events @react-buoy/debug-borders
```

All installed packages will automatically appear in your dev tools. No imports, no configuration!

### Combining Auto-Discovery with Custom Config

Need to customize some tools? Just pass validation configs as props:

```tsx
import {
  FloatingDevTools,
  type EnvVarConfig,
  type StorageKeyConfig,
} from "@react-buoy/core";

function App() {
  const requiredEnvVars: EnvVarConfig[] = [
    "API_URL",
    { key: "DEBUG_MODE", expectedType: "boolean" },
  ];

  const requiredStorageKeys: StorageKeyConfig[] = [
    {
      key: "@app/session",
      expectedType: "string",
      storageType: "async",
    },
  ];

  return (
    <FloatingDevTools
      requiredEnvVars={requiredEnvVars}
      requiredStorageKeys={requiredStorageKeys}
      environment="local"
      userRole="admin"
    />
  );
}
```

**Benefits:**

- ✅ No `apps` array needed for validation
- ✅ Direct props for env vars and storage keys
- ✅ Everything else loads automatically
- ✅ Custom configs override auto-discovered presets
- ✅ Everything imports from `@react-buoy/core`

### Using Helper Functions for Environment Variables

The `@react-buoy/env` package provides helper functions to make defining environment variable configurations more ergonomic:

```tsx
import { FloatingDevTools, type EnvVarConfig } from "@react-buoy/core";
import { createEnvVarConfig, envVar } from "@react-buoy/env";

function App() {
  // Using helper functions for better DX
  const requiredEnvVars: EnvVarConfig[] = createEnvVarConfig([
    envVar("EXPO_PUBLIC_API_URL").exists(),
    envVar("EXPO_PUBLIC_DEBUG_MODE").withType("boolean").build(),
    envVar("EXPO_PUBLIC_ENVIRONMENT").withValue("development").build(),
  ]);

  return (
    <FloatingDevTools requiredEnvVars={requiredEnvVars} environment="local" />
  );
}
```

**Helper Function API:**

```tsx
// Just check if it exists
envVar("API_URL").exists();

// Check for specific type
envVar("DEBUG_MODE").withType("boolean").build();

// Check for specific value
envVar("ENVIRONMENT").withValue("production").build();

// Add description
envVar("API_URL").withType("string").withDescription("Backend API").build();
```

**Note:** `createEnvVarConfig()` returns `RequiredEnvVar[]` which is fully compatible with `EnvVarConfig[]` from `@react-buoy/core`. You can use either the helper functions or the object syntax shown in previous examples.

### When to Use Each Approach

| Approach                                | Best For                                     |
| --------------------------------------- | -------------------------------------------- |
| No config props                         | Zero config - just install and go!           |
| `requiredEnvVars`/`requiredStorageKeys` | Need validation for env vars or storage      |
| `apps` array                            | Custom tools or overriding built-in behavior |

---

## ⚙️ Customizing Dev Tools

All dev tool presets can be customized. With auto-discovery, you only need to configure what you want to customize - everything else loads automatically!

### Direct Customization (Recommended)

Use direct props on `FloatingDevTools` for the most common customizations:

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import type { EnvVarConfig, StorageKeyConfig } from "@react-buoy/core";
import { createEnvVarConfig, envVar } from "@react-buoy/env";

// Validate environment variables
const requiredEnvVars: EnvVarConfig[] = createEnvVarConfig([
  envVar("API_URL").exists(),
  envVar("DEBUG_MODE").withType("boolean").build(),
  envVar("NODE_ENV").withValue("production").build(),
]);

// Validate storage keys
const requiredStorageKeys: StorageKeyConfig[] = [
  {
    key: "@app/session",
    expectedType: "string",
    description: "User session",
    storageType: "async",
  },
];

function App() {
  return (
    <FloatingDevTools
      requiredEnvVars={requiredEnvVars}
      requiredStorageKeys={requiredStorageKeys}
      environment="production"
      userRole="admin"
    />
  );
}
```

**That's it!** All other tools (Network, React Query, Routes, Debug Borders) load automatically without any configuration.

### Advanced: Custom Tool Configuration

Need to customize tool names, colors, or behavior? Use factory functions with the `apps` prop:

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import {
  createEnvTool,
  createNetworkTool,
  createStorageTool,
  createReactQueryTool,
  createRouteEventsTool,
} from "@react-buoy/...";

const customTools = [
  createEnvTool({
    name: "ENVIRONMENT",
    iconColor: "#9333EA",
  }),
  createNetworkTool({
    name: "API CALLS",
    iconColor: "#EC4899",
  }),
  createStorageTool({
    name: "DATA",
    iconColor: "#06B6D4",
  }),
];

function App() {
  return (
    <FloatingDevTools
      apps={customTools} // Custom tools override auto-discovered ones
      environment="production"
    />
  );
}
```

**Note:** Custom tools in `apps` override auto-discovered presets with the same ID. Tools not customized still load automatically!

If you need complete control, configure tools manually:

```tsx
import { EnvVarsModal } from "@react-buoy/env";
import { NetworkModal } from "@react-buoy/network";
import { StorageModalWithTabs } from "@react-buoy/storage";
import { ReactQueryDevToolsModal } from "@react-buoy/react-query";
import { RouteEventsModalWithTabs } from "@react-buoy/route-events";
import {
  EnvLaptopIcon,
  WifiCircuitIcon,
  StorageStackIcon,
  ReactQueryIcon,
  RouteMapIcon,
} from "@react-buoy/shared-ui";

const TOOLS = [
  {
    id: "env",
    name: "ENV",
    description: "Environment variables debugger",
    slot: "both",
    icon: ({ size }) => (
      <EnvLaptopIcon size={size} colorPreset="green" noBackground />
    ),
    component: EnvVarsModal,
    props: { requiredEnvVars },
  },
  {
    id: "network",
    name: "NET",
    description: "Network request logger",
    slot: "both",
    icon: ({ size }) => (
      <WifiCircuitIcon
        size={size}
        colorPreset="cyan"
        strength={4}
        noBackground
      />
    ),
    component: NetworkModal,
    props: {},
  },
  // ... more tools
];
```

### Advanced: Custom Analytics for Routes

If you need custom analytics tracking for routes:

```tsx
import { useRouteObserver } from "@react-buoy/route-events";

export default function RootLayout() {
  useRouteObserver((event) => {
    analytics.trackPageView({
      path: event.pathname,
      params: event.params,
      previousPath: event.previousPathname,
      timeSpent: event.timeSincePrevious,
    });
  });

  return <Stack />;
}
```

---

## 🛠️ Build Your Own Tools

Any React component can be a development tool. Perfect for:

- 👨‍💼 Admin dashboards
- 🎚️ Feature flag toggles
- 👤 User impersonation
- ✅ QA checklists
- 🌐 GraphQL explorers
- 🗄️ Database browsers
- 📱 Push notification testing
- 📊 Analytics dashboards

```tsx
// Your custom tool - just a React component
function MyCustomTool({ onClose }) {
  return (
    <View style={{ padding: 20 }}>
      <Text>My Custom Development Tool 🚀</Text>
      {/* Your custom UI here */}
      <Button title="Close" onPress={onClose} />
    </View>
  );
}

// Add it to the floating menu
const TOOLS = [
  {
    id: "custom",
    name: "CUSTOM",
    description: "My custom development tool",
    slot: "both", // Show in row AND dial
    icon: ({ size }) => <YourIcon size={size} />,
    component: MyCustomTool,
    props: {}, // Any props your component needs
  },
];
```

## 🎯 Why Teams Love It

### 🏷️ **No More Environment Confusion**

Your current environment and role are always visible. No more "wait, am I in prod?" moments.

### 🔄 **Survives Everything**

Hot reload? Crash recovery? The tools persist through it all. Positions are remembered.

### 👥 **Team Consistency**

Every engineer sees the same tools in every environment. Onboard new devs in minutes.

### 🎨 **Actually Pleasant to Use**

Beautiful, responsive, and intuitive. Your team will _want_ to use these tools.

### 🏢 **Production-Safe**

Ship it to production—just add your own access controls!

## 📱 Real-World Debugging Example

Imagine debugging a payment flow issue:

1. **Environment badge** shows you're in staging (not prod! 😅)
2. **Role badge** confirms you're logged in as "Admin"
3. Tap **Network** to watch API calls in real-time
4. Open **Storage** to see what's persisted locally
5. Check **React Query** to inspect cached data
6. Launch your custom **Payment Debug** tool

All from one floating menu that follows you through every screen.

## 📄 License

MIT © React Buoy Team

## 🚀 More

**Take a shortcut from web developer to mobile development fluency with guided learning**

Big thanks to [galaxies.dev](https://galaxies.dev) — their content helped me get up to speed with React Native early on, and I strongly recommend it as a resource for anyone making the jump from web to mobile.

<a href="https://galaxies.dev">
  <img src="https://github.com/Galaxies-dev/react-native-ecommerce/blob/main/banner.png?raw=true" width="100%" />
</a>
