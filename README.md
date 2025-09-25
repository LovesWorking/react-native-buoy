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

```tsx
import { FloatingDevTools } from "@react-buoy/core";

function App() {
  return (
    <>
      {/* Your existing app content */}
      <FloatingDevTools
        apps={[]}
        actions={{}}
        environment="local"
        userRole="admin"
      />
    </>
  );
}
```

**That's it!** You now have a floating menu showing "local" environment and "admin" user role. The menu is draggable and will persist its position.

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

### Import & Use

```tsx
import { EnvVarsModal, createEnvVarConfig, envVar } from "@react-buoy/env";
import { EnvLaptopIcon } from "@react-buoy/shared-ui";

// Define your required environment variables
const requiredEnvVars = createEnvVarConfig([
  // Basic existence check
  envVar("API_URL").exists(),

  // Type validation
  envVar("DEBUG_MODE").withType("boolean").build(),
  envVar("PORT").withType("number").build(),
  envVar("FEATURE_FLAGS").withType("object").build(),

  // Specific value validation
  envVar("NODE_ENV").withValue("development").build(),

  // Combined validations with descriptions
  envVar("DATABASE_URL")
    .exists()
    .withDescription("PostgreSQL connection string")
    .build(),

  envVar("MAX_RETRIES")
    .withType("number")
    .withDescription("Maximum API retry attempts")
    .build(),
]);

// Add to your apps array
const TOOLS = [
  {
    id: "env",
    name: "ENV",
    description: "Environment variables debugger",
    slot: "both",
    icon: ({ size }) => <EnvLaptopIcon size={size} color="#9f6" />,
    component: EnvVarsModal,
    props: {
      requiredEnvVars,
    },
  },
];
```

### API Reference

#### `envVar(key: string)`

Creates an environment variable validation rule.

**Methods:**

- `.exists()` - Validates the environment variable exists (not undefined/empty)
- `.withType(type)` - Validates the variable type (`"string"` | `"number"` | `"boolean"` | `"object"`)
- `.withValue(expectedValue)` - Validates the variable has a specific value
- `.withDescription(description)` - Adds a description shown in the UI
- `.build()` - Finalizes the validation rule (required for chained methods)

**Examples:**

```tsx
// Just check if it exists
envVar("API_URL").exists();

// Type validation
envVar("PORT").withType("number").build();

// Exact value check
envVar("NODE_ENV").withValue("production").build();

// Combined validation
envVar("ENABLE_ANALYTICS")
  .withType("boolean")
  .withDescription("Controls analytics tracking")
  .build();
```

#### `createEnvVarConfig(rules: EnvVarRule[])`

Creates a configuration object from environment variable rules.

```tsx
const config = createEnvVarConfig([
  envVar("API_URL").exists(),
  envVar("DEBUG").withType("boolean").build(),
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

### Import & Use

```tsx
import { NetworkModal } from "@react-buoy/network";
import { Globe } from "@react-buoy/shared-ui";

// Add to your apps array
const TOOLS = [
  {
    id: "network",
    name: "NETWORK",
    description: "Network request logger",
    slot: "both",
    icon: ({ size }) => <Globe size={size} color="#38bdf8" />,
    component: NetworkModal,
    props: {},
  },
];
```

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

### Import & Use

```tsx
import { StorageModalWithTabs } from "@react-buoy/storage";
import { StorageStackIcon } from "@react-buoy/shared-ui";

// Define storage keys to monitor and validate
const requiredStorageKeys = [
  // Basic key monitoring
  {
    key: "@app/session",
    description: "Current user session token",
    storageType: "async",
  },

  // Type validation
  {
    key: "@app/settings",
    expectedType: "object",
    description: "User preferences and settings",
    storageType: "async",
  },

  // Exact value validation
  {
    key: "@app/theme",
    expectedValue: "dark",
    description: "Application theme preference",
    storageType: "mmkv",
  },

  // SecureStore keys
  {
    key: "biometric_token",
    expectedType: "string",
    description: "Encrypted biometric authentication token",
    storageType: "secure",
  },

  // Multiple storage types
  {
    key: "@analytics/user_id",
    expectedType: "string",
    description: "Anonymous user identifier for analytics",
    storageType: "async",
  },
];

