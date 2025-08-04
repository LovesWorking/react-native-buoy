# Environment Variables Configuration

The RnBetterDevToolsBubble provides type-safe environment variable validation with excellent developer experience.

## Quick Start

```tsx
import { RnBetterDevToolsBubble, RequiredEnvVar } from 'rn-better-dev-tools';

const requiredEnvVars: RequiredEnvVar[] = [
  // Simple existence check
  'EXPO_PUBLIC_API_URL',
  
  // Type checking with IntelliSense
  { key: 'EXPO_PUBLIC_DEBUG_MODE', expectedType: 'boolean' },
  { key: 'EXPO_PUBLIC_MAX_RETRIES', expectedType: 'number' },
  
  // Exact value checking
  { key: 'EXPO_PUBLIC_ENVIRONMENT', expectedValue: 'development' },
  
  // With descriptions for documentation
  {
    key: 'EXPO_PUBLIC_API_TIMEOUT',
    expectedType: 'number',
    description: 'API request timeout in milliseconds'
  }
];

<RnBetterDevToolsBubble
  queryClient={queryClient}
  requiredEnvVars={requiredEnvVars}
/>
```

## Supported Types

The following types are automatically detected and validated:

- `"string"` - Text values
- `"number"` - Numeric values (integers or decimals)
- `"boolean"` - True/false values
- `"array"` - Arrays (JSON arrays or comma-separated values)
- `"object"` - JSON objects

## Using Helper Functions

For even better developer experience, use the helper functions:

```tsx
import { envVar, createEnvVarConfig } from 'rn-better-dev-tools';

const requiredEnvVars = createEnvVarConfig([
  // Simple existence check
  envVar('EXPO_PUBLIC_API_URL').exists(),
  
  // Type checking with fluent API
  envVar('EXPO_PUBLIC_DEBUG_MODE')
    .withType('boolean')
    .build(),
  
  // Type checking with description
  envVar('EXPO_PUBLIC_MAX_RETRIES')
    .withType('number')
    .withDescription('Maximum API retry attempts'),
  
  // Value checking
  envVar('EXPO_PUBLIC_ENVIRONMENT')
    .withValue('development'),
]);
```

## Validation at Runtime

You can also validate environment variables programmatically:

```tsx
import { validateEnvVars } from 'rn-better-dev-tools';

const validation = validateEnvVars(process.env, requiredEnvVars);

if (!validation.isValid) {
  console.error('Environment variable errors:', validation.errors);
  // Example error:
  // [
  //   { key: 'EXPO_PUBLIC_API_URL', issue: 'missing' },
  //   { key: 'EXPO_PUBLIC_DEBUG_MODE', issue: 'wrong_type', expected: 'boolean', actual: 'string' }
  // ]
}
```

## Real-World Example

```tsx
const requiredEnvVars: RequiredEnvVar[] = [
  // API Configuration
  'EXPO_PUBLIC_API_URL',
  { key: 'EXPO_PUBLIC_API_TIMEOUT', expectedType: 'number', description: 'API timeout in ms' },
  
  // Feature Flags
  { key: 'EXPO_PUBLIC_ENABLE_ANALYTICS', expectedType: 'boolean' },
  { key: 'EXPO_PUBLIC_ENABLE_CRASH_REPORTS', expectedType: 'boolean' },
  
  // Environment
  { key: 'EXPO_PUBLIC_ENVIRONMENT', expectedValue: 'development' },
  { key: 'EXPO_PUBLIC_BUILD_VERSION', expectedType: 'string' },
  
  // Configuration
  { key: 'EXPO_PUBLIC_SUPPORTED_LOCALES', expectedType: 'array', description: 'Comma-separated locale codes' },
  { key: 'EXPO_PUBLIC_FEATURE_CONFIG', expectedType: 'object', description: 'JSON feature configuration' }
];
```

## Type Safety

The `RequiredEnvVar` type provides full IntelliSense support:

- When you type `expectedType:`, you'll see all available types
- TypeScript will error if you use an invalid type
- Hover over any field to see its documentation

## Color Coding in DevTools

The dev tools will display your environment variables with color coding:

- 🟢 **Green** - Variable exists with correct type/value
- 🟠 **Orange** - Variable exists but has wrong value
- 🔴 **Red** - Variable is missing or has wrong type
- ⚫ **Gray** - Optional variables (not in your required list)