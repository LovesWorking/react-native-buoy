# @react-buoy/env

[![npm](https://img.shields.io/npm/v/@react-buoy%2Fenv)](https://www.npmjs.com/package/@react-buoy/env)

Environment variables inspector and validator for React Native development tools.

## Features

- **Environment Variable Inspector**: Browse all environment variables in your app
- **Required Variable Validation**: Define and validate required environment variables
- **Type Checking**: Validate variable types (string, boolean, number, etc.)
- **Value Validation**: Check if variables match expected values
- **Search & Filtering**: Search and filter by variable name, value, or status
- **Copy Functionality**: Easily copy variable values
- **Beautiful UI**: Modern, game-themed interface matching other React Buoy tools

## Installation

This package is part of the React Buoy monorepo and is automatically available to other packages and the example app.

For external projects:

```bash
npm install @react-buoy/env
# or
pnpm add @react-buoy/env
# or
yarn add @react-buoy/env
```

## Quick Start

### Simplest Setup - Just 1 Line!

**Import the preset and add it to your tools array. Done!**

```typescript
import { envToolPreset } from '@react-buoy/env';
import { FloatingDevTools } from '@react-buoy/core';

const installedApps = [
  envToolPreset, // That's it! One line.
  // ...your other tools
];

function App() {
  return (
    <FloatingDevTools
      apps={installedApps}
      environment="local"
      userRole="admin"
    />
  );
}
```

**Done!** The preset automatically:
- ✅ Inspects all environment variables
- ✅ Provides search and filtering
- ✅ Includes copy functionality
- ✅ No configuration required

### Custom Configuration

If you need to validate specific environment variables:

```typescript
import { createEnvTool, createEnvVarConfig, envVar } from '@react-buoy/env';

// Define required environment variables
const requiredEnvVars = createEnvVarConfig([
  envVar("EXPO_PUBLIC_API_URL").exists(),
  envVar("EXPO_PUBLIC_DEBUG_MODE").withType("boolean").build(),
  envVar("EXPO_PUBLIC_ENVIRONMENT").withValue("development").build(),
]);

// Create custom tool with validation
const myEnvTool = createEnvTool({
  requiredEnvVars,
  colorPreset: "cyan",
  enableSharedModalDimensions: true,
});

const installedApps = [
  myEnvTool,
  // ...other tools
];
```

### Alternative: Manual Setup

If you're not using FloatingDevTools or want more control:

```typescript
import { EnvVarsModal, createEnvVarConfig, envVar } from '@react-buoy/env';

const requiredEnvVars = createEnvVarConfig([
  envVar("EXPO_PUBLIC_API_URL").exists(),
  envVar("EXPO_PUBLIC_DEBUG_MODE").withType("boolean").build(),
]);

function App() {
  const [showEnv, setShowEnv] = useState(false);

  return (
    <>
      <Button onPress={() => setShowEnv(true)}>
        Open Environment Inspector
      </Button>

      <EnvVarsModal
        visible={showEnv}
        onClose={() => setShowEnv(false)}
        requiredEnvVars={requiredEnvVars}
      />
    </>
  );
}
```

## API Reference

### Presets

#### `envToolPreset`

Pre-configured environment variables tool ready to use with FloatingDevTools.

**Example:**
```typescript
import { envToolPreset } from '@react-buoy/env';

const installedApps = [envToolPreset];
```

#### `createEnvTool(options?)`

Create a custom environment variables tool configuration.

**Options:**
```typescript
{
  /** Tool name (default: "ENV") */
  name?: string;
  /** Tool description */
  description?: string;
  /** Icon color preset (default: "green") */
  colorPreset?: "orange" | "cyan" | "purple" | "pink" | "yellow" | "green";
  /** Custom tool ID (default: "env") */
  id?: string;
  /** Array of required environment variables to validate */
  requiredEnvVars?: RequiredEnvVar[];
  /** Enable shared modal dimensions */
  enableSharedModalDimensions?: boolean;
}
```

**Example:**
```typescript
import { createEnvTool, createEnvVarConfig, envVar } from '@react-buoy/env';

const requiredEnvVars = createEnvVarConfig([
  envVar("API_URL").exists(),
  envVar("DEBUG").withType("boolean").build(),
]);

const myEnvTool = createEnvTool({
  name: "ENVIRONMENT",
  requiredEnvVars,
  colorPreset: "purple",
  enableSharedModalDimensions: true,
});
```

### Components

#### `EnvVarsModal`

Main modal component for inspecting environment variables.

**Props:**
```typescript
interface EnvVarsModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** List of required environment variables to validate */
  requiredEnvVars: RequiredEnvVar[];
  /** Optional back button handler */
  onBack?: () => void;
  /** Whether to use shared modal dimensions */
  enableSharedModalDimensions?: boolean;
}
```

**Example:**
```typescript
<EnvVarsModal
  visible={isVisible}
  onClose={handleClose}
  requiredEnvVars={requiredEnvVars}
/>
```

### Utilities

#### `createEnvVarConfig(validators)`

Create an array of required environment variables with validation rules.

**Signature:**
```typescript
function createEnvVarConfig(
  validators: EnvVarValidator[]
): RequiredEnvVar[]
```

**Example:**
```typescript
import { createEnvVarConfig, envVar } from '@react-buoy/env';

const config = createEnvVarConfig([
  envVar("API_URL").exists(),
  envVar("DEBUG").withType("boolean").build(),
  envVar("ENVIRONMENT").withValue("production").build(),
]);
```

#### `envVar(key)`

Create a fluent validator for an environment variable.

**Signature:**
```typescript
function envVar(key: string): EnvVarValidator
```

**Methods:**
- `.exists()` - Validate that the variable exists
- `.withType(type)` - Validate the variable type (string, boolean, number, etc.)
- `.withValue(value)` - Validate the variable matches a specific value
- `.build()` - Finalize the validator

**Example:**
```typescript
import { envVar } from '@react-buoy/env';

// Variable must exist
envVar("API_URL").exists();

// Variable must be a boolean
envVar("DEBUG_MODE").withType("boolean").build();

// Variable must match specific value
envVar("ENVIRONMENT").withValue("staging").build();

// Combined validation
envVar("PORT")
  .withType("number")
  .withValue("3000")
  .build();
```

### Types

#### `RequiredEnvVar`

```typescript
interface RequiredEnvVar {
  /** Environment variable key */
  key: string;
  /** Optional description */
  description?: string;
  /** Expected type */
  expectedType?: "string" | "boolean" | "number" | "json";
  /** Expected value */
  expectedValue?: string;
  /** Whether the variable must exist */
  required?: boolean;
}
```

#### `Environment`

```typescript
type Environment = 
  | "local" 
  | "development" 
  | "staging" 
  | "production" 
  | string;
```

#### `UserRole`

```typescript
type UserRole = "admin" | "internal" | "user";
```

## Use Cases

### API Configuration Validation

```typescript
import { createEnvTool, createEnvVarConfig, envVar } from '@react-buoy/env';

const requiredEnvVars = createEnvVarConfig([
  envVar("EXPO_PUBLIC_API_URL").exists(),
  envVar("EXPO_PUBLIC_API_KEY").exists(),
  envVar("EXPO_PUBLIC_API_TIMEOUT").withType("number").build(),
]);

const envTool = createEnvTool({ requiredEnvVars });
```

### Environment-Specific Validation

```typescript
import { createEnvVarConfig, envVar } from '@react-buoy/env';

const requiredEnvVars = createEnvVarConfig([
  envVar("EXPO_PUBLIC_ENVIRONMENT")
    .withValue("development")
    .build(),
  envVar("EXPO_PUBLIC_DEBUG_MODE")
    .withType("boolean")
    .build(),
  envVar("EXPO_PUBLIC_ENABLE_LOGGING")
    .withType("boolean")
    .build(),
]);
```

### Feature Flag Configuration

```typescript
import { createEnvVarConfig, envVar } from '@react-buoy/env';

const requiredEnvVars = createEnvVarConfig([
  envVar("EXPO_PUBLIC_FEATURE_NEW_UI")
    .withType("boolean")
    .build(),
  envVar("EXPO_PUBLIC_FEATURE_ANALYTICS")
    .withType("boolean")
    .build(),
  envVar("EXPO_PUBLIC_FEATURE_BETA")
    .withType("boolean")
    .build(),
]);
```

## Dependencies

- `@react-buoy/shared-ui` - Common UI components and utilities
- React and React Native (peer dependencies)

## Development

### Building

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

### Clean Build

```bash
pnpm clean
```

## License

MIT

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/LovesWorking/react-native-buoy/issues).
