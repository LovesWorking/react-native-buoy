# 🔐 Environment Variables Validator

> A powerful debugging tool that provides instant visibility into environment configuration issues across all environments - from local development to production.

## 🎯 Why You Need This

### 🚨 Real-World Scenarios This Tool Prevents

**Production Deployments Gone Wrong:**
- 📱 OTA updates deployed with missing environment variables
- 🔄 Wrong build commands causing missing configurations
- 🌍 Region-specific deployments with incorrect API endpoints
- 🔑 Missing or rotated API keys breaking production apps

**Development & Onboarding Issues:**
- 👥 New team members struggling with incomplete `.env` files
- 🤔 Hours wasted debugging "why isn't this working?" issues
- 📝 Undocumented environment requirements causing setup failures
- 🔄 Different team members using different configurations

**This tool provides instant visibility into environment issues across ALL environments**, helping you debug problems in seconds instead of hours.

## ✨ Key Benefits

### 🚨 Works in All Environments
- **Development** - Catch issues during local development
- **QA/Staging** - Verify configurations before production
- **Production** - Debug live issues without accessing servers
- **Post-deployment** - Immediately verify OTA updates

### 🔍 Instant Problem Detection
See at a glance which environment variables have issues:
- 🟢 **GREEN** - Variable exists and is valid
- 🟠 **ORANGE** - Variable exists but has wrong value
- 🔴 **RED** - Variable is missing or has wrong type

### 📝 Self-Documenting for Teams
- Add descriptions so new developers understand each variable
- No more "what does this env var do?" Slack messages
- Built-in documentation for onboarding

## 🚀 Quick Start

```tsx
import { 
  RnBetterDevToolsBubble, 
  envVar,
  createEnvVarConfig
} from 'react-native-react-query-devtools';

const requiredEnvVars = createEnvVarConfig([
  // Simple existence check
  envVar('EXPO_PUBLIC_API_URL').exists(),
  
  // Type validation
  envVar('EXPO_PUBLIC_DEBUG_MODE')
    .withType('boolean')
    .build(),
  
  // Value matching
  envVar('EXPO_PUBLIC_ENVIRONMENT')
    .withValue('development')
    .build(),
  
  // With documentation (methods can be in any order!)
  envVar('EXPO_PUBLIC_API_TIMEOUT')
    .withDescription('API request timeout in milliseconds')
    .withType('number')
    .build()
]);

<RnBetterDevToolsBubble
  queryClient={queryClient}
  requiredEnvVars={requiredEnvVars}
/>
```

## 📋 Complete Example - All Validation States

### Environment Variables (.env file)
```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_MAX_RETRIES=3
EXPO_PUBLIC_ENVIRONMENT=development

# Wrong values (expecting different values)
EXPO_PUBLIC_API_VERSION=v1              # App expects 'v2'
EXPO_PUBLIC_REGION=eu-west-1            # App expects 'us-east-1'

# Wrong types
EXPO_PUBLIC_FEATURE_FLAGS=enabled       # App expects object like {"chat": true}
EXPO_PUBLIC_PORT="3000"                 # App expects number, not string

# These are missing (not in .env file):
# EXPO_PUBLIC_SENTRY_DSN
# EXPO_PUBLIC_ANALYTICS_KEY
# EXPO_PUBLIC_ENABLE_TELEMETRY
```

### Validation Configuration
Here's how to configure validation for the above environment:

```tsx
import { envVar, createEnvVarConfig } from 'react-native-react-query-devtools';

const requiredEnvVars = createEnvVarConfig([
  // 🟢 GREEN - Valid variables
  envVar('EXPO_PUBLIC_API_URL').exists(),                        // ✓ Exists
  
  envVar('EXPO_PUBLIC_DEBUG_MODE')
    .withType('boolean')
    .withDescription('Enable debug logging')
    .build(),                                                     // ✓ Correct type
  
  envVar('EXPO_PUBLIC_MAX_RETRIES')
    .withType('number')
    .build(),                                                     // ✓ Correct type
  
  envVar('EXPO_PUBLIC_ENVIRONMENT')
    .withValue('development')
    .build(),                                                     // ✓ Correct value

  // 🟠 ORANGE - Wrong values (exists but incorrect)
  envVar('EXPO_PUBLIC_API_VERSION')
    .withValue('v2')
    .withDescription('API version (should be v2)')
    .build(),                                                     // ⚠ Wrong value
  
  envVar('EXPO_PUBLIC_REGION')
    .withValue('us-east-1')
    .build(),                                                     // ⚠ Wrong value

  // 🔴 RED - Wrong types (exists but wrong type)
  envVar('EXPO_PUBLIC_FEATURE_FLAGS')
    .withDescription('Feature flags configuration object')
    .withType('object')
    .build(),                                                     // ⚠ Wrong type
  
  envVar('EXPO_PUBLIC_PORT')
    .withType('number')
    .build(),                                                     // ⚠ Wrong type

  // 🔴 RED - Missing variables
  envVar('EXPO_PUBLIC_SENTRY_DSN').exists(),                     // ⚠ Missing
  
  envVar('EXPO_PUBLIC_ANALYTICS_KEY')
    .withDescription('Analytics service API key')
    .withType('string')
    .build(),                                                     // ⚠ Missing
  
  envVar('EXPO_PUBLIC_ENABLE_TELEMETRY')
    .withType('boolean')
    .build(),                                                     // ⚠ Missing
]);
```