// Add to your apps array
const TOOLS = [
  {
    id: "storage",
    name: "STORAGE",
    description: "AsyncStorage browser",
    slot: "both",
    icon: ({ size }) => <StorageStackIcon size={size} color="#38f8a7" />,
    component: StorageModalWithTabs,
    props: {
      requiredStorageKeys, // optional
    },
  },
];
```

### API Reference

#### `RequiredStorageKey` Configuration

Each storage key configuration object supports the following properties:

**Required:**

- `key: string` - The storage key to monitor (e.g., "@app/session")
- `storageType: "async" | "secure" | "mmkv"` - Which storage system to check

**Optional Validation:**

- `expectedType: "string" | "number" | "boolean" | "object"` - Validates the stored value type
- `expectedValue: any` - Validates the stored value matches exactly
- `description: string` - Human-readable description shown in the UI

**Examples:**

```tsx
// Type validation
{
  key: "@app/settings",
  expectedType: "object",
  description: "User app settings",
  storageType: "async",
}

// Exact value validation
{
  key: "@app/theme",
  expectedValue: "dark",
  description: "App theme (should be dark)",
  storageType: "mmkv",
}

// SecureStore monitoring
{
  key: "auth_token",
  expectedType: "string",
  description: "JWT authentication token",
  storageType: "secure",
}
```

#### Storage Types

- **`"async"`** - React Native AsyncStorage
- **`"secure"`** - Expo SecureStore (encrypted)
- **`"mmkv"`** - MMKV high-performance storage

#### Props for StorageModalWithTabs

```tsx
interface StorageModalProps {
  requiredStorageKeys?: RequiredStorageKey[];
  enableSharedModalDimensions?: boolean;
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

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppHostProvider>{/* Your app content */}</AppHostProvider>
    </QueryClientProvider>
  );
}
```

### Import & Use

```tsx
import { ReactQueryDevToolsModal, WifiToggle } from "@react-buoy/react-query";
import { ReactQueryIcon } from "@react-buoy/shared-ui";

// Add to your apps array
const TOOLS = [
  {
    id: "query",
    name: "REACT QUERY",
    description: "React Query inspector",
    slot: "both",
    icon: ({ size }) => <ReactQueryIcon size={size} colorPreset="red" />,
    component: ReactQueryDevToolsModal,
    props: {},
  },
  // Optional: Add WiFi toggle for offline testing
  {
    id: "wifi-toggle",
    name: "WIFI TOGGLE",
    description: "Toggle offline mode",
    slot: "both",
    icon: ({ size }) => <WifiToggle size={size} />,
    component: () => <></>,
    props: {},
  },
];
```

### What you get:

- 🔍 Query explorer with real-time data
- 🗂️ Cache manipulation and inspection
- 📊 Query performance metrics
- 🔄 Manual query refetching
- 📶 Offline/online mode toggle

</details>

<details>
<summary><strong>Dev Tool Settings Menu</strong></summary>

###

![set](https://github.com/user-attachments/assets/f8033982-e802-48f8-bd07-824121d557a2)

</details>

---

## 🔥 Complete Example

Here's a full working example with all packages (same as our [example app](./example/App.tsx)):

<details>
<summary><strong>Click to see complete setup with all tools</strong></summary>

```tsx
import React, { useMemo, useRef } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FloatingDevTools, type InstalledApp } from "@react-buoy/core";
import { EnvVarsModal, createEnvVarConfig, envVar } from "@react-buoy/env";
import { NetworkModal } from "@react-buoy/network";
import { StorageModalWithTabs } from "@react-buoy/storage";
import { ReactQueryDevToolsModal, WifiToggle } from "@react-buoy/react-query";
import {
  EnvLaptopIcon,
  ReactQueryIcon,
  StorageStackIcon,
  Globe,
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

  // Configure all development tools
  const installedApps: InstalledApp[] = useMemo(
    () => [
      {
        id: "env",
        name: "ENV",
        description: "Environment variables debugger",
        slot: "both",
        icon: ({ size }) => <EnvLaptopIcon size={size} color="#9f6" />,
        component: EnvVarsModal,
        props: { requiredEnvVars },
      },
      {
        id: "network",
        name: "NETWORK",
        description: "Network request logger",
        slot: "both",
        icon: ({ size }) => <Globe size={size} color="#38bdf8" />,
        component: NetworkModal,
        props: {},
      },
      {
        id: "storage",
        name: "STORAGE",
        description: "AsyncStorage browser",
        slot: "both",
        icon: ({ size }) => <StorageStackIcon size={size} color="#38f8a7" />,
        component: StorageModalWithTabs,
        props: { requiredStorageKeys },
      },
      {
        id: "query",
        name: "REACT QUERY",
        description: "React Query inspector",
        slot: "both",
        icon: ({ size }) => <ReactQueryIcon size={size} colorPreset="red" />,
        component: ReactQueryDevToolsModal,
        props: {},
      },
      {
        id: "wifi-toggle",
        name: "WIFI TOGGLE",
        description: "Toggle offline mode",
        slot: "both",
        icon: ({ size }) => <WifiToggle size={size} />,
        component: () => <></>,
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

