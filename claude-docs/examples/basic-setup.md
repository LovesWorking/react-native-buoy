---
id: basic-setup
title: Basic Setup Example
---

A complete example of integrating DevTools Floating Menu into a React Native application with essential development tools.

[//]: # 'Example'

```tsx
// App.tsx
import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import {
  AppHostProvider,
  FloatingMenu,
  AppOverlay,
} from '@monorepo/devtools-floating-menu'
import { EnvVarsModal, createEnvVarConfig } from '@monorepo/env-tools'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DevSettings, Alert } from 'react-native'

// Configure environment variables
const envConfig = createEnvVarConfig({
  API_URL: {
    required: true,
    description: 'Backend API endpoint',
    pattern: /^https?:\/\/.+/,
  },
  API_KEY: {
    required: true,
    description: 'API authentication key',
  },
  DEBUG_MODE: {
    required: false,
    description: 'Enable debug logging',
    default: 'false',
  },
  FEATURE_FLAGS: {
    required: false,
    description: 'Comma-separated feature flags',
    transform: (val) => val.split(',').map(s => s.trim()),
  },
})

// Define development tools
const devTools = [
  // Environment Variables Inspector
  {
    id: 'env-vars',
    label: 'Environment',
    icon: '🔧',
    component: EnvVarsModal,
    props: { config: envConfig },
  },

  // Clear AsyncStorage
  {
    id: 'clear-storage',
    label: 'Clear Storage',
    icon: '🗑️',
    action: async () => {
      Alert.alert(
        'Clear Storage?',
        'This will remove all cached data',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            style: 'destructive',
            onPress: async () => {
              await AsyncStorage.clear()
              Alert.alert('Success', 'Storage cleared')
            },
          },
        ]
      )
    },
  },

  // Reload App
  {
    id: 'reload',
    label: 'Reload',
    icon: '🔄',
    action: () => DevSettings.reload(),
  },

  // Console Logs
  {
    id: 'console',
    label: 'Console',
    icon: '📋',
    component: ConsoleViewer,
  },
]

// Simple console viewer component
function ConsoleViewer() {
  const [logs, setLogs] = React.useState([])

  React.useEffect(() => {
    // Intercept console.log
    const originalLog = console.log
    console.log = (...args) => {
      setLogs(prev => [...prev, {
        type: 'log',
        message: args.join(' '),
        timestamp: new Date(),
      }])
      originalLog(...args)
    }

    return () => {
      console.log = originalLog
    }
  }, [])

  return (
    <View style={styles.console}>
      <View style={styles.header}>
        <Text style={styles.title}>Console Logs</Text>
        <TouchableOpacity onPress={() => setLogs([])}>
          <Text>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.logContainer}>
        {logs.map((log, i) => (
          <View key={i} style={styles.logEntry}>
            <Text style={styles.timestamp}>
              {log.timestamp.toLocaleTimeString()}
            </Text>
            <Text style={styles.logMessage}>{log.message}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

// Navigation setup
const Stack = createNativeStackNavigator()

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

// Main App Component
export default function App() {
  return (
    <AppHostProvider>
      <AppNavigator />

      {/* Development Tools - only in dev mode */}
      {__DEV__ && (
        <>
          <FloatingMenu
            tools={devTools}
            position="bottom-right"
            theme="dark"
            size={56}
            expandDirection="up"
          />
          <AppOverlay />
        </>
      )}
    </AppHostProvider>
  )
}

const styles = StyleSheet.create({
  console: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logContainer: {
    flex: 1,
    padding: 16,
  },
  logEntry: {
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
  },
  logMessage: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
})
```

[//]: # 'Example'

## Key Features

This basic setup includes:

1. **Environment Variable Management** - Visual inspection and validation
2. **Storage Management** - Clear AsyncStorage with confirmation
3. **Quick Reload** - Instantly reload the app
4. **Console Viewer** - See console.log output without external tools

## Usage

1. The floating button appears in the bottom-right corner
2. Tap to expand and see all tools
3. Select a tool to execute its action or open its panel
4. Panels overlay your app without disrupting navigation

## Customization

You can easily extend this setup:

- Add more tools to the `devTools` array
- Customize the floating menu appearance
- Create custom tool components
- Add keyboard shortcuts for quick access

## Next Steps

- See [Network Inspector Example](./network-inspector.md) for HTTP debugging
- Check [Performance Monitor Example](./performance-monitor.md) for FPS tracking
- Explore [Custom Tools Example](./custom-tools.md) for advanced tools