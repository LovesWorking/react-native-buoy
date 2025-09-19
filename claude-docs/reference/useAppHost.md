---
id: useAppHost
title: useAppHost
---

```tsx
const {
  openModal,
  closeModal,
  closeAllModals,
  emit,
  on,
  off,
  isModalOpen,
  modalStack,
  store,
  updateStore,
} = useAppHost()
```

**Returns**

- `openModal: (options: ModalOptions) => void`
  - Opens a new modal overlay
  - Supports nested modals (stacking)
  - Options include component, props, and callbacks

- `closeModal: () => void`
  - Closes the currently active modal
  - If multiple modals are open, closes only the topmost
  - Triggers `onClose` callback if provided

- `closeAllModals: () => void`
  - Closes all open modals at once
  - Useful for reset or emergency close scenarios
  - Triggers all `onClose` callbacks in reverse order

- `emit: (event: string, payload?: any) => void`
  - Emits an event to all registered listeners
  - Event names should be kebab-case by convention
  - Payload can be any serializable data

- `on: (event: string, handler: (payload?: any) => void) => void`
  - Registers an event listener
  - Handler receives the payload from emit
  - Multiple handlers can listen to the same event

- `off: (event: string, handler: (payload?: any) => void) => void`
  - Removes a specific event listener
  - Must pass the exact same handler reference used in `on`
  - Safe to call even if handler wasn't registered

- `isModalOpen: boolean`
  - Current modal open state
  - `true` if any modal is open
  - Useful for conditional rendering or preventing actions

- `modalStack: Modal[]`
  - Array of currently open modals
  - First item is the bottom-most modal
  - Last item is the currently visible modal

- `store: object`
  - Optional global store object
  - Shared state accessible by all tools
  - Only available if configured in AppHostProvider

- `updateStore: (updates: Partial<Store>) => void`
  - Updates the global store
  - Merges updates with existing store
  - Only available if store is configured

**ModalOptions Interface**

```tsx
interface ModalOptions {
  component: ComponentType<any>  // React component to render
  props?: object                  // Props passed to component
  onClose?: () => void           // Callback when modal closes
  onOpen?: () => void            // Callback when modal opens
  backdrop?: boolean             // Show backdrop (default: true)
  backdropDismiss?: boolean      // Close on backdrop tap (default: true)
  animation?: 'slide' | 'fade' | 'none' // Animation type
}
```

**Examples**

### Opening a Simple Modal

[//]: # 'Example'

```tsx
function MyTool() {
  const { openModal, closeModal } = useAppHost()

  const showSettings = () => {
    openModal({
      component: SettingsPanel,
      props: {
        title: 'Tool Settings',
      },
      onClose: () => console.log('Settings closed'),
    })
  }

  return <Button onPress={showSettings}>Open Settings</Button>
}
```

[//]: # 'Example'

### Event Communication

[//]: # 'Example2'

```tsx
// Emitting component
function LogGenerator() {
  const { emit } = useAppHost()

  useEffect(() => {
    const interval = setInterval(() => {
      emit('new-log', {
        message: 'Test log entry',
        timestamp: Date.now(),
        level: 'info',
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [emit])

  return <Text>Generating logs...</Text>
}

// Listening component
function LogViewer() {
  const { on, off } = useAppHost()
  const [logs, setLogs] = useState([])

  useEffect(() => {
    const handleNewLog = (log) => {
      setLogs(prev => [...prev, log])
    }

    on('new-log', handleNewLog)
    return () => off('new-log', handleNewLog)
  }, [on, off])

  return (
    <ScrollView>
      {logs.map((log, i) => (
        <Text key={i}>
          [{log.level}] {log.message}
        </Text>
      ))}
    </ScrollView>
  )
}
```

[//]: # 'Example2'

### Managing Modal Stack

[//]: # 'Example3'

```tsx
function ModalNavigator() {
  const { modalStack, closeModal, closeAllModals } = useAppHost()

  return (
    <View>
      <Text>Open Modals: {modalStack.length}</Text>

      {modalStack.map((modal, index) => (
        <Text key={index}>
          {index + 1}. {modal.component.name}
        </Text>
      ))}

      <Button
        onPress={closeModal}
        disabled={modalStack.length === 0}
      >
        Close Current
      </Button>

      <Button
        onPress={closeAllModals}
        disabled={modalStack.length === 0}
      >
        Close All
      </Button>
    </View>
  )
}
```

[//]: # 'Example3'

### Using Global Store

[//]: # 'Example4'

```tsx
// Configure store in AppHostProvider
function App() {
  return (
    <AppHostProvider
      initialStore={{
        debugMode: false,
        apiUrl: 'https://api.example.com',
        userId: null,
      }}
    >
      <YourApp />
    </AppHostProvider>
  )
}

// Access store in tools
function DebugToggle() {
  const { store, updateStore } = useAppHost()

  return (
    <Switch
      value={store.debugMode}
      onValueChange={(enabled) => {
        updateStore({ debugMode: enabled })
        console.log('Debug mode:', enabled)
      }}
    />
  )
}

// Read store values
function ApiStatus() {
  const { store } = useAppHost()

  return (
    <View>
      <Text>API: {store.apiUrl}</Text>
      <Text>User: {store.userId || 'Not logged in'}</Text>
    </View>
  )
}
```

[//]: # 'Example4'

### Advanced Modal Control

[//]: # 'Example5'

```tsx
function WizardFlow() {
  const { openModal, closeModal } = useAppHost()

  const startWizard = () => {
    openModal({
      component: Step1,
      props: {
        onNext: (data) => {
          // Close current and open next
          closeModal()
          openModal({
            component: Step2,
            props: {
              previousData: data,
              onNext: (moreData) => {
                closeModal()
                openModal({
                  component: Step3,
                  props: {
                    allData: { ...data, ...moreData },
                    onComplete: () => {
                      closeModal()
                      Alert.alert('Wizard completed!')
                    },
                  },
                })
              },
            },
          })
        },
      },
      backdropDismiss: false, // Prevent accidental close
    })
  }

  return <Button onPress={startWizard}>Start Wizard</Button>
}
```

[//]: # 'Example5'

### Conditional Modal Rendering

[//]: # 'Example6'

```tsx
function SmartTool() {
  const { isModalOpen, openModal } = useAppHost()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleAction = async () => {
    // Don't open if modal already open or processing
    if (isModalOpen || isProcessing) {
      return
    }

    setIsProcessing(true)

    try {
      const result = await performExpensiveOperation()

      openModal({
        component: ResultsPanel,
        props: { result },
        animation: 'slide',
      })
    } catch (error) {
      openModal({
        component: ErrorPanel,
        props: { error },
        animation: 'fade',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Button
      onPress={handleAction}
      disabled={isModalOpen || isProcessing}
    >
      {isProcessing ? 'Processing...' : 'Run Tool'}
    </Button>
  )
}
```

[//]: # 'Example6'

**Important Notes**

> **Memory Management**: Always remove event listeners in cleanup functions to prevent memory leaks. The `off` method must receive the exact same function reference that was passed to `on`.

> **Modal Stack Limit**: While there's no hard limit on modal stack depth, deeply nested modals (>5 levels) may cause performance issues and poor UX. Consider using navigation within a single modal instead.

> **Event Naming**: Use kebab-case for event names (e.g., 'user-login', 'data-refresh') for consistency. Avoid generic names that might collide with other tools.

> **Store Updates**: Store updates are shallow merged. For nested objects, spread the existing values to avoid losing data: `updateStore({ settings: { ...store.settings, theme: 'dark' } })`