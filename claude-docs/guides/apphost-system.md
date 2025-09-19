---
id: apphost-system
title: AppHost System
---

The AppHost system provides a clean way to render overlays, modals, and floating UI elements without polluting your component tree or dealing with z-index issues.

## How It Works

The AppHost system consists of three main parts that work together to manage overlay rendering:

- **AppHostProvider** - Context provider that manages overlay state
- **AppOverlay** - Render target for all overlay content
- **useAppHost** - Hook for tools to interact with the system

## Basic Setup

[//]: # 'Example'

```tsx
import { AppHostProvider, AppOverlay } from '@monorepo/devtools-floating-menu'

export default function App() {
  return (
    <AppHostProvider>
      {/* Your app components */}
      <NavigationContainer>
        <Stack.Navigator>
          {/* ... */}
        </Stack.Navigator>
      </NavigationContainer>

      {/* Overlay render point - place after your app content */}
      {__DEV__ && <AppOverlay />}
    </AppHostProvider>
  )
}
```

[//]: # 'Example'

## Using the AppHost Hook

The `useAppHost` hook provides methods for managing overlays from within your tools.

[//]: # 'Example2'

```tsx
import { useAppHost } from '@monorepo/devtools-floating-menu'

function MyTool() {
  const {
    openModal,
    closeModal,
    emit,
    on,
    off,
    isModalOpen,
  } = useAppHost()

  // Open a modal programmatically
  const showSettings = () => {
    openModal({
      component: SettingsPanel,
      props: { theme: 'dark' },
    })
  }

  return (
    <View>
      <Button onPress={showSettings}>Open Settings</Button>
      <Button onPress={closeModal}>Close</Button>
    </View>
  )
}
```

[//]: # 'Example2'

## Modal Management

### Opening Modals

[//]: # 'Example3'

```tsx
function ToolLauncher() {
  const { openModal } = useAppHost()

  const launchTool = (tool) => {
    openModal({
      component: tool.component,
      props: tool.props,
      onClose: () => console.log('Tool closed'),
    })
  }

  return (
    <TouchableOpacity onPress={() => launchTool(myTool)}>
      <Text>Launch Tool</Text>
    </TouchableOpacity>
  )
}
```

[//]: # 'Example3'

### Nested Modals

The AppHost system supports nested modal navigation:

[//]: # 'Example4'

```tsx
function ParentModal() {
  const { openModal, closeModal } = useAppHost()

  const openChild = () => {
    openModal({
      component: ChildModal,
      props: {
        onBack: closeModal,
      },
    })
  }

  return (
    <View>
      <Text>Parent Modal</Text>
      <Button onPress={openChild}>Open Child</Button>
      <Button onPress={closeModal}>Close</Button>
    </View>
  )
}

function ChildModal({ onBack }) {
  const { closeModal } = useAppHost()

  return (
    <View>
      <Text>Child Modal</Text>
      <Button onPress={onBack}>Back to Parent</Button>
      <Button onPress={closeModal}>Close All</Button>
    </View>
  )
}
```

[//]: # 'Example4'

## Event System

The AppHost provides a built-in event system for communication between tools.

### Emitting Events

[//]: # 'Example5'

```tsx
function NetworkLogger() {
  const { emit } = useAppHost()

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => {
        emit('network-request', {
          url: response.config.url,
          status: response.status,
          timestamp: Date.now(),
        })
        return response
      },
      (error) => {
        emit('network-error', {
          url: error.config?.url,
          message: error.message,
          timestamp: Date.now(),
        })
        return Promise.reject(error)
      }
    )

    return () => {
      axios.interceptors.response.eject(interceptor)
    }
  }, [emit])
}
```

[//]: # 'Example5'

### Listening to Events

[//]: # 'Example6'

```tsx
function NetworkMonitor() {
  const { on, off } = useAppHost()
  const [requests, setRequests] = useState([])
  const [errors, setErrors] = useState([])

  useEffect(() => {
    const handleRequest = (data) => {
      setRequests(prev => [...prev, data])
    }

    const handleError = (data) => {
      setErrors(prev => [...prev, data])
    }

    on('network-request', handleRequest)
    on('network-error', handleError)

    return () => {
      off('network-request', handleRequest)
      off('network-error', handleError)
    }
  }, [on, off])

  return (
    <View>
      <Text>Requests: {requests.length}</Text>
      <Text>Errors: {errors.length}</Text>
    </View>
  )
}
```

[//]: # 'Example6'

## Advanced Patterns

### Custom Overlay Animations

[//]: # 'Example7'

```tsx
function AnimatedModal() {
  const { closeModal } = useAppHost()
  const slideAnim = useRef(new Animated.Value(300)).current

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start()
  }, [])

  const close = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      closeModal()
    })
  }

  return (
    <Animated.View
      style={{
        transform: [{ translateY: slideAnim }],
      }}
    >
      <TouchableOpacity onPress={close}>
        <Text>Close</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}
```

[//]: # 'Example7'

### Global State Access

[//]: # 'Example8'

```tsx
// Create a global store that tools can access
const AppHostStore = {
  debugMode: false,
  apiEndpoint: 'https://api.example.com',
  featureFlags: {},
}

function AppHostProviderWithStore({ children }) {
  const [store, setStore] = useState(AppHostStore)

  return (
    <AppHostProvider
      value={{
        store,
        updateStore: (updates) => setStore({ ...store, ...updates }),
      }}
    >
      {children}
    </AppHostProvider>
  )
}

// Access in tools
function DebugPanel() {
  const { store, updateStore } = useAppHost()

  return (
    <Switch
      value={store.debugMode}
      onValueChange={(value) => updateStore({ debugMode: value })}
    />
  )
}
```

[//]: # 'Example8'

### Overlay Positioning

[//]: # 'Example9'

```tsx
function ToastNotification({ message, position = 'top' }) {
  const { closeModal } = useAppHost()

  const positionStyles = {
    top: { top: 50 },
    bottom: { bottom: 50 },
    center: { top: '50%', marginTop: -25 },
  }

  useEffect(() => {
    const timer = setTimeout(closeModal, 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <View
      style={[
        styles.toast,
        positionStyles[position],
      ]}
    >
      <Text>{message}</Text>
    </View>
  )
}

// Usage
const { openModal } = useAppHost()
openModal({
  component: ToastNotification,
  props: {
    message: 'Operation successful!',
    position: 'bottom',
  },
})
```

[//]: # 'Example9'

## Performance Considerations

### Lazy Loading

[//]: # 'Example10'

```tsx
import { lazy, Suspense } from 'react'

const HeavyTool = lazy(() => import('./HeavyTool'))

const tool = {
  id: 'heavy-tool',
  label: 'Heavy Tool',
  icon: '🎛️',
  component: () => (
    <Suspense fallback={<Text>Loading...</Text>}>
      <HeavyTool />
    </Suspense>
  ),
}
```

[//]: # 'Example10'

### Memory Management

Always clean up resources when modals close:

[//]: # 'Example11'

```tsx
function ResourceIntensiveTool() {
  const { closeModal } = useAppHost()
  const [data, setData] = useState(null)

  useEffect(() => {
    let mounted = true

    // Load data
    fetchLargeDataset().then(result => {
      if (mounted) setData(result)
    })

    return () => {
      mounted = false
      // Clear large data on unmount
      setData(null)
    }
  }, [])

  return (
    <View>
      {/* Render data */}
    </View>
  )
}
```

[//]: # 'Example11'

## Important Notes

> **Z-Index Management**: The AppOverlay component automatically manages z-index to ensure overlays appear above your app content. Place it as the last child of AppHostProvider.

> **Memory Leaks**: Always clean up event listeners and subscriptions in useEffect cleanup functions to prevent memory leaks.

> **Performance**: The AppHost system renders overlays in the main React tree. For heavy components, use lazy loading and virtualization.

## API Reference

See the complete [AppHost API Reference](../reference/apphost.md) for detailed documentation of all methods and options.