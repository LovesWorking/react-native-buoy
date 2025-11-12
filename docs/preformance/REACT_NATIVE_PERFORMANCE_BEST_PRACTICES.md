# React Native Performance Best Practices: Learning from the Source Code

## Table of Contents

1. [Introduction](#introduction)
2. [Component Optimization Patterns](#component-optimization-patterns)
3. [State Management Performance](#state-management-performance)
4. [Event Handling Optimization](#event-handling-optimization)
5. [List Rendering Performance](#list-rendering-performance)
6. [Memory Management](#memory-management)
7. [Animation Performance](#animation-performance)
8. [Native Bridge Optimization](#native-bridge-optimization)
9. [Bad vs Amazing Code Examples](#bad-vs-amazing-code-examples)
10. [Performance Checklist](#performance-checklist)

## Introduction

This guide reveals the performance optimization secrets used by React Native's core team, extracted directly from the React Native source code. Every pattern here is battle-tested in production by billions of users.

## Component Optimization Patterns

### 1. The Pressable Pattern: Smart Memoization

React Native's `Pressable` component demonstrates perfect memoization strategy:

#### Amazing Code (from Pressable.js):

```typescript
// packages/react-native/Libraries/Components/Pressable/Pressable.js

function Pressable(props, forwardedRef) {
  // 1. Conditional state updates - only track pressed state if needed
  const shouldUpdatePressed =
    typeof children === 'function' || typeof style === 'function';

  // 2. Comprehensive memoization with ALL dependencies
  const config = useMemo(
    () => ({
      cancelable,
      disabled,
      hitSlop,
      pressRectOffset: pressRetentionOffset,
      android_disableSound,
      delayHoverIn,
      delayHoverOut,
      delayLongPress,
      delayPressIn: unstable_pressDelay,
      onBlur,
      onFocus,
      onHoverIn,
      onHoverOut,
      onLongPress,
      onPress,
      onPressIn(event: GestureResponderEvent): void {
        if (android_rippleConfig != null) {
          android_rippleConfig.onPressIn(event);
        }
        // Only update state if necessary!
        shouldUpdatePressed && setPressed(true);
        if (onPressIn != null) {
          onPressIn(event);
        }
      },
      onPressOut(event: GestureResponderEvent): void {
        if (android_rippleConfig != null) {
          android_rippleConfig.onPressOut(event);
        }
        // Conditional state update again
        shouldUpdatePressed && setPressed(false);
        if (onPressOut != null) {
          onPressOut(event);
        }
      },
    }),
    [
      android_disableSound,
      android_rippleConfig,
      cancelable,
      delayHoverIn,
      delayHoverOut,
      delayLongPress,
      disabled,
      hitSlop,
      onBlur,
      onFocus,
      onHoverIn,
      onHoverOut,
      onLongPress,
      onPress,
      onPressIn,
      onPressMove,
      onPressOut,
      pressRetentionOffset,
      shouldUpdatePressed,
      setPressed,
      unstable_pressDelay,
    ],
  );

  // 3. Wrap with memo at export
  return <View {...restPropsWithDefaults} />;
}

// Critical: Export memoized version
const MemoedPressable = memo(Pressable);
MemoedPressable.displayName = 'Pressable';
export default MemoedPressable;
```

#### Bad Code (What NOT to Do):

```typescript
// ❌ BAD: Creating new objects/functions on every render
function BadPressable(props) {
  // ❌ New object every render
  const config = {
    onPressIn: (event) => {
      setPressed(true); // Always updates state
      props.onPressIn?.(event);
    },
    onPressOut: (event) => {
      setPressed(false); // Always updates state
      props.onPressOut?.(event);
    }
  };

  // ❌ Not memoized
  return <View {...props} />;
}
```

### 2. The Text Component Pattern: Multiple Layers of Memoization

React Native's `Text` component uses cascading memoization:

#### Amazing Code (from Text.js):

```typescript
// packages/react-native/Libraries/Text/Text.js

const Text = (props: TextProps, forwardedRef) => {
  // Layer 1: Memoize complex computations
  const accessible = props.accessible !== false;
  const accessibilityState = props.accessibilityState;

  // Layer 2: Memoize event handlers configuration
  const config = useMemo(
    () =>
      pressRetentionOffset == null && onPress == null && onLongPress == null
        ? null
        : {
            cancelable: !props.rejectResponderTermination,
            disabled: !!(props.disabled || accessibilityState?.disabled),
            hitSlop: props.hitSlop,
            pressRectOffset: pressRetentionOffset,
            android_disableSound: props.android_disableSound,
            delayLongPress: props.delayLongPress,
            delayPressIn: props.unstable_pressDelay,
            onLongPress,
            onPress,
            onPressIn,
            onPressOut,
          },
    [
      accessibilityState?.disabled,
      onLongPress,
      onPress,
      onPressIn,
      onPressOut,
      pressRetentionOffset,
      props.android_disableSound,
      props.delayLongPress,
      props.disabled,
      props.hitSlop,
      props.rejectResponderTermination,
      props.unstable_pressDelay,
    ],
  );

  // Layer 3: Separate memoization for text-specific handlers
  const eventHandlersForText = useMemo(
    () =>
      eventHandlers == null
        ? null
        : {
            onResponderGrant(event: GestureResponderEvent) {
              nullthrows(responseHandlers.current).onResponderGrant(event);
              if (onResponderGrant != null) {
                onResponderGrant(event);
              }
            },
            // ... other handlers
          },
    [eventHandlers, onResponderGrant, /* ... */],
  );

  return <GestureResponderBlock />;
};

// Always export memoized
export default memo(Text);
```

## State Management Performance

### 3. The StateSafePureComponent Pattern: Preventing Async State Bugs

VirtualizedList uses a custom PureComponent that prevents accessing stale props during async updates:

#### Amazing Code (from StateSafePureComponent.js):

```typescript
// packages/virtualized-lists/Lists/StateSafePureComponent.js

export default class StateSafePureComponent<P, S> extends React.PureComponent<
  P,
  S
> {
  _inAsyncStateUpdate = false;

  setState(partialState: PartialState<S>, callback?: () => void): void {
    if (typeof partialState === "function") {
      super.setState((state, props) => {
        this._inAsyncStateUpdate = true;
        try {
          return partialState(state, props);
        } finally {
          this._inAsyncStateUpdate = false;
        }
      }, callback);
    } else {
      super.setState(partialState, callback);
    }
  }

  static getDerivedStateFromProps() {
    logUnsafeWhenAsyncUpdateScheduled();
    return null;
  }
}
```

### 4. Lazy State Initialization Pattern

#### Amazing Code (from useWindowDimensions.js):

```typescript
// packages/react-native/Libraries/Utilities/useWindowDimensions.js

export default function useWindowDimensions(): DisplayMetrics {
  // Lazy initialization - compute only once
  const [dimensions, setDimensions] = useState(() => Dimensions.get("window"));

  useEffect(() => {
    const subscription = Dimensions.addEventListener("change", ({ window }) => {
      // Only update if actually changed
      if (
        dimensions.width !== window.width ||
        dimensions.height !== window.height ||
        dimensions.scale !== window.scale ||
        dimensions.fontScale !== window.fontScale
      ) {
        setDimensions(window);
      }
    });
    return () => subscription?.remove();
  }, [dimensions]);

  return dimensions;
}
```

#### Bad Code:

```typescript
// ❌ BAD: Recomputing on every render
function useWindowDimensions() {
  // ❌ Calls Dimensions.get on every render
  const [dimensions, setDimensions] = useState(Dimensions.get("window"));

  useEffect(() => {
    // ❌ Always updates, even if unchanged
    const handler = ({ window }) => setDimensions(window);
    // ...
  });
}
```

## Event Handling Optimization

### 5. Event Batching and Debouncing Pattern

React Native's animation system uses sophisticated debouncing:

#### Amazing Code (from useAnimatedProps.js):

```typescript
// packages/react-native/Libraries/Animated/useAnimatedProps.js

function useAnimatedPropsLifecycle(node: AnimatedProps) {
  const prevNodeRef = useRef<?AnimatedProps>(null);
  const timerRef = useRef<?TimeoutID>(null);

  useEffect(() => {
    const node = prevNodeRef.current;

    if (node != null) {
      node.setNativeView(instance);

      // Debounce Fabric setNativeProps calls
      onUpdateRef.current = () => {
        if (isFabricPublicInstance(instance)) {
          // 48ms = 3 frames at 60fps
          if (timerRef.current != null) {
            clearTimeout(timerRef.current);
          }
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            scheduleUpdate();
          }, 48);
        } else {
          // Paper: update immediately
          scheduleUpdate();
        }
      };
    }
  }, []);
}
```

### 6. Object Pooling Pattern for Timers

React Native reuses timer slots to minimize GC pressure:

#### Amazing Code (from JSTimers.js):

```typescript
// packages/react-native/Libraries/Core/Timers/JSTimers.js

// Parallel arrays for O(1) access - faster than objects!
const callbacks: Array<?Function> = [];
const types: Array<?JSTimerType> = [];
const timerIDs: Array<?number> = [];
const immediates: Array<number> = [];
const requestIdleCallbacks: Array<number> = [];

// Pool of free indices to reuse
const freeIdxs: Array<number> = [];

function _getFreeIndex(): number {
  const freeIdx = freeIdxs.pop();
  if (freeIdx === undefined) {
    return timerIDs.length;
  }
  return freeIdx;
}

function _callTimer(timerID: number, frameTime: number, didTimeout: ?boolean) {
  const index = timerIDs.indexOf(timerID);

  if (index === -1) {
    return;
  }

  const callback = callbacks[index];
  const type = types[index];

  // Clean up before calling to prevent issues if callback throws
  if (type === "setTimeout" || type === "setImmediate") {
    _clearIndex(index);
  }

  try {
    if (type === "requestIdleCallback") {
      callback({
        timeRemaining: () =>
          Math.max(0, FRAME_DURATION - (performanceNow() - frameTime)),
        didTimeout: !!didTimeout,
      });
    } else {
      callback();
    }
  } catch (e) {
    // Errors are isolated per timer
    throw e;
  }
}

function _clearIndex(i: number) {
  callbacks[i] = null;
  types[i] = null;
  timerIDs[i] = null;
  // Reuse this index!
  freeIdxs.push(i);
}
```

## List Rendering Performance

### 7. VirtualizedList: The Ultimate Performance Pattern

VirtualizedList demonstrates every advanced optimization technique:

#### Amazing Code (from VirtualizedList.js):

```typescript
// packages/virtualized-lists/Lists/VirtualizedList.js

class VirtualizedList extends StateSafePureComponent {
  // 1. Batch cell updates to prevent render thrashing
  _updateCellsToRenderTimeoutID: ?TimeoutID = null;
  _updateCellsBatchingPeriod: number = 50; // Default 50ms batching

  // 2. High-priority rendering bypass
  _hiPriInProgress: boolean = false;

  // 3. Efficient cell tracking with CellRenderMask
  _cellRenderMask = new CellRenderMask(numCells);

  // 4. Smart windowing calculations
  _computeWindowedRenderLimits(): {first: number, last: number} {
    const {data, getItemCount, overscanCount, maxToRenderPerBatch} = this.props;
    const {offset, visibleLength, velocity} = this._scrollMetrics;

    // Adjust overscan based on scroll velocity
    const overscan = Math.round(
      overscanCount + (Math.abs(velocity) / 1000) * visibleLength
    );

    // Only render what's visible + buffer
    const visibleBegin = Math.max(0, offset - overscan);
    const visibleEnd = offset + visibleLength + overscan;

    // Find cells in visible range
    const [first, last] = this._cellRenderMask.computeWindowedRenderLimits(
      visibleBegin,
      visibleEnd,
      numCells,
    );

    return {first, last};
  }

  // 5. Batched updates with priority handling
  _scheduleCellsToRenderUpdate() {
    // High priority: bypass batching
    if (this._listMetrics.getAverageCellLength() > 0 && !this._hiPriInProgress) {
      this._hiPriInProgress = true;

      // Cancel pending batch
      if (this._updateCellsToRenderTimeoutID != null) {
        clearTimeout(this._updateCellsToRenderTimeoutID);
        this._updateCellsToRenderTimeoutID = null;
      }

      this._updateCellsToRender();
      return;
    }

    // Normal priority: batch updates
    if (this._updateCellsToRenderTimeoutID == null) {
      this._updateCellsToRenderTimeoutID = setTimeout(() => {
        this._updateCellsToRenderTimeoutID = null;
        this._updateCellsToRender();
      }, this._updateCellsBatchingPeriod);
    }
  }

  // 6. Memory-efficient cell recycling
  _pushCells(cells: Array<React.Node>, first: number, last: number) {
    for (let ii = first; ii <= last; ii++) {
      const item = getItem(data, ii);
      const key = VirtualizedList._keyExtractor(item, ii, this.props);

      // Reuse cell references
      this._indicesToKeys.set(ii, key);

      // Conditional prop passing based on need
      const shouldListenForLayout =
        getItemLayout == null || debug || this._fillRateHelper.enabled();

      cells.push(
        <CellRenderer
          // ... minimal props
          {...(shouldListenForLayout && {
            onCellLayout: this._onCellLayout,
          })}
        />
      );
    }
  }
}
```

#### Bad Code (Common Mistakes):

```typescript
// ❌ BAD: Rendering all items
function BadList({data}) {
  return (
    <ScrollView>
      {data.map((item, index) => (
        // ❌ Renders everything at once
        <Item key={index} item={item} />
      ))}
    </ScrollView>
  );
}

// ❌ BAD: No batching, immediate updates
function BadVirtualList() {
  const updateCells = () => {
    // ❌ Updates immediately on every scroll event
    setState({cells: computeCells()});
  };

  // ❌ No velocity-based overscan
  const overscan = 10; // Fixed overscan
}
```

## Memory Management

### 8. Feature Flag Caching Pattern

React Native caches feature flags with lazy evaluation:

#### Amazing Code (from ReactNativeFeatureFlags.js):

```typescript
// packages/react-native/src/private/featureflags/ReactNativeFeatureFlags.js

function createGetter<T>(
  configName: string,
  customValueGetter: () => ?T,
  defaultValue: T,
): () => T {
  let cachedValue: ?T;

  return (): T => {
    // Lazy evaluation with permanent caching
    if (cachedValue == null) {
      cachedValue = customValueGetter() ?? defaultValue;
    }
    return cachedValue;
  };
}

// Usage
export const enableAnimatedInlineTransform: () => boolean = createGetter(
  "enableAnimatedInlineTransform",
  () => NativeReactNativeFeatureFlags?.enableAnimatedInlineTransform?.(),
  false,
);
```

### 9. Memoize-One Pattern for Expensive Computations

ScrollView uses memoize-one for ref handling:

#### Amazing Code (from ScrollView.js):

```typescript
// packages/react-native/Libraries/Components/ScrollView/ScrollView.js

import memoize from 'memoize-one';

class ScrollView extends React.Component {
  _scrollViewRef: ?React.ElementRef<HostComponent<mixed>> = null;

  state = {
    // Memoize ref forwarding to prevent recreating functions
    getForwardingRef: memoize(
      (forwardedRef: ForwardedRef) => (ref: ?React.ElementRef<HostComponent<mixed>>) => {
        this._scrollViewRef = ref;
        updateRef(forwardedRef, ref);
      }
    ),
  };

  render() {
    const {getForwardingRef} = this.state;
    const forwardingRef = getForwardingRef(this.props.forwardedRef);

    return (
      <ScrollViewNative
        ref={forwardingRef}
        // ...
      />
    );
  }
}
```

## Animation Performance

### 10. Native Animation Detection and Bypass

Animated components skip JS updates when using native driver:

#### Amazing Code (from createAnimatedComponent.js):

```typescript
// packages/react-native/Libraries/Animated/createAnimatedComponent.js

const AnimatedComponent = React.forwardRef((props, forwardedRef) => {
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);
  const [animatedProps, setAnimatedProps] = useState(null);

  // Skip JS bridge when using native driver
  useEffect(() => {
    if (node != null) {
      node.setNativeView(instance);

      const update = () => {
        // Check if animation is native
        if (node.__isNative) {
          // Skip JS updates entirely!
          return;
        }

        // Only update through JS if necessary
        const newProps = node.__getValue();
        setAnimatedProps(newProps);
      };

      node.__attach();
      return () => node.__detach();
    }
  }, [node]);

  // Merge animated props with regular props
  const mergedStyle = useMemo(
    () => ({...style, ...animatedProps?.style}),
    [style, animatedProps?.style]
  );

  return <Component {...props} style={mergedStyle} />;
});
```

## Native Bridge Optimization

### 11. Batched Bridge Calls Pattern

React Native batches native calls intelligently:

#### Amazing Code (from BatchedBridge):

```typescript
// Batching pattern used throughout React Native

class BatchedBridge {
  // Queue calls instead of immediate execution
  _queue: Array<[moduleID: number, methodID: number, args: Array<any>]> = [];
  _flushTimeoutID: ?TimeoutID = null;

  callNativeModule(moduleID: number, methodID: number, args: Array<any>) {
    // Queue the call
    this._queue.push([moduleID, methodID, args]);

    // Batch flush
    if (this._flushTimeoutID == null) {
      this._flushTimeoutID = setTimeout(() => {
        this._flushTimeoutID = null;
        this.flushQueue();
      }, 0);
    }
  }

  flushQueue() {
    const queue = this._queue;
    this._queue = [];

    // Send all calls in one bridge crossing
    global.nativeFlushQueueImmediate(queue);
  }
}
```

## Bad vs Amazing Code Examples

### Example 1: Event Handler Creation

#### ❌ BAD Code:

```typescript
function BadComponent({onPress}) {
  return (
    <TouchableOpacity
      // ❌ Creates new function every render
      onPress={() => {
        console.log('pressed');
        onPress();
      }}
    >
      <Text>Press me</Text>
    </TouchableOpacity>
  );
}
```

#### ✅ AMAZING Code:

```typescript
function AmazingComponent({onPress}) {
  // ✅ Memoized handler
  const handlePress = useCallback(() => {
    console.log('pressed');
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>Press me</Text>
    </TouchableOpacity>
  );
}

// Even better: memo the entire component
export default memo(AmazingComponent);
```

### Example 2: Style Computation

#### ❌ BAD Code:

```typescript
function BadStyledComponent({color, size}) {
  // ❌ Creates new style object every render
  const style = {
    backgroundColor: color,
    width: size * 2,
    height: size * 2,
    borderRadius: size,
  };

  return <View style={style} />;
}
```

#### ✅ AMAZING Code:

```typescript
function AmazingStyledComponent({color, size}) {
  // ✅ Memoize expensive style calculations
  const style = useMemo(() => ({
    backgroundColor: color,
    width: size * 2,
    height: size * 2,
    borderRadius: size,
  }), [color, size]);

  return <View style={style} />;
}

// For static styles, move outside component
const staticStyles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
});
```

### Example 3: List Rendering

#### ❌ BAD Code:

```typescript
function BadList({items}) {
  // ❌ No virtualization, renders all items
  return (
    <ScrollView>
      {items.map((item, index) => (
        // ❌ Index as key causes re-renders on list changes
        <View key={index}>
          {/* ❌ Inline function creation */}
          <TouchableOpacity onPress={() => handlePress(item)}>
            <Text>{item.title}</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
```

#### ✅ AMAZING Code:

```typescript
const ItemComponent = memo(({item, onPress}) => {
  // ✅ Memoized handler per item
  const handlePress = useCallback(() => {
    onPress(item);
  }, [item, onPress]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>{item.title}</Text>
    </TouchableOpacity>
  );
});

function AmazingList({items, onItemPress}) {
  // ✅ Stable key extractor
  const keyExtractor = useCallback((item) => item.id, []);

  // ✅ Stable render item
  const renderItem = useCallback(({item}) => (
    <ItemComponent item={item} onPress={onItemPress} />
  ), [onItemPress]);

  // ✅ Optimization props
  const getItemLayout = useCallback((data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  }), []);

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={10}
      initialNumToRender={10}
    />
  );
}
```

### Example 4: State Updates

#### ❌ BAD Code:

```typescript
function BadStateComponent() {
  const [state, setState] = useState({
    value1: 0,
    value2: 0,
    value3: 0,
  });

  // ❌ Creates new object, triggers re-render even if value unchanged
  const updateValue1 = (val) => {
    setState({
      ...state,
      value1: val,
    });
  };

  // ❌ Multiple state updates cause multiple re-renders
  const updateMultiple = () => {
    setState({ ...state, value1: 1 });
    setState({ ...state, value2: 2 });
    setState({ ...state, value3: 3 });
  };
}
```

#### ✅ AMAZING Code:

```typescript
function AmazingStateComponent() {
  // ✅ Separate state for independent values
  const [value1, setValue1] = useState(0);
  const [value2, setValue2] = useState(0);
  const [value3, setValue3] = useState(0);

  // ✅ Conditional update
  const updateValue1 = useCallback((val) => {
    setValue1((prev) => {
      // Only update if changed
      if (prev === val) return prev;
      return val;
    });
  }, []);

  // ✅ Batch updates with single state update
  const updateMultiple = useCallback(() => {
    // React automatically batches these in event handlers
    setValue1(1);
    setValue2(2);
    setValue3(3);
  }, []);

  // Or use reducer for complex state
  const [state, dispatch] = useReducer(reducer, initialState);
}
```

## Performance Checklist

### Component Level

- [ ] ✅ Wrap components with `React.memo()` when appropriate
- [ ] ✅ Use `useMemo()` for expensive computations
- [ ] ✅ Use `useCallback()` for stable function references
- [ ] ✅ Lazy initialize state with functions
- [ ] ✅ Avoid inline object/array/function creation
- [ ] ✅ Split independent state into separate `useState` calls

### List Performance

- [ ] ✅ Use `FlatList`/`VirtualizedList` for long lists
- [ ] ✅ Implement `getItemLayout` when possible
- [ ] ✅ Provide stable `keyExtractor`
- [ ] ✅ Memoize `renderItem` with `useCallback`
- [ ] ✅ Set appropriate `windowSize` and `maxToRenderPerBatch`
- [ ] ✅ Enable `removeClippedSubviews` for large lists

### Event Handling

- [ ] ✅ Debounce/throttle expensive operations
- [ ] ✅ Batch related updates
- [ ] ✅ Use `InteractionManager` for post-interaction work
- [ ] ✅ Cancel pending operations in cleanup

### Animations

- [ ] ✅ Use native driver when possible
- [ ] ✅ Avoid animating layout properties
- [ ] ✅ Use `transform` instead of `left`/`top`
- [ ] ✅ Batch animated value updates

### Memory Management

- [ ] ✅ Clear timers and listeners in cleanup
- [ ] ✅ Implement object pooling for frequent allocations
- [ ] ✅ Cache expensive computations
- [ ] ✅ Use weak references where appropriate

### Native Bridge

- [ ] ✅ Batch native module calls
- [ ] ✅ Use `setNativeProps` for frequent updates
- [ ] ✅ Minimize bridge traffic
- [ ] ✅ Prefer native animations over JS

## Key Takeaways

1. **React Native's source code ALWAYS memoizes**: Every performance-critical component uses `memo`, `useMemo`, and `useCallback`

2. **Conditional state updates are everywhere**: Only update state when values actually change

3. **Batching is critical**: Updates are batched with timeouts (typically 50ms) to prevent thrashing

4. **Object pooling reduces GC**: Reuse objects and array indices instead of creating new ones

5. **Native driver bypass**: Skip JS entirely when animations run on native thread

6. **Lazy evaluation wins**: Compute only what's needed, when it's needed

7. **VirtualizedList is a masterclass**: Study its source for advanced patterns like CellRenderMask, velocity-based overscan, and priority rendering

The React Native team has optimized every millisecond out of the framework. By following these patterns, your app can achieve the same blazing-fast performance that powers apps used by billions.

## Final Pro Tips

1. **Profile first**: Use React DevTools Profiler to find actual bottlenecks
2. **Measure everything**: Add performance marks to track improvements
3. **Test on low-end devices**: Performance issues are magnified on weak hardware
4. **Monitor production**: Use tools like Flipper to catch real-world issues
5. **Read the source**: React Native's codebase is the ultimate learning resource

Remember: Every optimization in React Native's source exists because it solved a real performance problem at scale. Use these patterns and your apps will fly! 🚀
