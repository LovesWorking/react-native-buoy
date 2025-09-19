---
id: quick-start
title: Quick Start
---

This code snippet demonstrates the 3 core concepts of DevTools Floating Menu:

- [Tool Registration](./guides/tool-registration.md) - Adding development tools to your menu
- [AppHost System](./guides/apphost-system.md) - Rendering overlays without component pollution
- [Tool Actions](./guides/tool-actions.md) - Executing commands and opening panels

[//]: # 'Example'

```tsx
import React from 'react'
import { AppHostProvider, FloatingMenu, AppOverlay, useAppHost } from '@monorepo/devtools-floating-menu'
import { EnvVarsModal, createEnvVarConfig } from '@monorepo/env-tools'
import { Button } from '@monorepo/shared'
import AsyncStorage from '@react-native-async-storage/async-storage'

// 1. TOOL REGISTRATION - Define your development tools
const tools = [
  // Panel tool - opens a modal
  {
    id: 'env-vars',
    label: 'Environment',
    icon: '🔧',
    component: EnvVarsModal,
    props: {
      config: createEnvVarConfig({
        API_URL: { required: true },
        DEBUG_MODE: { required: false },
      }),
    },
  },

  // Action tool - executes immediately
  {
    id: 'clear-storage',
    label: 'Clear Storage',
    icon: '🗑️',
    action: async () => {
      await AsyncStorage.clear()
      console.log('Storage cleared!')
    },
  },

  // Custom component tool
  {
    id: 'network-logger',
    label: 'Network',
    icon: '📡',
    component: NetworkLogger,
  },
]

// 2. APPHOST SYSTEM - Custom tool component
function NetworkLogger() {
  const { closeModal } = useAppHost()

  return (
    <View style={{ padding: 20, backgroundColor: 'white' }}>
      <Text>Network requests will appear here</Text>
      <Button onPress={closeModal}>Close</Button>
    </View>
  )
}

// 3. TOOL ACTIONS - Wire everything together
export default function App() {
  return (
    <AppHostProvider>
      {/* Your actual app */}
      <YourApplication />

      {/* Development tools (auto-removed in production) */}
      {__DEV__ && (
        <>
          <FloatingMenu
            tools={tools}
            position="bottom-right"
            defaultExpanded={false}
          />
          <AppOverlay />
        </>
      )}
    </AppHostProvider>
  )
}
```

[//]: # 'Example'

These three concepts make up the core functionality of DevTools Floating Menu. Let's explore each one:

## Tool Registration

Tools are JavaScript objects that describe what appears in your floating menu. Each tool needs:
- `id` - Unique identifier
- `label` - Display name
- `icon` - Emoji or React component
- Either `action` (for immediate execution) or `component` (for panels)

## AppHost System

The AppHost system lets tools render overlays without polluting your component tree:
- `AppHostProvider` - Wraps your app to enable the system
- `AppOverlay` - Renders tool panels above your app
- `useAppHost` - Hook for tools to interact with the system

## Tool Actions

Tools can either:
- Execute immediately when tapped (`action` property)
- Open a panel/modal (`component` property)
- Receive props for configuration (`props` property)

## What's Next?

Now that you understand the basics:

- Explore [Built-in Tools](./guides/built-in-tools.md) that come ready to use
- Learn to [Create Custom Tools](./guides/creating-tools.md) for your workflow
- Configure the [Floating Menu Appearance](./guides/menu-configuration.md)
- Set up [Keyboard Shortcuts](./guides/keyboard-shortcuts.md) for quick access