# Floating Menu Refactor Plan: Self-Managing App Registry Pattern

## Problem Statement
Currently, developers integrating tools into the floating menu must:
- Manage visibility state (`isOpen`, `setOpen`) in the parent component
- Handle close callbacks and resolvers
- Write boilerplate code for each modal/tool integration

This creates friction and makes the system less plug-and-play.

## Solution: App Registry Pattern

### Core Architecture

#### 1. Global App Registry Context
Create a context that acts as a central coordinator:
- Tracks which app(s) are currently open
- Provides methods to register, open, and close apps
- Notifies subscribers (like FloatingMenu) of state changes

#### 2. Self-Contained App Components
Each tool/modal becomes self-managing:
- Wraps its own visibility state internally
- Registers with the app registry on mount
- Reports open/close events to the registry
- No external state management required

### Implementation Comparison

#### Current Pattern (Complex)
```tsx
// In parent component - lots of boilerplate
const [isEnvOpen, setEnvOpen] = useState(false);
const [envCloseResolver, setEnvCloseResolver] = useState(null);

<EnvVarsModal
  visible={isEnvOpen}
  onClose={() => {
    setEnvOpen(false);
    envCloseResolver?.();
    setEnvCloseResolver(null);
  }}
  requiredEnvVars={requiredEnvVars}
  enableSharedModalDimensions={true}
/>
```

#### New Pattern (Simple)
```tsx
// In parent component - just one line
<EnvVarsApp />

// Or with optional launch callback
<EnvVarsApp onLaunch={() => analytics.track('env-app-opened')} />
```

### Technical Design

#### App Registry API
```typescript
interface AppRegistry {
  // State
  activeApps: Set<string>;
  isAnyAppOpen: boolean;

  // Methods
  registerApp(appId: string): void;
  unregisterApp(appId: string): void;
  openApp(appId: string): void;
  closeApp(appId: string): void;
  closeAllApps(): void;

  // Subscriptions
  subscribe(callback: (state) => void): () => void;
}
```

#### Self-Managing App Component Structure
```typescript
const EnvVarsApp = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { registerApp, openApp, closeApp } = useAppRegistry();

  useEffect(() => {
    registerApp('env-vars');
    return () => unregisterApp('env-vars');
  }, []);

  // Internal state management
  const handleOpen = () => {
    setIsOpen(true);
    openApp('env-vars');
  };

  const handleClose = () => {
    setIsOpen(false);
    closeApp('env-vars');
  };

  // Expose launch trigger to floating menu
  useImperativeHandle(ref, () => ({
    launch: handleOpen
  }));

  return (
    <Modal visible={isOpen} onClose={handleClose}>
      {/* Modal content */}
    </Modal>
  );
};
```

#### Floating Menu Integration
```typescript
const FloatingMenu = () => {
  const { isAnyAppOpen } = useAppRegistry();

  // Auto-hide when any app is open
  if (isAnyAppOpen) return null;

  return (
    <Menu>
      {/* Menu items that trigger app launches */}
    </Menu>
  );
};
```

## Benefits

### For Developers
- **Zero boilerplate** - No state management code needed
- **Single line integration** - Just drop in the component
- **Encapsulated logic** - Apps manage themselves
- **Type-safe** - Registry provides TypeScript support

### For Users
- **Consistent behavior** - All apps work the same way
- **No glitches** - Floating menu auto-hides reliably
- **Better performance** - Less re-renders in parent

### For Maintenance
- **Centralized coordination** - Single source of truth
- **Easy debugging** - All state in one place
- **Extensible** - Easy to add features like multi-app support

## Migration Strategy

1. **Phase 1**: Implement AppRegistry context
2. **Phase 2**: Create wrapper HOC for existing modals
3. **Phase 3**: Migrate apps one by one
4. **Phase 4**: Deprecate old pattern

## Alternative Approaches Considered

### Event Emitter Pattern
- Pros: Lighter weight, no context overhead
- Cons: Less type-safe, harder to debug

### Portal-Based System
- Pros: Complete UI isolation
- Cons: More complex, potential z-index issues

### Redux/Zustand Store
- Pros: Powerful state management
- Cons: Overkill for this use case, adds dependency

## Next Steps

1. Review and approve approach
2. Create AppRegistry implementation
3. Build example self-managing app
4. Test with floating menu
5. Document integration guide
6. Migrate existing apps