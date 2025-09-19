---
id: creating-tools
title: Creating Custom Tools
---

Tools are modular components that extend the DevTools Floating Menu with custom functionality. Each tool can either execute an action immediately or open a panel for more complex interactions.

## Basic Tool Structure

Every tool is a JavaScript object with required properties that define its behavior and appearance.

[//]: # 'Example'

```tsx
const myTool = {
  id: 'my-tool',        // Unique identifier
  label: 'My Tool',     // Display name in menu
  icon: '🔧',          // Emoji or React component
  action: () => {},     // For action tools
  component: MyPanel,   // For panel tools
  props: {},           // Props passed to component
}
```

[//]: # 'Example'

## Action Tools

Action tools execute immediately when selected from the menu. Perfect for quick operations like clearing cache or triggering refreshes.

### Simple Action

[//]: # 'Example2'

```tsx
const clearCacheTool = {
  id: 'clear-cache',
  label: 'Clear Cache',
  icon: '🗑️',
  action: async () => {
    await AsyncStorage.clear()
    Alert.alert('Success', 'Cache cleared!')
  },
}
```

[//]: # 'Example2'

### Action with Confirmation

[//]: # 'Example3'

```tsx
const resetAppTool = {
  id: 'reset-app',
  label: 'Reset App',
  icon: '♻️',
  action: () => {
    Alert.alert(
      'Reset App?',
      'This will clear all data and restart',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear()
            DevSettings.reload()
          },
        },
      ]
    )
  },
}
```

[//]: # 'Example3'

## Panel Tools

Panel tools open a modal or overlay when selected, providing a full UI for complex interactions.

### Basic Panel Component

[//]: # 'Example4'

```tsx
import { useAppHost } from '@monorepo/devtools-floating-menu'

function LogViewerPanel() {
  const { closeModal } = useAppHost()
  const [logs, setLogs] = useState([])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Console Logs</Text>
        <TouchableOpacity onPress={closeModal}>
          <Text>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {logs.map((log, i) => (
          <Text key={i} style={styles.log}>
            {log}
          </Text>
        ))}
      </ScrollView>
    </View>
  )
}

const logViewerTool = {
  id: 'log-viewer',
  label: 'Logs',
  icon: '📋',
  component: LogViewerPanel,
}
```

[//]: # 'Example4'

### Panel with Props

[//]: # 'Example5'

```tsx
function NetworkInspector({ baseURL, headers }) {
  const { closeModal } = useAppHost()
  const [requests, setRequests] = useState([])

  useEffect(() => {
    // Intercept network requests
    const interceptor = axios.interceptors.request.use((config) => {
      setRequests(prev => [...prev, {
        url: config.url,
        method: config.method,
        timestamp: Date.now(),
      }])
      return config
    })

    return () => {
      axios.interceptors.request.eject(interceptor)
    }
  }, [])

  return (
    <View style={styles.container}>
      <Text>Base URL: {baseURL}</Text>
      {/* Render requests */}
    </View>
  )
}

const networkTool = {
  id: 'network',
  label: 'Network',
  icon: '🌐',
  component: NetworkInspector,
  props: {
    baseURL: 'https://api.example.com',
    headers: { 'X-Debug': 'true' },
  },
}
```

[//]: # 'Example5'

## Advanced Tool Patterns

### Tool with State Persistence

[//]: # 'Example6'

```tsx
function FeatureFlagsPanel() {
  const { closeModal } = useAppHost()
  const [flags, setFlags] = useState({})

  // Load saved flags on mount
  useEffect(() => {
    AsyncStorage.getItem('@feature_flags').then((saved) => {
      if (saved) setFlags(JSON.parse(saved))
    })
  }, [])

  const toggleFlag = async (key) => {
    const newFlags = { ...flags, [key]: !flags[key] }
    setFlags(newFlags)
    await AsyncStorage.setItem('@feature_flags', JSON.stringify(newFlags))
  }

  return (
    <View style={styles.container}>
      {Object.entries(flags).map(([key, enabled]) => (
        <TouchableOpacity
          key={key}
          onPress={() => toggleFlag(key)}
          style={styles.flag}
        >
          <Text>{key}</Text>
          <Text>{enabled ? '✅' : '❌'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}
```

[//]: # 'Example6'

### Tool with Hot Reload Support

[//]: # 'Example7'

```tsx
// Use refs to persist across hot reloads
const usePersistedState = (key, initial) => {
  const ref = useRef()

  if (!ref.current) {
    ref.current = {
      value: initial,
      subscribers: new Set(),
    }
  }

  const [state, setState] = useState(ref.current.value)

  useEffect(() => {
    ref.current.subscribers.add(setState)
    return () => {
      ref.current.subscribers.delete(setState)
    }
  }, [])

  const updateState = (newValue) => {
    ref.current.value = newValue
    ref.current.subscribers.forEach(sub => sub(newValue))
  }

  return [state, updateState]
}

function PersistentPanel() {
  const [count, setCount] = usePersistedState('count', 0)
  // Count persists across hot reloads!
}
```

[//]: # 'Example7'

## Tool Communication

Tools can communicate with each other using the AppHost event system.

[//]: # 'Example8'

```tsx
function ToolA() {
  const { emit } = useAppHost()

  const sendMessage = () => {
    emit('tool-message', { from: 'ToolA', data: 'Hello!' })
  }

  return <Button onPress={sendMessage}>Send Message</Button>
}

function ToolB() {
  const { on, off } = useAppHost()
  const [messages, setMessages] = useState([])

  useEffect(() => {
    const handler = (payload) => {
      setMessages(prev => [...prev, payload])
    }

    on('tool-message', handler)
    return () => off('tool-message', handler)
  }, [])

  return (
    <View>
      {messages.map((msg, i) => (
        <Text key={i}>{msg.from}: {msg.data}</Text>
      ))}
    </View>
  )
}
```

[//]: # 'Example8'

## Best Practices

### Performance

- Use `React.memo` for panel components to prevent unnecessary re-renders
- Lazy load heavy dependencies
- Clean up subscriptions and timers in `useEffect` cleanup

### User Experience

- Always provide visual feedback for actions
- Include loading states for async operations
- Add error boundaries to prevent tool crashes from affecting the app

### Development

- Use TypeScript for better IDE support
- Test tools in both iOS and Android
- Consider adding keyboard shortcuts for frequently used tools

## TypeScript Support

[//]: # 'Example9'

```tsx
import { Tool } from '@monorepo/devtools-floating-menu'

interface MyPanelProps {
  apiUrl: string
  timeout: number
}

const typedTool: Tool<MyPanelProps> = {
  id: 'typed-tool',
  label: 'Typed Tool',
  icon: '📝',
  component: MyPanel,
  props: {
    apiUrl: 'https://api.example.com',
    timeout: 5000,
  },
}
```

[//]: # 'Example9'

## Important Notes

> **Security Warning**: Tools have full access to your app's context and AsyncStorage. Only install tools from trusted sources and ensure they're removed in production builds.

> **Performance Note**: Panel components are rendered in your app's React tree. Heavy computations should be memoized or moved to background tasks.

## Next Steps

- Learn about the [AppHost System](./apphost-system.md) for advanced overlay management
- Explore [Built-in Tools](./built-in-tools.md) for inspiration
- Configure [Tool Visibility](./tool-configuration.md) per environment