## 🎨 How It Looks

When you have issues, the dev tools clearly show:

```
⚠️ 7 issues: 3 missing, 2 wrong type, 2 wrong value
```

When everything is valid:

```
✅ All 12 required vars valid • 5 optional
```

## 🔧 Supported Types

The validator automatically detects and validates these types:

| Type | Detection | Examples |
|------|-----------|----------|
| `string` | Default for text values | `"api.example.com"` |
| `number` | Numeric values | `3000`, `42.5` |
| `boolean` | Boolean values | `true`, `false`, `"true"` |
| `array` | JSON arrays or comma-separated | `["a","b"]`, `"a,b,c"` |
| `object` | JSON objects | `{"key": "value"}` |

## 💡 Pro Tips

### Use Helper Functions
For better IntelliSense and type safety:

```tsx
import { envVar, createEnvVarConfig } from 'react-native-react-query-devtools';

const requiredEnvVars = createEnvVarConfig([
  // Simple existence check
  envVar('EXPO_PUBLIC_API_URL').exists(),
  
  // Type + description (any order works!)
  envVar('EXPO_PUBLIC_API_TIMEOUT')
    .withType('number')
    .withDescription('API timeout in milliseconds')
    .build(),
    
  // Description first, then value - order doesn't matter!
  envVar('EXPO_PUBLIC_ENVIRONMENT')
    .withDescription('Current environment')
    .withValue('development')
    .build(),
]);
```

### Validate at Runtime
Programmatically validate in your CI/CD pipeline:

```tsx
import { validateEnvVars } from 'react-native-react-query-devtools';

const validation = validateEnvVars(process.env, requiredEnvVars);
if (!validation.isValid) {
  console.error('Environment errors:', validation.errors);
  process.exit(1);
}
```

### Group Related Variables
Organize your configuration for better maintainability:

```tsx
const requiredEnvVars: RequiredEnvVar[] = [
  // API Configuration
  { key: 'EXPO_PUBLIC_API_URL', expectedType: 'string', description: 'API endpoint' },
  { key: 'EXPO_PUBLIC_API_KEY', expectedType: 'string', description: 'API authentication' },
  
  // Feature Flags
  { key: 'EXPO_PUBLIC_ENABLE_ANALYTICS', expectedType: 'boolean' },
  { key: 'EXPO_PUBLIC_ENABLE_SENTRY', expectedType: 'boolean' },
  
  // Build Configuration
  { key: 'EXPO_PUBLIC_ENVIRONMENT', expectedValue: 'development' },
  { key: 'EXPO_PUBLIC_BUILD_VERSION', expectedType: 'string' },
];
```

## 🌍 Real-World Use Cases

### 🚀 Production Debugging
```tsx
// Show only for admin users in production
{(userRole === 'admin' || __DEV__) && (
  <RnBetterDevToolsBubble
    queryClient={queryClient}
    environment={environment}
    userRole={userRole}
    requiredEnvVars={requiredEnvVars}
  />
)}
```

### 🔄 OTA Update Verification
After pushing an OTA update, admins can immediately verify:
- All environment variables are present
- API endpoints are correct for the region
- Feature flags are properly configured
- No configuration was lost during the build

### 👥 Team Onboarding
New developers can:
1. See exactly which env vars they're missing
2. Understand what each variable does (via descriptions)
3. Get the correct types and values
4. Start contributing faster with less setup friction

### 🐛 Customer Support
When users report issues:
1. Support team can ask them to screenshot the env vars section
2. Instantly identify configuration problems
3. No need for complex debugging sessions
4. Faster resolution times

## 🛡️ Best Practices

1. **Enable for admin users in production** - Catch deployment issues immediately
2. **Add descriptions** - Make your env vars self-documenting
3. **Group related variables** - Organize by feature or service
4. **Version your configurations** - Track what values each environment expects
5. **Use in CI/CD** - Validate before deploying

## 💡 Pro Tip: Environment-Specific Validation

```tsx
const getRequiredEnvVars = (environment: string): RequiredEnvVar[] => {
  const common = [
    { key: 'EXPO_PUBLIC_API_URL', expectedType: 'string' },
    { key: 'EXPO_PUBLIC_SENTRY_DSN', expectedType: 'string' },
  ];

  if (environment === 'production') {
    return [
      ...common,
      { key: 'EXPO_PUBLIC_ENVIRONMENT', expectedValue: 'production' },
      { key: 'EXPO_PUBLIC_ENABLE_ANALYTICS', expectedValue: 'true' },
    ];
  }

  return [
    ...common,
    { key: 'EXPO_PUBLIC_ENVIRONMENT', expectedValue: 'development' },
    { key: 'EXPO_PUBLIC_DEBUG_MODE', expectedValue: 'true' },
  ];
};
```

---

<div align="center">
  <strong>From development to production, never lose visibility into your app's configuration.</strong>
  <br />
  <em>Debug faster. Ship confidently. Sleep better.</em>
</div>