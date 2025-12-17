---
title: Environment Inspector
id: tools-env
---

The Environment Inspector tool lets you view and validate environment variables in your React Native app. It automatically discovers `EXPO_PUBLIC_` prefixed variables and provides validation, type detection, and health monitoring.

## Installation

<!-- ::PM npm="npm install @react-buoy/env" yarn="yarn add @react-buoy/env" pnpm="pnpm add @react-buoy/env" bun="bun add @react-buoy/env" -->

After installation, the Environment Inspector will be auto-detected and appear in your FloatingDevTools menu.

## Custom Configuration

For more control, use `createEnvTool` with the `envVar` builder to define required variables and validation rules:

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import { createEnvTool, createEnvVarConfig, envVar } from "@react-buoy/env";

const requiredEnvVars = createEnvVarConfig([
  envVar("EXPO_PUBLIC_API_URL").exists(),
  envVar("EXPO_PUBLIC_DEBUG_MODE").withType("boolean").build(),
  envVar("EXPO_PUBLIC_ENVIRONMENT").withValue("development").build(),
  envVar("EXPO_PUBLIC_MAX_RETRIES")
    .withType("number")
    .withDescription("Maximum API retry attempts")
    .build(),
]);

const myEnvTool = createEnvTool({
  requiredEnvVars,
});

const installedApps = [myEnvTool];

function App() {
  return (
    <FloatingDevTools
      apps={installedApps}
      environment="local"
    />
  );
}
```

## The `envVar` Builder

The fluent builder API makes it easy to define environment variable requirements:

```tsx
envVar("API_KEY")
  .withType("string")           // Set expected type
  .withValue("sk_test_123")     // Or set expected value
  .withDescription("API Key")   // Add documentation
  .build()                      // Finalize config

// Shorthand for just checking existence
envVar("API_KEY").exists()
```

### Supported Types

```typescript
type EnvVarType = "string" | "number" | "boolean" | "array" | "object" | "url";
```

## `createEnvTool` Options

```typescript
createEnvTool({
  name?: string;                    // default: "ENV"
  description?: string;
  colorPreset?: "orange" | "cyan" | "purple" | "pink" | "yellow" | "green"; // default: "green"
  id?: string;                      // default: "env"
  requiredEnvVars?: RequiredEnvVar[];
  enableSharedModalDimensions?: boolean;
});
```

## Features

- **Automatic Discovery** - Auto-collects all `EXPO_PUBLIC_` prefixed variables
- **Required Variable Validation** - Define which vars must exist with expected values/types
- **Type Detection** - Auto-detects: string, number, boolean, array, object, url, json
- **Search & Filtering** - Real-time search + filters for "All", "Missing", "Issues"
- **Health Status** - Health percentage (0-100%) with HEALTHY/WARNING/ERROR/CRITICAL states
- **Statistics** - Total count, required count, missing count, wrong value/type counts
- **Copy to Clipboard** - Copy any value with one tap

## Variable Status Types

| Status | Description |
|--------|-------------|
| `required_present` | Required var is set and correct |
| `required_missing` | Required var is not set |
| `required_wrong_value` | Set but doesn't match expected value |
| `required_wrong_type` | Set but wrong type |
| `optional_present` | Optional var that is set |

## Validation Visual Indicators

- **Green** - Variable exists and matches expected value/type
- **Yellow** - Variable exists but value/type differs from expected
- **Red** - Required variable is missing
