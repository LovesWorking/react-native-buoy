# React Buoy Devtools

![devtools](https://github.com/user-attachments/assets/a732d6a3-9963-49e3-b0f1-0d974a0a74d7)



**The floating devtools menu that every React Native team needs.**

A persistent floating row that shows your current environment (dev/staging/prod) and user role (admin/internal/user) at all times, with instant access to tools your team will use every day.

## One floating menu that:

- **Always visible** – Shows environment & user role in a draggable row that survives reloads
- **Consistent everywhere** – Same tools in dev, staging, and production
- **Bring your own tools** – Drop in any React component as a tool
- **Team-friendly** – Each engineer can show/hide the tools they need

## What You Get

### 🎯 Smart Floating Row

A draggable status bar that docks to screen edges, remembers its position, and can be collapsed to just a handle. Shows your environment (dev/qa/prod) and user role (admin/internal/user) at a glance.

### 🎨 Animated Tool Dial

Tap the role badge to open a radial menu with your tools. Beautiful neon transitions, enforced slot limits, automatic sync between row and dial views.

### 🏗️ Production Ready

- **AppHost lifecycle** – Tools stay open after reload, singleton enforcement, hardware back button support
- **Smart persistence** – Per-device settings that sync instantly without code changes
- **Launch modes** – Pick per-tool presentation: `self-modal` (tool controls its own modal), `host-modal` (App Host wraps it), or `inline` (rendered directly in the overlay)
- **TypeScript throughout** – Full type safety and IntelliSense support

## Professional Tools Already Built!

### 🌍 Environment Inspector

Visual health check for your app config. Required/optional variables, auto-detection, search, filters. Know instantly if your app is misconfigured.

### 📡 Network inspector

Timeline view, capture toggle, ignore patterns, detailed headers/body inspection, performance stats.

### 💾 Storage Explorer

Real-time AsyncStorage browser. Live updates, key grouping, bulk operations, conversation view for debugging state changes.

### ⚡ React Query DevTools

TanStack Query devtools, adapted for mobile. Query explorer, mutation tracking, cache manipulation, online/offline toggle.

## Quick Start

```bash
# Core floating menu
npm install @react-buoy/core

# Pick your tools (or build your own)
npm install @react-buoy/env        # Environment inspector
npm install @react-buoy/network    # Network monitor
npm install @react-buoy/storage    # Storage explorer
npm install @react-buoy/react-query # React Query devtools
```

## Drop It In – 2 Minutes

```tsx
import { AppHostProvider, FloatingMenu, AppOverlay } from "@react-buoy/core";
import { EnvVarsModal } from "@react-buoy/env";
import { NetworkModal } from "@react-buoy/network";
import { StorageModalWithTabs } from "@react-buoy/storage";
import { ReactQueryDevToolsModal } from "@react-buoy/react-query";
import {
  EnvLaptopIcon,
  WifiCircuitIcon,
  StorageStackIcon,
  ReactQueryIcon,
} from "@react-buoy/shared-ui";

const TOOLS = [
  {
    id: "env",
    name: "Environment",
    icon: <EnvLaptopIcon size={16} />,
    component: EnvVarsModal,
    props: {
      requiredEnvVars: [{ key: "API_URL", description: "Backend base URL" }],
    },
  },
  {
    id: "network",
    name: "Network",
    icon: <WifiCircuitIcon size={16} />,
    component: NetworkModal,
    launchMode: "host-modal",
    singleton: true,
  },
  {
    id: "storage",
    name: "Storage",
    icon: <StorageStackIcon size={16} />,
    component: StorageModalWithTabs,
    singleton: true,
  },
  {
    id: "query",
    name: "React Query",
    icon: <ReactQueryIcon size={16} />,
    component: ReactQueryDevToolsModal,
    singleton: true,
  },
];

function App() {
  return (
    <AppHostProvider>
      {/* Your existing app */}
      <YourAppContent />

      {/* Add the floating menu - that's it! */}
      <FloatingMenu
        apps={TOOLS}
        environment="dev" // or staging/prod
        userRole="internal" // or admin/user
      />
      <AppOverlay />
    </AppHostProvider>
  );
}
```

## Build Your Own Tools

Any React component can be a tool. Perfect for:

- Admin dashboards
- Feature flags toggles
- User impersonation
- QA checklists
- GraphQL explorers
- Database browsers
- Push notification testing
- Analytics dashboards

```tsx
// Your custom tool - just a React component
function MyAdminPanel({ onClose }) {
  return (
    <View>
      <Text>Secret Admin Powers 🚀</Text>
      {/* Your tool UI */}
    </View>
  );
}

// Register it with the menu
const TOOLS = [
  {
    id: "admin",
    name: "Admin Panel",
    icon: <ShieldIcon size={16} />,
    component: MyAdminPanel,
    slot: "both", // Show in row AND dial
    singleton: true, // Only one instance
    launchMode: "host-modal", // Or "inline", "self-modal"
  },
  // ... other tools
];
```

## Why Teams Love It

### 🎯 **No More Environment Confusion**

Your current environment and role are always visible. No more "wait, am I in prod?" moments.

### 🔄 **Survives Everything**

Hot reload? Crash recovery? The tools persists through it all. Tools stay open, positions are remembered.

### 👥 **Team Consistency**

Every engineer sees the same tools in every environment. Onboard new devs in minutes, not days.

### 🎨 **Not Another Debug Menu**

Beautiful, responsive, and actually pleasant to use. Your team will _want_ to use these tools.

### 🏢 **Production-Safe**

Ship it to production—just wire in your own access checks!

## Real-World Example

Imagine you're debugging a payment flow issue:

1. **Environment badge** shows you're in staging (not prod! 😅)
2. **Role pill** confirms you're logged in as "Admin"
3. Tap **Network** to watch API calls in real-time
4. Open **Storage** to see what's persisted locally
5. Check **React Query** to inspect data
6. Launch your custom **Payment Debug** panel

All from one floating menu that follows you through every screen.

## License

MIT © React Buoy Team
