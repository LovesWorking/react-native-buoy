# React Native Keyboard Controller - Complete API Documentation

## 📚 Quick Navigation

### Components
- [KeyboardProvider → Root wrapper component](#1-keyboardprovider--root-wrapper-component)
- [KeyboardControllerView → Event dispatcher](#2-keyboardcontrollerview--event-dispatcher)
- [KeyboardGestureArea → Interactive gesture region](#3-keyboardgesturearea--interactive-gesture-region)
- [KeyboardBackgroundView → Keyboard background matching](#4-keyboardbackgroundview--keyboard-background-matching)
- [KeyboardAvoidingView → Smart content avoidance](#5-keyboardavoidingview--smart-content-avoidance)
- [KeyboardAwareScrollView → Automatic scroll adjustment](#6-keyboardawarescrollview--automatic-scroll-adjustment)
- [KeyboardStickyView → Sticky footer component](#7-keyboardstickyview--sticky-footer-component)
- [KeyboardToolbar → iOS-style toolbar](#8-keyboardtoolbar--ios-style-toolbar)
- [OverKeyboardView → Content above keyboard](#9-overkeyboardview--content-above-keyboard)
- [KeyboardExtender → Embed content in keyboard](#10-keyboardextender--embed-content-in-keyboard)

### Hooks
- [useKeyboardAnimation → Animated values](#11-usekeyboardanimation--animated-values)
- [useReanimatedKeyboardAnimation → Reanimated values](#12-usereanimatedkeyboardanimation--reanimated-values)
- [useKeyboardHandler → Keyboard event handler](#13-usekeyboardhandler--keyboard-event-handler)
- [useGenericKeyboardHandler → Handler without resize](#14-usegenerickeyboadhandler--handler-without-resize)
- [useKeyboardController → Enable/disable control](#15-usekeyboardcontroller--enabledisable-control)
- [useReanimatedFocusedInput → Focused input info](#16-usereanimatedfocusedinput--focused-input-info)
- [useFocusedInputHandler → Input change events](#17-usefocusedinputhandler--input-change-events)
- [useResizeMode → Android resize mode](#18-useresizemode--android-resize-mode)
- [useKeyboardState → Keyboard state tracking](#19-usekeyboardstate--keyboard-state-tracking)
- [useWindowDimensions → Window dimensions](#20-usewindowdimensions--window-dimensions)

### Modules & APIs
- [KeyboardController → Imperative methods](#21-keyboardcontroller--imperative-methods)
- [KeyboardEvents → Event listeners](#22-keyboardevents--event-listeners)
- [FocusedInputEvents → Input events](#23-focusedinputevents--input-events)
- [AndroidSoftInputModes → Android constants](#24-androidsoftinputmodes--android-constants)

### Practical Examples
- [Chat App Implementation](#chat-app-implementation)
- [Sticky Input Examples](#sticky-input-examples)
- [Interactive Keyboard](#interactive-keyboard)

---

## Components

### 1. KeyboardProvider → Root wrapper component
*Source: src/context.ts, docs/docs/api/keyboard-provider.md*

Wraps your app and provides keyboard context to all children. Sets up keyboard event listeners and animations.

**Props:**
- `statusBarTranslucent` (boolean, Android) - Makes status bar translucent
- `navigationBarTranslucent` (boolean, Android) - Makes navigation bar translucent
- `preserveEdgeToEdge` (boolean, Android) - Keeps edge-to-edge mode enabled
- `preload` (boolean, iOS) - Preloads keyboard to reduce focus lag (default: true)
- `enabled` (boolean) - Initial enabled state (default: true)

**Example:**
```tsx
import { KeyboardProvider } from "react-native-keyboard-controller";

function App() {
  return (
    <KeyboardProvider
      statusBarTranslucent={true}
      navigationBarTranslucent={true}
      preload={true}
    >
      <YourApp />
    </KeyboardProvider>
  );
}
```

**What NOT to do:**
- Don't nest multiple KeyboardProviders
- Don't use outside of React Native app root
- Don't change `enabled` prop after mount (use `useKeyboardController` instead)

---

### 2. KeyboardControllerView → Event dispatcher
*Source: src/bindings.ts, src/bindings.native.ts*

Low-level component that dispatches keyboard events. Usually wrapped by KeyboardProvider.

**Props:**
- `enabled` (boolean) - Whether to track keyboard events
- `onKeyboardMoveStart` - Fired when keyboard starts moving
- `onKeyboardMove` - Fired during keyboard movement
- `onKeyboardMoveEnd` - Fired when keyboard stops moving

**Example:**
```tsx
<KeyboardControllerView
  enabled={true}
  onKeyboardMove={(e) => console.log('Height:', e.height)}
/>
```

**What NOT to do:**
- Don't use directly unless building custom providers
- Don't use without KeyboardProvider in most cases

---

### 3. KeyboardGestureArea → Interactive gesture region
*Source: src/bindings.ts, docs/docs/api/views/keyboard-gesture-area.mdx*

Creates a region where pan gestures control keyboard position (iOS only).

**Props:**
- `interpolator` - Animation interpolation ("linear" | "ios")
- `showOnSwipeUp` (boolean) - Show keyboard on swipe up
- `enableSwipeToDismiss` (boolean) - Dismiss on swipe down
- `offset` (number) - Offset from keyboard top

**Example:**
```tsx
<KeyboardGestureArea
  interpolator="ios"
  showOnSwipeUp={false}
  enableSwipeToDismiss={true}
>
  <ScrollView>
    <TextInput />
  </ScrollView>
</KeyboardGestureArea>
```

**What NOT to do:**
- Don't use on Android (iOS only feature)
- Don't nest multiple gesture areas
- Don't use without interactive keyboard setup

---

### 4. KeyboardBackgroundView → Keyboard background matching
*Source: src/specs/KeyboardBackgroundViewNativeComponent.ts*

Matches the keyboard background color and appearance.

**Props:**
- `color` (string) - Background color
- `useSafeArea` (boolean) - Apply safe area insets

**Example:**
```tsx
<KeyboardBackgroundView
  color="#FFFFFF"
  useSafeArea={true}
/>
```

---

### 5. KeyboardAvoidingView → Smart content avoidance
*Source: src/components/KeyboardAvoidingView/index.tsx, example/src/screens/Examples/KeyboardAvoidingView/index.tsx*

Better alternative to React Native's KeyboardAvoidingView. Automatically adjusts content when keyboard appears.

**Props:**
- `behavior` ("height" | "position" | "padding") - How to adjust
- `keyboardVerticalOffset` (number) - Additional offset
- `enabled` (boolean) - Enable/disable avoiding

**Example:**
```tsx
import { KeyboardAvoidingView } from "react-native-keyboard-controller";

<KeyboardAvoidingView 
  behavior="padding"
  keyboardVerticalOffset={0}
>
  <TextInput />
  <Button title="Submit" />
</KeyboardAvoidingView>
```

**What NOT to do:**
- Don't use React Native's KeyboardAvoidingView with this
- Don't nest multiple KeyboardAvoidingViews
- Don't use negative offsets without testing

---

### 6. KeyboardAwareScrollView → Automatic scroll adjustment
*Source: src/components/KeyboardAwareScrollView/index.tsx, example/src/screens/Examples/AwareScrollView/index.tsx*

ScrollView that automatically scrolls to focused input when keyboard appears.

**Props:**
- `bottomOffset` (number) - Extra bottom padding (default: 20)
- `snapToOffsets` (number[]) - Snap points for scrolling
- `disableScrollOnKeyboardHide` (boolean) - Prevent scroll on hide
- `enabled` (boolean) - Enable auto-scroll

**Example:**
```tsx
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

<KeyboardAwareScrollView
  bottomOffset={50}
  snapToOffsets={[0, 100, 200]}
>
  <TextInput placeholder="Name" />
  <TextInput placeholder="Email" />
  <TextInput placeholder="Password" />
</KeyboardAwareScrollView>
```

**What NOT to do:**
- Don't use with FlatList (use FlatList's built-in keyboard handling)
- Don't disable while keyboard is visible
- Don't use excessive bottomOffset values

---

### 7. KeyboardStickyView → Sticky footer component  
*Source: src/components/KeyboardStickyView/index.tsx*

Sticks a view to the top of the keyboard, moving with it.

**Props:**
- `offset` (Animated.Value) - Additional animated offset
- `children` - Content to stick above keyboard

**Example:**
```tsx
import { KeyboardStickyView } from "react-native-keyboard-controller";

<KeyboardStickyView>
  <View style={styles.toolbar}>
    <Button title="Done" onPress={handleDone} />
  </View>
</KeyboardStickyView>
```

---

### 8. KeyboardToolbar → iOS-style toolbar
*Source: src/components/KeyboardToolbar/index.tsx, example/src/screens/Examples/Toolbar/index.tsx*

iOS-style toolbar with next/previous/done buttons for form navigation.

**Props:**
- `content` - Custom middle content component
- `doneText` (string) - Done button text
- `showArrows` (boolean) - Show navigation arrows
- `theme` - Custom theme object
- `blur` (boolean) - Enable blur effect (iOS)
- `opacity` (Animated.Value) - Toolbar opacity

**Example:**
```tsx
import { KeyboardToolbar } from "react-native-keyboard-controller";

<KeyboardToolbar
  doneText="Complete"
  showArrows={true}
  content={() => <Text>3 of 5</Text>}
/>
```

**What NOT to do:**
- Don't use on Android without testing (iOS-optimized)
- Don't override theme partially (provide complete theme)

---

### 9. OverKeyboardView → Content above keyboard
*Source: src/views/OverKeyboardView/index.tsx, example/src/screens/Examples/OverKeyboardView/index.tsx*

Displays content that floats above the keyboard.

**Props:**
- `visible` (boolean) - Show/hide the view
- `children` - Content to display

**Example:**
```tsx
import { OverKeyboardView } from "react-native-keyboard-controller";

const [showSuggestions, setShowSuggestions] = useState(false);

<OverKeyboardView visible={showSuggestions}>
  <View style={styles.suggestions}>
    <Text onPress={() => setText("Hello")}>Hello</Text>
    <Text onPress={() => setText("Thanks")}>Thanks</Text>
  </View>
</OverKeyboardView>
```

---

### 10. KeyboardExtender → Embed content in keyboard
*Source: src/views/KeyboardExtender/index.tsx, example/src/screens/Examples/KeyboardExtender/index.tsx*

Embeds content directly into the keyboard area (iOS 15+).

**Props:**
- `children` - Content to embed
- `height` (number) - Height of embedded content

**Example:**
```tsx
import { KeyboardExtender } from "react-native-keyboard-controller";

<KeyboardExtender height={50}>
  <View style={styles.emojiPicker}>
    <Text>😀 😂 ❤️ 👍</Text>
  </View>
</KeyboardExtender>
```

---

## Hooks

### 11. useKeyboardAnimation → Animated values
*Source: src/hooks/index.ts:49-54, example/src/components/KeyboardAnimation/index.tsx*

Returns Animated.Value objects for keyboard height and progress.

**Returns:**
- `height` (Animated.Value) - Keyboard height
- `progress` (Animated.Value) - Progress 0-1

**Example:**
```tsx
import { useKeyboardAnimation } from "react-native-keyboard-controller";

function MyComponent() {
  const { height, progress } = useKeyboardAnimation();
  
  return (
    <Animated.View
      style={{
        transform: [{ 
          translateY: height.interpolate({
            inputRange: [0, 300],
            outputRange: [0, -300]
          })
        }]
      }}
    />
  );
}
```

---

### 12. useReanimatedKeyboardAnimation → Reanimated values
*Source: src/hooks/index.ts:70-75*

Returns Reanimated shared values for keyboard animation.

**Returns:**
- `height` (SharedValue) - Keyboard height
- `progress` (SharedValue) - Progress 0-1

**Example:**
```tsx
import { useReanimatedKeyboardAnimation } from "react-native-keyboard-controller";

function MyComponent() {
  const { height, progress } = useReanimatedKeyboardAnimation();
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -height.value }]
  }));
  
  return <Reanimated.View style={animatedStyle} />;
}
```

---

### 13. useKeyboardHandler → Keyboard event handler
*Source: src/hooks/index.ts:152-158, example/src/components/KeyboardAnimation/index.tsx:17-33*

Handle keyboard events with workletized callbacks.

**Parameters:**
- `handler` - Object with onStart/onMove/onEnd/onInteractive
- `deps` - Dependency array

**Example:**
```tsx
const height = useSharedValue(0);

useKeyboardHandler({
  onMove: (e) => {
    'worklet';
    height.value = e.height;
  },
  onEnd: (e) => {
    'worklet';
    height.value = e.height;
  }
}, []);
```

---

### 14. useGenericKeyboardHandler → Handler without resize
*Source: src/hooks/index.ts:108-119*

Like useKeyboardHandler but doesn't set resize mode.

**Example:**
```tsx
useGenericKeyboardHandler({
  onMove: (e) => {
    'worklet';
    console.log('Keyboard height:', e.height);
  }
}, []);
```

---

### 15. useKeyboardController → Enable/disable control
*Source: src/hooks/index.ts:183-187*

Control keyboard tracking enable/disable state.

**Returns:**
- `enabled` (boolean) - Current state
- `setEnabled` (function) - Toggle function

**Example:**
```tsx
const { enabled, setEnabled } = useKeyboardController();

<Switch
  value={enabled}
  onValueChange={setEnabled}
/>
```

---

### 16. useReanimatedFocusedInput → Focused input info
*Source: src/hooks/index.ts:202-206*

Get layout info of currently focused input.

**Returns:**
- `input` (SharedValue) - Input layout data

**Example:**
```tsx
const { input } = useReanimatedFocusedInput();

const style = useAnimatedStyle(() => ({
  height: input.value?.layout?.height || 0
}));
```

---

### 17. useFocusedInputHandler → Input change events
*Source: src/hooks/index.ts:225-236*

Handle focused input text/selection changes.

**Parameters:**
- `handler` - Object with onChangeText/onSelectionChange

**Example:**
```tsx
useFocusedInputHandler({
  onChangeText: (e) => {
    console.log('Text:', e.text);
  },
  onSelectionChange: (e) => {
    console.log('Selection:', e.selection);
  }
}, []);
```

---

### 18. useResizeMode → Android resize mode
*Source: src/hooks/index.ts:25-33*

Sets Android soft input to resize mode.

**Example:**
```tsx
function MyScreen() {
  useResizeMode(); // Sets resize on mount, restores on unmount
  return <View />;
}
```

---

### 19. useKeyboardState → Keyboard state tracking
*Source: src/hooks/useKeyboardState/index.ts:43-75*

Track keyboard visibility and properties reactively.

**Parameters:**
- `selector` (optional) - Function to select specific state

**Returns:**
- Keyboard state or selected value

**Example:**
```tsx
// Get full state
const state = useKeyboardState();

// Select specific property
const isVisible = useKeyboardState(state => state.isVisible);
const height = useKeyboardState(state => state.height);

<Text>Keyboard: {isVisible ? `Open (${height}px)` : 'Closed'}</Text>
```

---

### 20. useWindowDimensions → Window dimensions
*Source: src/hooks/useWindowDimensions/index.ts*

Track window dimensions changes.

**Returns:**
- `width` (number) - Window width
- `height` (number) - Window height

**Example:**
```tsx
const { width, height } = useWindowDimensions();

<View style={{ width: width * 0.8, height: height * 0.5 }} />
```

---

## Modules & APIs

### 21. KeyboardController → Imperative methods
*Source: src/module.ts:53-61*

Module for imperative keyboard control.

**Methods:**
- `dismiss(options?)` - Hide keyboard
- `setFocusTo(direction)` - Move focus ("next" | "prev" | "current")
- `preload()` - Preload keyboard (iOS)
- `setInputMode(mode)` - Set Android input mode
- `setDefaultMode()` - Reset to default mode (Android)
- `isVisible()` - Check if visible
- `state()` - Get current state

**Example:**
```tsx
import { KeyboardController } from "react-native-keyboard-controller";

// Dismiss keyboard
await KeyboardController.dismiss();

// Keep focus while dismissing
await KeyboardController.dismiss({ keepFocus: true });

// Move focus
KeyboardController.setFocusTo("next");

// Check visibility
if (KeyboardController.isVisible()) {
  console.log("Keyboard is open");
}
```

---

### 22. KeyboardEvents → Event listeners
*Source: src/bindings.ts:36-38*

Subscribe to keyboard events.

**Events:**
- `keyboardWillShow` - Before keyboard appears (iOS)
- `keyboardDidShow` - After keyboard appears
- `keyboardWillHide` - Before keyboard hides (iOS)
- `keyboardDidHide` - After keyboard hides

**Example:**
```tsx
import { KeyboardEvents } from "react-native-keyboard-controller";

useEffect(() => {
  const show = KeyboardEvents.addListener("keyboardDidShow", (e) => {
    console.log("Keyboard height:", e.height);
  });
  
  const hide = KeyboardEvents.addListener("keyboardDidHide", () => {
    console.log("Keyboard hidden");
  });
  
  return () => {
    show.remove();
    hide.remove();
  };
}, []);
```

---

### 23. FocusedInputEvents → Input events
*Source: src/bindings.ts:43-45*

Track focused input changes (internal API).

**Events:**
- `focusDidSet` - Input received focus
- `focusDidChanged` - Focus changed

**Example:**
```tsx
import { FocusedInputEvents } from "react-native-keyboard-controller";

const subscription = FocusedInputEvents.addListener("focusDidSet", (e) => {
  console.log("Focused input:", e);
});
```

---

### 24. AndroidSoftInputModes → Android constants
*Source: src/constants.ts:2-19*

Android keyboard behavior constants.

**Constants:**
- `SOFT_INPUT_ADJUST_NOTHING` (48)
- `SOFT_INPUT_ADJUST_PAN` (32)
- `SOFT_INPUT_ADJUST_RESIZE` (16)
- `SOFT_INPUT_ADJUST_UNSPECIFIED` (0)

**Example:**
```tsx
import { 
  KeyboardController,
  AndroidSoftInputModes 
} from "react-native-keyboard-controller";

// Set resize mode
KeyboardController.setInputMode(
  AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE
);

// Set pan mode
KeyboardController.setInputMode(
  AndroidSoftInputModes.SOFT_INPUT_ADJUST_PAN
);
```

---

## Practical Examples

### Chat App Implementation

**Sticky Input with Send Button:**
```tsx
import {
  KeyboardStickyView,
  KeyboardAwareScrollView,
  useKeyboardAnimation
} from "react-native-keyboard-controller";

function ChatScreen() {
  const { height } = useKeyboardAnimation();
  const [message, setMessage] = useState("");
  
  return (
    <View style={{ flex: 1 }}>
      <KeyboardAwareScrollView>
        {messages.map(msg => <Message key={msg.id} {...msg} />)}
      </KeyboardAwareScrollView>
      
      <KeyboardStickyView>
        <Animated.View 
          style={[styles.inputContainer, {
            transform: [{ translateY: height }]
          }]}
        >
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            style={styles.input}
          />
          <TouchableOpacity onPress={sendMessage}>
            <Text>Send</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardStickyView>
    </View>
  );
}
```

### Sticky Input Examples

**Form with Toolbar:**
```tsx
function FormWithToolbar() {
  const [currentField, setCurrentField] = useState(0);
  
  return (
    <>
      <KeyboardAwareScrollView>
        <TextInput 
          placeholder="First Name"
          onFocus={() => setCurrentField(0)}
        />
        <TextInput 
          placeholder="Last Name" 
          onFocus={() => setCurrentField(1)}
        />
        <TextInput 
          placeholder="Email"
          onFocus={() => setCurrentField(2)}
        />
      </KeyboardAwareScrollView>
      
      <KeyboardToolbar
        showArrows={true}
        content={() => <Text>{currentField + 1} of 3</Text>}
        doneText="Submit"
      />
    </>
  );
}
```

### Interactive Keyboard

**Dismissible with Gesture:**
```tsx
function InteractiveInput() {
  const height = useSharedValue(0);
  
  useKeyboardHandler({
    onInteractive: (e) => {
      'worklet';
      height.value = e.height;
    }
  }, []);
  
  return (
    <KeyboardGestureArea
      interpolator="ios"
      enableSwipeToDismiss={true}
    >
      <Reanimated.View
        style={[styles.container, {
          paddingBottom: height
        }]}
      >
        <TextInput placeholder="Swipe down to dismiss" />
      </Reanimated.View>
    </KeyboardGestureArea>
  );
}
```

**Media Picker Above Keyboard:**
```tsx
function MediaInput() {
  const [showPicker, setShowPicker] = useState(false);
  
  return (
    <>
      <TextInput placeholder="Message" />
      
      <OverKeyboardView visible={showPicker}>
        <View style={styles.mediaPicker}>
          <TouchableOpacity onPress={pickImage}>
            <Text>📷 Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={pickVideo}>
            <Text>🎥 Video</Text>
          </TouchableOpacity>
        </View>
      </OverKeyboardView>
      
      <Button
        title="Media"
        onPress={() => setShowPicker(!showPicker)}
      />
    </>
  );
}
```

---

## Common Patterns & Best Practices

### When to Use Each Component

| Use Case | Component | Why |
|----------|-----------|-----|
| Chat input | KeyboardStickyView | Keeps input visible above keyboard |
| Long forms | KeyboardAwareScrollView | Auto-scrolls to focused field |
| Modals | KeyboardAvoidingView | Adjusts modal content |
| Toolbars | KeyboardToolbar | Navigation between fields |
| Suggestions | OverKeyboardView | Float content above keyboard |
| Emoji picker | KeyboardExtender | Embed in keyboard (iOS) |

### Performance Tips

1. **Use selectors with useKeyboardState:**
```tsx
// Good - only re-renders on visibility change
const isVisible = useKeyboardState(s => s.isVisible);

// Bad - re-renders on any state change
const state = useKeyboardState();
const isVisible = state.isVisible;
```

2. **Memoize keyboard handlers:**
```tsx
const handler = useCallback({
  onMove: (e) => {
    'worklet';
    height.value = e.height;
  }
}, []);

useKeyboardHandler(handler, []);
```

3. **Avoid excessive re-renders:**
```tsx
// Use Reanimated for smooth animations
const { height } = useReanimatedKeyboardAnimation();
const style = useAnimatedStyle(() => ({
  transform: [{ translateY: -height.value }]
}));
```

### Platform Differences

| Feature | iOS | Android |
|---------|-----|---------|
| KeyboardGestureArea | ✅ | ❌ |
| KeyboardExtender | ✅ (iOS 15+) | ❌ |
| willShow/willHide events | ✅ | ❌ |
| Interactive dismissal | ✅ | Limited |
| Toolbar blur effect | ✅ | ❌ |
| setInputMode | ❌ | ✅ |

---

## Migration from React Native

### KeyboardAvoidingView
```tsx
// React Native
import { KeyboardAvoidingView } from "react-native";
<KeyboardAvoidingView behavior="padding" />

// Keyboard Controller
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
<KeyboardAvoidingView behavior="padding" />
```

### Keyboard API
```tsx
// React Native
import { Keyboard } from "react-native";
Keyboard.dismiss();
Keyboard.addListener("keyboardDidShow", handler);

// Keyboard Controller
import { KeyboardController, KeyboardEvents } from "react-native-keyboard-controller";
KeyboardController.dismiss();
KeyboardEvents.addListener("keyboardDidShow", handler);
```

---

## Troubleshooting

**Keyboard not tracking on Android:**
- Ensure KeyboardProvider wraps your app
- Check `windowSoftInputMode` in AndroidManifest.xml
- Use `useResizeMode()` hook

**iOS gesture not working:**
- KeyboardGestureArea is iOS only
- Check interpolator prop is set
- Ensure it wraps scrollable content

**Toolbar not showing:**
- Place after/outside ScrollView
- Check keyboard is actually visible
- Verify KeyboardProvider is present

---

## Version Compatibility

| Library Version | React Native | Notes |
|----------------|--------------|-------|
| 1.18.0+ | 0.72+ | Latest features |
| 1.15.0+ | 0.70+ | OverKeyboardView support |
| 1.12.0+ | 0.68+ | KeyboardToolbar added |
| 1.0.0+ | 0.65+ | Basic functionality |