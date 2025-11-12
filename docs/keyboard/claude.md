# React Native Keyboard Handling - Master Guide

> The definitive documentation for react-native-keyboard-controller v1.18.6  
> Your single source of truth for professional keyboard interactions

---

## Quick Navigation

- [🚀 30-Second Setup](#-30-second-setup)
- [📱 Core Hooks Reference](#-core-hooks-reference)
- [📦 Essential Components](#-essential-components)
- [⚡ Performance Patterns](#-performance-patterns)
- [🏗️ Advanced Integration](#-advanced-integration)
- [✅ Best Practices](#-best-practices)
- [❌ Common Pitfalls](#-common-pitfalls)
- [🔧 Platform Specifics](#-platform-specifics)
- [📚 Complete API Reference](#-complete-api-reference)
- [🐛 Troubleshooting](#-troubleshooting)

---

## 🚀 30-Second Setup

```typescript
// 1. Install & setup
npm install react-native-keyboard-controller react-native-reanimated

// 2. Wrap your app
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function App() {
  return (
    <KeyboardProvider>
      <YourAppContent />
    </KeyboardProvider>
  );
}

// 3. Use in any component
import { useKeyboardState, KeyboardAwareScrollView } from 'react-native-keyboard-controller';

const MyForm = () => {
  const isVisible = useKeyboardState(state => state.isVisible);
  
  return (
    <KeyboardAwareScrollView>
      <TextInput placeholder="Email" />
      <TextInput placeholder="Password" />
      <Text>{isVisible ? 'Keyboard is open' : 'Keyboard is closed'}</Text>
    </KeyboardAwareScrollView>
  );
};
```

**Library Overview:** react-native-keyboard-controller provides 60fps keyboard animations, cross-platform consistency, and advanced focus management using Reanimated worklets.

---

## 📱 Core Hooks Reference

### useKeyboardState<T>(selector)
*Reactive keyboard state with custom selectors for optimal performance*

**Source:** `src/hooks/useKeyboardState/index.ts:43`

```typescript
// Basic usage
const isVisible = useKeyboardState(state => state.isVisible);
const height = useKeyboardState(state => state.height);

// Full state access
const keyboardState = useKeyboardState();
// { isVisible: boolean, height: number, appearance: 'light' | 'dark' }

// Performance optimization with selector
const { isVisible, height } = useKeyboardState(state => ({
  isVisible: state.isVisible,
  height: state.height
}));
```

**When to use:** Reading keyboard state reactively without causing unnecessary re-renders.

---

### useKeyboardHandler(handler, deps)
*Workletized keyboard event handlers for smooth animations*

**Source:** `src/hooks/index.ts:152`

```typescript
const MyComponent = () => {
  const translateY = useSharedValue(0);

  useKeyboardHandler({
    onStart: (e) => {
      "worklet";
      console.log('Keyboard will move to height:', e.height);
    },
    onMove: (e) => {
      "worklet";
      translateY.value = -e.height;
    },
    onEnd: (e) => {
      "worklet";
      console.log('Keyboard finished at height:', e.height);
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return <Reanimated.View style={animatedStyle}>{children}</Reanimated.View>;
};
```

**Event Properties:**
- `progress`: 0-1 indicating keyboard position
- `height`: Current keyboard height in pixels  
- `duration`: Animation duration in milliseconds
- `target`: Tag of the focused TextInput

---

### useKeyboardAnimation() / useReanimatedKeyboardAnimation()
*Animated values for keyboard-driven animations*

**Source:** `src/hooks/index.ts:49` / `src/hooks/index.ts:70`

```typescript
// For regular Animated API
const { height, progress } = useKeyboardAnimation();

const animatedStyle = {
  transform: [{ translateY: height }],
  opacity: progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.7]
  })
};

// For Reanimated (recommended)
const { height, progress } = useReanimatedKeyboardAnimation();

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: height.value }],
  opacity: interpolate(progress.value, [0, 1], [1, 0.7])
}));
```

---

### useReanimatedFocusedInput()
*Access to focused input layout and positioning*

**Source:** `src/hooks/index.ts:202`

```typescript
const MyComponent = () => {
  const { input } = useReanimatedFocusedInput();

  const animatedStyle = useAnimatedStyle(() => {
    if (!input.value) return {};
    
    return {
      top: input.value.layout.absoluteY,
      left: input.value.layout.absoluteX,
      width: input.value.layout.width,
      height: input.value.layout.height,
    };
  });

  return <Reanimated.View style={animatedStyle} />;
};
```

**Input Properties:**
- `layout.x, layout.y`: Position relative to parent
- `layout.absoluteX, absoluteY`: Position relative to screen
- `layout.width, height`: Input dimensions
- `target`: TextInput tag reference

---

### useFocusedInputHandler(handler, deps)
*Handle text and selection changes in focused inputs*

**Source:** `src/hooks/index.ts:225`

```typescript
const MyComponent = () => {
  useFocusedInputHandler({
    onChangeText: (e) => {
      "worklet";
      console.log('Text changed:', e.text);
    },
    onSelectionChange: (e) => {
      "worklet";
      const { start, end } = e.selection;
      console.log('Selection from', start.position, 'to', end.position);
    }
  }, []);

  return <View>{children}</View>;
};
```

---

### useResizeMode() / useKeyboardController()
*Android resize mode management and library control*

**Source:** `src/hooks/index.ts:25` / `src/hooks/index.ts:183`

```typescript
// Automatically sets Android adjustResize mode
const MyScreen = () => {
  useResizeMode(); // Essential for Android
  return <FormContent />;
};

// Control library state
const MyApp = () => {
  const { setEnabled, enabled } = useKeyboardController();
  
  return (
    <Button 
      title={enabled ? 'Disable' : 'Enable'} 
      onPress={() => setEnabled(!enabled)} 
    />
  );
};
```

---

## 📦 Essential Components

### KeyboardAwareScrollView
*Intelligent auto-scrolling with focus tracking*

**Source:** `src/components/KeyboardAwareScrollView/index.tsx:101`

```typescript
interface KeyboardAwareScrollViewProps {
  bottomOffset?: number;              // Distance from keyboard (default: 0)
  disableScrollOnKeyboardHide?: boolean; // Prevent scroll on hide
  enabled?: boolean;                  // Enable/disable functionality
  extraKeyboardSpace?: number;        // Additional spacing
  ScrollViewComponent?: ComponentType; // Custom scroll component
}

// Basic usage
<KeyboardAwareScrollView bottomOffset={20}>
  <TextInput placeholder="Name" />
  <TextInput placeholder="Email" />
  <TextInput placeholder="Message" style={{ height: 100 }} />
  <Button title="Submit" />
</KeyboardAwareScrollView>

// Advanced with snap points
<KeyboardAwareScrollView
  snapToOffsets={[0, 100, 200]}
  extraKeyboardSpace={20}
  disableScrollOnKeyboardHide={false}
>
  <FormContent />
</KeyboardAwareScrollView>
```

**Key Features:**
- Automatic scrolling to keep focused inputs visible
- Support for snap-to-offsets behavior
- Handles multiline TextInput growth
- Optimized for 60fps performance

---

### KeyboardAvoidingView
*Multiple behavior modes for keyboard avoidance*

**Source:** `src/components/KeyboardAvoidingView/index.tsx:77`

```typescript
interface KeyboardAvoidingViewProps {
  behavior?: 'height' | 'position' | 'padding' | 'translate-with-padding';
  enabled?: boolean;
  keyboardVerticalOffset?: number;
  contentContainerStyle?: ViewStyle; // Only for 'position' behavior
}

// Height behavior - adjusts view height
<KeyboardAvoidingView behavior="height">
  <LoginForm />
</KeyboardAvoidingView>

// Position behavior - moves content up
<KeyboardAvoidingView 
  behavior="position"
  contentContainerStyle={{ flex: 1, justifyContent: 'center' }}
>
  <CenteredContent />
</KeyboardAvoidingView>

// Padding behavior - adds bottom padding
<KeyboardAvoidingView behavior="padding">
  <ChatInterface />
</KeyboardAvoidingView>

// Translate with padding - combines translation and padding
<KeyboardAvoidingView behavior="translate-with-padding">
  <ComplexForm />
</KeyboardAvoidingView>
```

**Behavior Guide:**
- **height**: Reduces view height by keyboard height
- **position**: Translates entire view upward
- **padding**: Adds padding bottom equal to keyboard height  
- **translate-with-padding**: Combines translation with padding for complex layouts

---

### KeyboardToolbar
*Navigation toolbar with prev/next/done buttons*

**Source:** `src/components/KeyboardToolbar/index.tsx:91`

```typescript
interface KeyboardToolbarProps {
  content?: JSX.Element;              // Custom middle content
  theme?: KeyboardToolbarTheme;       // Dark/light theming
  doneText?: ReactNode;               // Custom done button text
  showArrows?: boolean;               // Show prev/next buttons
  onNextCallback?: (event) => void;   // Next button callback
  onPrevCallback?: (event) => void;   // Previous button callback  
  onDoneCallback?: (event) => void;   // Done button callback
  blur?: JSX.Element;                 // Blur effect component
  opacity?: HEX;                      // Container opacity
  enabled?: boolean;                  // Enable/disable
  offset?: { closed?: number; opened?: number }; // Position offsets
}

// Basic toolbar
<KeyboardToolbar doneText="Close" />

// Advanced customization
<KeyboardToolbar
  content={<Text>Step 2 of 5</Text>}
  theme={customTheme}
  showArrows={true}
  onNextCallback={(e) => {
    // Custom behavior before default next
    console.log('Moving to next field');
  }}
  onDoneCallback={(e) => {
    // Custom behavior before keyboard dismiss
    validateForm();
  }}
  blur={<BlurView style={StyleSheet.absoluteFill} />}
  opacity="cc"
/>
```

---

### KeyboardStickyView
*Content that sticks to keyboard position*

**Source:** `src/components/KeyboardStickyView/index.tsx:40`

```typescript
interface KeyboardStickyViewProps {
  offset?: {
    closed?: number;    // Offset when keyboard closed
    opened?: number;    // Offset when keyboard open  
  };
  enabled?: boolean;
}

// Sticky submit button
<KeyboardStickyView offset={{ closed: -50, opened: 10 }}>
  <Button title="Send Message" />
</KeyboardStickyView>

// Floating action button
<KeyboardStickyView 
  offset={{ closed: -80, opened: 20 }}
  style={{ position: 'absolute', right: 20 }}
>
  <TouchableOpacity style={styles.fab}>
    <Icon name="add" />
  </TouchableOpacity>
</KeyboardStickyView>
```

---

### OverKeyboardView
*Modal-like overlay that doesn't dismiss keyboard*

**Source:** `src/views/OverKeyboardView/index.tsx:23`

```typescript
interface OverKeyboardViewProps {
  visible: boolean;
}

// Emoji picker over keyboard
<OverKeyboardView visible={showEmojiPicker}>
  <EmojiPicker onSelect={insertEmoji} />
</OverKeyboardView>

// Suggestion overlay
<OverKeyboardView visible={showSuggestions}>
  <View style={styles.suggestions}>
    {suggestions.map(suggestion => (
      <TouchableOpacity key={suggestion.id} onPress={() => selectSuggestion(suggestion)}>
        <Text>{suggestion.text}</Text>
      </TouchableOpacity>
    ))}
  </View>
</OverKeyboardView>
```

---

## ⚡ Performance Patterns

### Worklet Optimization

```typescript
// ✅ DO: Proper worklet usage
useKeyboardHandler({
  onMove: (e) => {
    "worklet"; // Required for UI thread execution
    translateY.value = -e.height;
  }
}, []); // Empty deps for static handler

// ❌ DON'T: Missing worklet or recreating handler
useKeyboardHandler({
  onMove: (e) => {
    translateY.value = -e.height; // Missing "worklet"
  }
}, [someValue]); // Causes handler recreation
```

### Selector-based State Access

```typescript
// ✅ DO: Use selectors to prevent unnecessary re-renders
const isVisible = useKeyboardState(state => state.isVisible);
const height = useKeyboardState(state => state.height);

// ❌ DON'T: Access full state when only needing part of it
const keyboardState = useKeyboardState(); // Re-renders on any state change
```

### Memoization Best Practices

```typescript
// ✅ DO: Memoize expensive calculations
const containerStyle = useMemo(() => ({
  paddingBottom: keyboardHeight + 20,
  transform: [{ translateY: -keyboardHeight / 2 }]
}), [keyboardHeight]);

// ✅ DO: Stable callback references
const handleKeyboardMove = useCallback((e: NativeEvent) => {
  "worklet";
  translateY.value = -e.height;
}, []);
```

---

## 🏗️ Advanced Integration

### Navigation Integration

```typescript
// Stack Navigator with keyboard handling
import { createStackNavigator } from '@react-navigation/stack';
import { KeyboardProvider } from 'react-native-keyboard-controller';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <KeyboardProvider>
        <Stack.Navigator>
          <Stack.Screen 
            name="Chat" 
            component={ChatScreen}
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{ presentation: 'modal' }}
          />
        </Stack.Navigator>
      </KeyboardProvider>
    </NavigationContainer>
  );
}
```

### Modal Handling

```typescript
// Complex modal with keyboard
const ComplexModal = ({ visible, onClose }) => {
  const keyboardHeight = useKeyboardState(state => state.height);
  
  return (
    <Modal visible={visible} animationType="slide">
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
            <TextInput placeholder="Enter message..." />
            <Button title="Close" onPress={onClose} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};
```

### FlatList Integration

```typescript
// Chat interface with keyboard awareness
const ChatScreen = () => {
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const flatListRef = useRef<FlatList>(null);

  const animatedStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboardHeight.value + 10
  }));

  return (
    <View style={{ flex: 1 }}>
      <Reanimated.FlatList
        ref={flatListRef}
        data={messages}
        renderItem={({ item }) => <MessageItem message={item} />}
        contentContainerStyle={animatedStyle}
        keyboardShouldPersistTaps="handled"
        onLayout={() => flatListRef.current?.scrollToEnd()}
      />
      
      <KeyboardStickyView offset={{ opened: 10 }}>
        <MessageInput />
      </KeyboardStickyView>
    </View>
  );
};
```

---

## ✅ Best Practices

### 1. Architecture Decisions

```typescript
// ✅ DO: Determine complexity tier before implementation
// Tier 1 (Simple): Single input - use standard KeyboardAvoidingView
// Tier 2 (Intermediate): Forms - use KeyboardAwareScrollView  
// Tier 3 (Complex): Chat/Dynamic - use full hook system

// ✅ DO: Place KeyboardProvider at app root
<KeyboardProvider>
  <NavigationContainer>
    <AppNavigator />
  </NavigationContainer>
</KeyboardProvider>
```

### 2. Hook Usage Patterns

```typescript
// ✅ DO: Use appropriate hook for use case
const FormScreen = () => {
  // For state reading
  const isVisible = useKeyboardState(state => state.isVisible);
  
  // For animations
  const { height } = useReanimatedKeyboardAnimation();
  
  // For custom interactions
  useKeyboardHandler({
    onMove: (e) => { "worklet"; /* custom logic */ }
  }, []);
};
```

### 3. Component Selection Guide

```typescript
// ✅ DO: Choose right component for layout needs

// Simple forms
<KeyboardAvoidingView behavior="padding">
  <SimpleForm />
</KeyboardAvoidingView>

// Scrollable content with multiple inputs
<KeyboardAwareScrollView>
  <LongForm />
</KeyboardAwareScrollView>

// Floating elements
<KeyboardStickyView offset={{ opened: 10 }}>
  <FloatingButton />
</KeyboardStickyView>

// Modal overlays
<OverKeyboardView visible={showPicker}>
  <EmojiPicker />
</OverKeyboardView>
```

### 4. Performance Optimization

```typescript
// ✅ DO: Optimize re-renders with selectors
const useOptimizedKeyboard = () => {
  const isVisible = useKeyboardState(state => state.isVisible);
  const height = useKeyboardState(state => state.height);
  
  return useMemo(() => ({ isVisible, height }), [isVisible, height]);
};

// ✅ DO: Batch related state updates
const useKeyboardMetrics = () => useKeyboardState(state => ({
  isVisible: state.isVisible,
  height: state.height,
  progress: state.height > 0 ? 1 : 0
}));
```

---

## ❌ Common Pitfalls

### 1. Architecture Anti-patterns

```typescript
// ❌ DON'T: Nest keyboard avoiding components
<KeyboardAvoidingView behavior="padding">
  <KeyboardAwareScrollView> {/* Conflict! */}
    <Content />
  </KeyboardAwareScrollView>
</KeyboardAvoidingView>

// ✅ DO: Choose one approach
<KeyboardAwareScrollView>
  <Content />
</KeyboardAwareScrollView>
```

### 2. Performance Anti-patterns

```typescript
// ❌ DON'T: Access full state unnecessarily
const keyboard = useKeyboardState(); // Re-renders on any change
const containerStyle = {
  paddingBottom: keyboard.height // Only need height
};

// ✅ DO: Use targeted selectors
const height = useKeyboardState(state => state.height);
const containerStyle = { paddingBottom: height };
```

### 3. Worklet Anti-patterns

```typescript
// ❌ DON'T: Missing worklet directive
useKeyboardHandler({
  onMove: (e) => {
    translateY.value = -e.height; // Will fail - no "worklet"
  }
}, []);

// ❌ DON'T: Access React state in worklets
useKeyboardHandler({
  onMove: (e) => {
    "worklet";
    setKeyboardHeight(e.height); // Can't access React state
  }
}, []);

// ✅ DO: Use shared values in worklets
const translateY = useSharedValue(0);
useKeyboardHandler({
  onMove: (e) => {
    "worklet";
    translateY.value = -e.height; // Correct
  }
}, []);
```

### 4. Android-specific Pitfalls

```typescript
// ❌ DON'T: Forget resize mode on Android
const AndroidScreen = () => {
  // Missing useResizeMode() - keyboard won't work properly
  return <FormContent />;
};

// ✅ DO: Always set resize mode for Android
const AndroidScreen = () => {
  useResizeMode(); // Essential for Android
  return <FormContent />;
};
```

---

## 🔧 Platform Specifics

### iOS vs Android Differences

| Feature | iOS | Android | Recommendation |
|---------|-----|---------|----------------|
| KeyboardAvoidingView behavior | `padding` preferred | `height` preferred | Use `Platform.select()` |
| Resize mode requirement | Not needed | Required | Always call `useResizeMode()` |
| Animation timing | 250ms standard | Variable | Let library handle automatically |
| Keyboard events reliability | Very reliable | Can be inconsistent | Use library's normalized events |

### Platform-specific Implementation

```typescript
import { Platform } from 'react-native';

// Platform-specific behavior
const keyboardBehavior = Platform.select({
  ios: 'padding' as const,
  android: 'height' as const,
});

<KeyboardAvoidingView behavior={keyboardBehavior}>
  <FormContent />
</KeyboardAvoidingView>

// Android resize mode handling
const AndroidCompatScreen = () => {
  // Only needed on Android, safe to call on iOS
  useResizeMode();
  
  return <FormContent />;
};
```

### Edge-to-edge and Full-screen Modes

```typescript
// Handle edge-to-edge rendering
const EdgeToEdgeScreen = () => {
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const { top: statusBarHeight } = useSafeAreaInsets();
  
  const animatedStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboardHeight.value,
    paddingTop: statusBarHeight
  }));
  
  return (
    <Reanimated.View style={[{ flex: 1 }, animatedStyle]}>
      <Content />
    </Reanimated.View>
  );
};
```

---

## 📚 Complete API Reference

### Hook Signatures

```typescript
// State management
function useKeyboardState<T>(selector?: (state: KeyboardState) => T): T;
function useKeyboardController(): { setEnabled: (enabled: boolean) => void; enabled: boolean };

// Event handling  
function useKeyboardHandler(handler: KeyboardHandler, deps?: DependencyList): void;
function useFocusedInputHandler(handler: FocusedInputHandler, deps?: DependencyList): void;

// Animation values
function useKeyboardAnimation(): AnimatedContext;
function useReanimatedKeyboardAnimation(): ReanimatedContext;
function useReanimatedFocusedInput(): { input: SharedValue<FocusedInputLayoutChangedEvent | null> };

// Platform utilities
function useResizeMode(): void;
```

### Type Definitions

```typescript
interface KeyboardState {
  isVisible: boolean;
  height: number;
  appearance: 'light' | 'dark';
}

interface NativeEvent {
  progress: number;    // 0-1 keyboard position
  height: number;      // Keyboard height in pixels
  duration: number;    // Animation duration
  target: number;      // Focused TextInput tag
}

interface KeyboardHandler {
  onStart?: (e: NativeEvent) => void;
  onMove?: (e: NativeEvent) => void;
  onEnd?: (e: NativeEvent) => void;
  onInteractive?: (e: NativeEvent) => void;
}

interface FocusedInputHandler {
  onChangeText?: (e: { text: string }) => void;
  onSelectionChange?: (e: FocusedInputSelectionChangedEvent) => void;
}
```

---

## 🐛 Troubleshooting

### Common Issues & Solutions

| Issue | Symptoms | Solution |
|-------|----------|----------|
| Keyboard not detected | No animations, state always false | Call `useResizeMode()` on Android |
| Inputs still covered | ScrollView doesn't scroll to input | Use `KeyboardAwareScrollView` instead of `ScrollView` |
| Animations stuttering | Choppy keyboard transitions | Add "worklet" to all handlers |
| Multiple re-renders | Performance issues | Use selective state access with selectors |
| Modal keyboard conflicts | Keyboard doesn't show in modals | Ensure `KeyboardProvider` wraps modal content |

### Debug Checklist

1. **Android Setup**
   - [ ] `useResizeMode()` called
   - [ ] `windowSoftInputMode` set to `adjustResize` in `AndroidManifest.xml`

2. **Reanimated Integration**  
   - [ ] Reanimated v3+ installed and configured
   - [ ] "worklet" directive in all keyboard handlers
   - [ ] Using shared values instead of React state in worklets

3. **Component Hierarchy**
   - [ ] `KeyboardProvider` at app root
   - [ ] No nested keyboard avoiding components
   - [ ] Correct component choice for use case

### Advanced Debugging

```typescript
// Debug keyboard events
const DebugKeyboard = () => {
  useKeyboardHandler({
    onStart: (e) => {
      "worklet";
      console.log('Keyboard start:', e.height, e.progress, e.target);
    },
    onMove: (e) => {
      "worklet";
      console.log('Keyboard move:', e.height);
    },
    onEnd: (e) => {
      "worklet"; 
      console.log('Keyboard end:', e.height);
    }
  }, []);

  const state = useKeyboardState();
  console.log('Keyboard state:', state);

  return null;
};
```

---

## Expert Analysis Integration

### Reanimated Dependency Considerations

**Strengths:**
- 60fps animations via UI thread execution
- Smooth keyboard tracking with worklets
- Comprehensive event system

**Trade-offs:**
- Learning curve for worklet mental model
- Additional build complexity (Babel plugin, native config)
- Debugging worklets is more challenging than standard JS

**Decision Framework:**
- **Simple forms (1-2 inputs)**: Standard `KeyboardAvoidingView` may suffice
- **Complex UIs (chat, multi-step forms)**: Full library benefits justify complexity
- **Performance-critical apps**: Worklet-based approach essential for smooth UX

### Navigation and Modal Integration Challenges

**Key Considerations:**
- Place `KeyboardProvider` high in component tree for proper context
- Test modal keyboard interactions across different modal implementations
- Validate behavior with stack navigation transitions
- Consider keyboard state during screen transitions

### Android windowSoftInputMode Impact

**Critical Requirements:**
- Use `adjustResize` mode for optimal library functionality
- `adjustPan` significantly limits library effectiveness
- Edge-to-edge rendering requires careful coordinate calculations
- Test thoroughly on devices with different screen configurations

---

## Migration Guide

### From React Native's KeyboardAvoidingView

```typescript
// Before
<KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
  <ScrollView>
    <TextInput />
    <TextInput />
  </ScrollView>
</KeyboardAvoidingView>

// After  
<KeyboardAwareScrollView>
  <TextInput />
  <TextInput />  
</KeyboardAwareScrollView>
```

### From Custom Keyboard Listeners

```typescript
// Before
const [keyboardHeight, setKeyboardHeight] = useState(0);
useEffect(() => {
  const listener = Keyboard.addListener('keyboardDidShow', (e) => {
    setKeyboardHeight(e.endCoordinates.height);
  });
  return () => listener.remove();
}, []);

// After
const keyboardHeight = useKeyboardState(state => state.height);
```

---

**File References:**
- Core hooks: `src/hooks/index.ts:25-240`
- Components: `src/components/*/index.tsx`  
- Types: `src/types/hooks.ts:1-213`
- Examples: `example/src/screens/Examples/`

**Library Info:**
- Version: 1.18.6
- React Native: >=0.63.0
- Reanimated: >=3.0.0
- Platform: iOS, Android

---

*Last Updated: Generated by Claude Opus*  
*Documentation verified against source code*
