---
title: Environment Inspector
id: tools-env
---

The Environment Inspector tool lets you view and validate environment variables in your React Native app.

## Installation

```bash
npm install @react-buoy/env
```

The tool will automatically appear in your FloatingDevTools menu after installation.

## Features

- View all environment variables
- Validate expected values
- See type information
- Copy values to clipboard

## Configuration

You can configure which environment variables to display and validate:

```tsx
import { FloatingDevTools } from "@react-buoy/core";
import { EnvConfig } from "@react-buoy/env";

const envConfig: EnvConfig = {
  requiredVars: [
    "API_URL",
    "APP_VERSION",
  ],
  expectedValues: {
    NODE_ENV: "development",
  },
};

<FloatingDevTools
  environment="local"
  envConfig={envConfig}
/>
```

## EnvConfig Schema

```typescript
interface EnvConfig {
  /** List of required environment variables */
  requiredVars?: string[];

  /** Expected values for validation */
  expectedValues?: Record<string, string>;

  /** Variables to hide from display */
  hiddenVars?: string[];
}
```

## Validation

The tool will highlight:
- **Green**: Variable exists and matches expected value
- **Yellow**: Variable exists but value differs from expected
- **Red**: Required variable is missing
