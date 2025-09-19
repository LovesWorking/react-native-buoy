---
id: FloatingMenu
title: FloatingMenu
---

```tsx
<FloatingMenu
  tools={tools}
  position="bottom-right"
  defaultExpanded={false}
  theme="dark"
  size={60}
  margin={20}
  expandDirection="up"
  showLabels={true}
  hapticFeedback={true}
  dragEnabled={true}
  onToolSelect={(tool) => {}}
  onExpand={() => {}}
  onCollapse={() => {}}
  style={customStyles}
/>
```

**Props**

- `tools: Tool[]`
  - **Required**
  - Array of tool objects to display in the menu
  - Each tool must have unique `id`, `label`, and `icon` properties
  - Tools can have either `action` function or `component` for rendering

- `position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-left' | 'center-right'`
  - Optional
  - Default: `'bottom-right'`
  - Initial position of the floating menu button
  - When `dragEnabled` is true, this is only the starting position

- `defaultExpanded: boolean`
  - Optional
  - Default: `false`
  - Whether the menu starts in expanded state
  - Useful for development when you want immediate access to tools

- `theme: 'light' | 'dark' | 'auto'`
  - Optional
  - Default: `'auto'`
  - Visual theme of the menu
  - `'auto'` follows system appearance

- `size: number`
  - Optional
  - Default: `56`
  - Size of the main floating button in pixels
  - Tool buttons are automatically sized at 80% of main button

- `margin: number`
  - Optional
  - Default: `16`
  - Distance from screen edges in pixels
  - Applies to initial position and drag boundaries

- `expandDirection: 'up' | 'down' | 'left' | 'right' | 'radial'`
  - Optional
  - Default: `'up'`
  - Direction tools expand from the main button
  - `'radial'` arranges tools in a circle

- `showLabels: boolean`
  - Optional
  - Default: `true`
  - Whether to show tool labels when expanded
  - Labels appear as tooltips next to tool icons

- `hapticFeedback: boolean`
  - Optional
  - Default: `true`
  - Enable haptic feedback on touch (iOS only)
  - Provides tactile response when selecting tools

- `dragEnabled: boolean`
  - Optional
  - Default: `true`
  - Allow dragging the menu to reposition
  - Long press to initiate drag

- `onToolSelect: (tool: Tool) => void`
  - Optional
  - Callback fired when a tool is selected
  - Receives the complete tool object
  - Useful for analytics or logging

- `onExpand: () => void`
  - Optional
  - Callback fired when menu expands
  - Can be used to pause app or prepare tools

- `onCollapse: () => void`
  - Optional
  - Callback fired when menu collapses
  - Can be used to resume app state

- `style: ViewStyle`
  - Optional
  - Custom styles for the main container
  - Useful for adding shadows or animations

**Tool Object Structure**

```tsx
interface Tool {
  id: string              // Unique identifier
  label: string           // Display name
  icon: string | ReactNode // Emoji or component
  action?: () => void | Promise<void>  // For action tools
  component?: ComponentType<any>       // For panel tools
  props?: object         // Props passed to component
  disabled?: boolean     // Disable the tool
  hidden?: boolean       // Hide from menu
  badge?: string | number // Notification badge
}
```

**Examples**

### Basic Usage

[//]: # 'Example'

```tsx
const tools = [
  {
    id: 'logs',
    label: 'Console',
    icon: '📋',
    component: ConsolePanel,
  },
  {
    id: 'network',
    label: 'Network',
    icon: '🌐',
    component: NetworkPanel,
  },
]

<FloatingMenu tools={tools} />
```

[//]: # 'Example'

### Advanced Configuration

[//]: # 'Example2'

```tsx
<FloatingMenu
  tools={tools}
  position="top-left"
  theme="dark"
  size={48}
  expandDirection="radial"
  onToolSelect={(tool) => {
    analytics.track('tool_selected', { toolId: tool.id })
  }}
  style={{
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  }}
/>
```

[//]: # 'Example2'

### Dynamic Tools

[//]: # 'Example3'

```tsx
function App() {
  const [tools, setTools] = useState(baseTools)
  const [userRole] = useState('developer')

  useEffect(() => {
    if (userRole === 'developer') {
      setTools([
        ...baseTools,
        {
          id: 'advanced',
          label: 'Advanced',
          icon: '⚙️',
          component: AdvancedPanel,
        },
      ])
    }
  }, [userRole])

  return <FloatingMenu tools={tools} />
}
```

[//]: # 'Example3'

### Tool with Badge

[//]: # 'Example4'

```tsx
const [errorCount, setErrorCount] = useState(0)

const tools = [
  {
    id: 'errors',
    label: 'Errors',
    icon: '⚠️',
    badge: errorCount > 0 ? errorCount : undefined,
    component: ErrorPanel,
  },
]

// Update badge on errors
useEffect(() => {
  const handler = () => setErrorCount(prev => prev + 1)
  ErrorUtils.setGlobalHandler(handler)
}, [])
```

[//]: # 'Example4'

### Custom Icon Component

[//]: # 'Example5'

```tsx
function CustomIcon() {
  return (
    <View style={styles.iconContainer}>
      <Image source={require('./icon.png')} style={styles.icon} />
    </View>
  )
}

const tools = [
  {
    id: 'custom',
    label: 'Custom Tool',
    icon: <CustomIcon />,
    action: () => console.log('Custom tool activated'),
  },
]
```

[//]: # 'Example5'

**Methods**

The FloatingMenu component can be controlled programmatically using a ref:

```tsx
const menuRef = useRef()

// Programmatically expand/collapse
menuRef.current?.expand()
menuRef.current?.collapse()
menuRef.current?.toggle()

// Update position
menuRef.current?.moveTo('top-left')

// Get current state
const isExpanded = menuRef.current?.isExpanded()

<FloatingMenu ref={menuRef} tools={tools} />
```

**Styling**

The FloatingMenu uses the following style tokens that can be customized:

```tsx
const customTheme = {
  colors: {
    primary: '#007AFF',
    background: '#FFFFFF',
    text: '#000000',
    border: '#E0E0E0',
  },
  fonts: {
    label: { fontSize: 12, fontWeight: '600' },
  },
  shadows: {
    button: { /* shadow styles */ },
  },
}

<FloatingMenu theme={customTheme} tools={tools} />
```

**Important Notes**

> **Performance**: The FloatingMenu uses React Native's Animated API for smooth animations. For large tool lists (>10 tools), consider using the `radial` expand direction for better performance.

> **Accessibility**: The menu supports VoiceOver/TalkBack. Ensure all tools have descriptive labels for screen reader users.

> **Production**: The FloatingMenu should only render in development mode. Always wrap with `{__DEV__ && <FloatingMenu />}` to ensure it's removed from production builds.