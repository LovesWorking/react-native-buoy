---
id: env-tools
title: Environment Tools
---

Environment Tools provides a comprehensive solution for managing and debugging environment variables in React Native applications, with visual inspection tools and runtime validation.

## Core Components

### EnvVarsModal

A pre-built modal component that displays all environment variables with their status, values, and remediation tips.

[//]: # 'Example'

```tsx
import { EnvVarsModal, createEnvVarConfig } from '@monorepo/env-tools'

const config = createEnvVarConfig({
  API_URL: {
    required: true,
    description: 'Backend API endpoint',
    pattern: /^https?:\/\/.+/,
  },
  DEBUG_MODE: {
    required: false,
    description: 'Enable debug logging',
    default: 'false',
  },
})

// Use in floating menu
const tools = [
  {
    id: 'env-vars',
    label: 'Environment',
    icon: '🔧',
    component: EnvVarsModal,
    props: { config },
  },
]
```

[//]: # 'Example'

## API Reference

### createEnvVarConfig

```tsx
createEnvVarConfig(schema: EnvVarSchema): EnvVarConfig
```

Creates a configuration object defining your environment variable requirements.

**Schema Properties**

- `required: boolean` - Whether the variable must be defined
- `description: string` - Human-readable description
- `default?: string` - Default value if not provided
- `pattern?: RegExp` - Validation pattern
- `transform?: (value: string) => any` - Transform function
- `validate?: (value: any) => boolean | string` - Custom validation

[//]: # 'Example2'

```tsx
const config = createEnvVarConfig({
  API_URL: {
    required: true,
    description: 'API endpoint',
    pattern: /^https:\/\//,
    validate: (url) => {
      try {
        new URL(url)
        return true
      } catch {
        return 'Invalid URL format'
      }
    },
  },

  TIMEOUT: {
    required: false,
    description: 'Request timeout in ms',
    default: '5000',
    transform: (val) => parseInt(val, 10),
    validate: (num) => num > 0 || 'Must be positive',
  },

  FEATURE_FLAGS: {
    required: false,
    description: 'Comma-separated feature flags',
    transform: (val) => val.split(',').map(s => s.trim()),
  },
})
```

[//]: # 'Example2'

### envVar

Helper function for accessing environment variables with type safety and validation.

```tsx
envVar(key: string, options?: EnvVarOptions): string | undefined
```

[//]: # 'Example3'

```tsx
import { envVar } from '@monorepo/env-tools'

// Basic usage
const apiUrl = envVar('API_URL')

// With validation
const apiUrl = envVar('API_URL', {
  required: true,
  validate: (url) => url.startsWith('https://'),
})

// With transformation
const timeout = envVar('TIMEOUT', {
  transform: (val) => parseInt(val, 10),
  default: '5000',
})

// Type-safe with generics
const flags = envVar<string[]>('FEATURE_FLAGS', {
  transform: (val) => val.split(','),
  default: '',
})
```

[//]: # 'Example3'

### validateEnvVars

Validates all environment variables against a configuration.

```tsx
validateEnvVars(config: EnvVarConfig): ValidationResult
```

[//]: # 'Example4'

```tsx
import { validateEnvVars, createEnvVarConfig } from '@monorepo/env-tools'

const config = createEnvVarConfig({
  API_URL: { required: true },
  API_KEY: { required: true },
})

const result = validateEnvVars(config)

if (!result.isValid) {
  console.error('Environment validation failed:')
  result.errors.forEach(error => {
    console.error(`- ${error.key}: ${error.message}`)
  })

  // In development, show visual warning
  if (__DEV__) {
    Alert.alert(
      'Environment Error',
      `Missing variables: ${result.errors.map(e => e.key).join(', ')}`
    )
  }
}
```

[//]: # 'Example4'

## Advanced Usage

### Custom Environment Modal

[//]: # 'Example5'

```tsx
import { useEnvVars } from '@monorepo/env-tools'

function CustomEnvPanel() {
  const { variables, errors, warnings, refresh } = useEnvVars(config)

  return (
    <View>
      <Text>Environment: {__DEV__ ? 'Development' : 'Production'}</Text>

      {errors.length > 0 && (
        <View style={styles.errorSection}>
          <Text>Errors ({errors.length})</Text>
          {errors.map(error => (
            <Text key={error.key}>
              {error.key}: {error.message}
            </Text>
          ))}
        </View>
      )}

      <ScrollView>
        {variables.map(variable => (
          <View key={variable.key} style={styles.variable}>
            <Text>{variable.key}</Text>
            <Text>{variable.value || '(undefined)'}</Text>
            {variable.status === 'error' && (
              <Text style={styles.error}>{variable.error}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <Button onPress={refresh}>Refresh</Button>
    </View>
  )
}
```

[//]: # 'Example5'

### Environment-Specific Configurations

[//]: # 'Example6'

```tsx
const baseConfig = {
  API_URL: { required: true },
  LOG_LEVEL: { required: false, default: 'info' },
}

const devConfig = createEnvVarConfig({
  ...baseConfig,
  DEBUG_MODE: { required: false, default: 'true' },
  MOCK_API: { required: false, default: 'false' },
})

const prodConfig = createEnvVarConfig({
  ...baseConfig,
  SENTRY_DSN: { required: true },
  ANALYTICS_KEY: { required: true },
})

const config = __DEV__ ? devConfig : prodConfig
```

[//]: # 'Example6'

### Runtime Environment Switching

[//]: # 'Example7'

```tsx
import { EnvManager } from '@monorepo/env-tools'

const envManager = new EnvManager({
  environments: {
    development: {
      API_URL: 'https://dev.api.example.com',
      LOG_LEVEL: 'debug',
    },
    staging: {
      API_URL: 'https://staging.api.example.com',
      LOG_LEVEL: 'info',
    },
    production: {
      API_URL: 'https://api.example.com',
      LOG_LEVEL: 'error',
    },
  },
})

// Switch environment at runtime
function EnvironmentSwitcher() {
  const [current, setCurrent] = useState('development')

  const switchEnv = (env) => {
    envManager.switch(env)
    setCurrent(env)
    DevSettings.reload() // Reload app with new env
  }

  return (
    <Picker
      selectedValue={current}
      onValueChange={switchEnv}
    >
      <Picker.Item label="Development" value="development" />
      <Picker.Item label="Staging" value="staging" />
      <Picker.Item label="Production" value="production" />
    </Picker>
  )
}
```

[//]: # 'Example7'

## Integration with CI/CD

### Validation Script

```json
// package.json
{
  "scripts": {
    "env:validate": "node scripts/validate-env.js",
    "prebuild": "npm run env:validate"
  }
}
```

```javascript
// scripts/validate-env.js
const { validateEnvVars, createEnvVarConfig } = require('@monorepo/env-tools')

const config = createEnvVarConfig({
  API_URL: { required: true },
  API_KEY: { required: true },
})

const result = validateEnvVars(config)

if (!result.isValid) {
  console.error('❌ Environment validation failed:')
  result.errors.forEach(error => {
    console.error(`   ${error.key}: ${error.message}`)
  })
  process.exit(1)
}

console.log('✅ Environment validation passed')
```

## Best Practices

### Security

- Never commit `.env` files to version control
- Use `.env.example` with dummy values for documentation
- Validate URL patterns to prevent injection attacks
- Sanitize values before displaying in UI

### Organization

```
project/
├── .env                 # Local overrides (gitignored)
├── .env.example         # Template with all variables
├── .env.development     # Development defaults
├── .env.staging        # Staging configuration
└── .env.production     # Production configuration
```

### Error Handling

[//]: # 'Example8'

```tsx
import { envVar } from '@monorepo/env-tools'

function ApiClient() {
  const apiUrl = envVar('API_URL', {
    required: true,
    fallback: () => {
      if (__DEV__) {
        // Development fallback
        return 'http://localhost:3000'
      }
      // Production must fail
      throw new Error('API_URL is required in production')
    },
  })

  return fetch(apiUrl)
}
```

[//]: # 'Example8'

## Important Notes

> **Security**: Environment variables are bundled into your app at build time. Never store secrets or sensitive data in environment variables for client-side apps.

> **Hot Reload**: Changes to environment variables require a full rebuild. Metro's hot reload doesn't pick up .env changes.

> **Platform Differences**: React Native doesn't have process.env like Node.js. Use react-native-config or similar libraries to access environment variables.