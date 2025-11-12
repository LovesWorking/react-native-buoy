# React Native Animation Optimization Guide

## Based on React Native Reanimated's Performance Techniques

This guide reveals the advanced optimization techniques used by React Native Reanimated and shows how to apply them to pure React Native animations and JavaScript code for maximum performance.

## Table of Contents

1. [Core Optimization Principles](#core-optimization-principles)
2. [Memory Management Techniques](#memory-management-techniques)
3. [Batching and Scheduling Optimizations](#batching-and-scheduling-optimizations)
4. [Object Allocation Strategies](#object-allocation-strategies)
5. [Animation Frame Optimization](#animation-frame-optimization)
6. [Caching and Memoization Patterns](#caching-and-memoization-patterns)
7. [Component Update Optimization](#component-update-optimization)
8. [Event Handler Optimization](#event-handler-optimization)
9. [Style and Transform Optimizations](#style-and-transform-optimizations)
10. [Development vs Production Optimizations](#development-vs-production-optimizations)
11. [Real-World Implementation Examples](#real-world-implementation-examples)
12. [Performance Measurement Techniques](#performance-measurement-techniques)
13. [Common Anti-Patterns to Avoid](#common-anti-patterns-to-avoid)

## Core Optimization Principles

### 1. Minimize Bridge Calls

The JavaScript-to-native bridge is the biggest bottleneck in React Native. Every optimization should aim to reduce bridge traffic.

**✅ DO: Batch Operations**

```javascript
// GOOD - Single bridge call
const animations = Animated.parallel([
  Animated.timing(x, { toValue: 100, useNativeDriver: true }),
  Animated.timing(y, { toValue: 200, useNativeDriver: true }),
  Animated.timing(opacity, { toValue: 1, useNativeDriver: true }),
]);
animations.start();

// BAD - Multiple bridge calls
Animated.timing(x, { toValue: 100, useNativeDriver: true }).start();
Animated.timing(y, { toValue: 200, useNativeDriver: true }).start();
Animated.timing(opacity, { toValue: 1, useNativeDriver: true }).start();
```

### 2. Use Native Driver Whenever Possible

Native driver moves animations to the native thread, eliminating bridge overhead entirely.

**✅ DO: Always Enable Native Driver**

```javascript
// GOOD - Runs on native thread
Animated.timing(animatedValue, {
  toValue: 100,
  duration: 500,
  useNativeDriver: true, // ✅ Essential for performance
}).start();

// BAD - Runs on JS thread
Animated.timing(animatedValue, {
  toValue: 100,
  duration: 500,
  useNativeDriver: false, // ❌ Causes bridge traffic every frame
}).start();
```

### 3. Avoid Creating Objects During Render

Every object creation triggers garbage collection, which causes frame drops.

**✅ DO: Pre-create Objects**

```javascript
// GOOD - Objects created once
const ANIMATION_CONFIG = {
  duration: 300,
  useNativeDriver: true,
};

const STYLE_TRANSFORM = [{ translateX: 0 }];

function AnimatedComponent() {
  const animValue = useRef(new Animated.Value(0)).current;

  return (
    <Animated.View
      style={{
        transform: [{ translateX: animValue }], // Reuses animated value
      }}
    />
  );
}

// BAD - Creates new objects every render
function AnimatedComponent() {
  return (
    <Animated.View
      style={{
        transform: [{ translateX: new Animated.Value(0) }], // ❌ New object every render
      }}
    />
  );
}
```

## Memory Management Techniques

### 1. WeakMap for Component References

Use WeakMap to store component references without preventing garbage collection.

**✅ DO: Use WeakMap for Component Tracking**

```javascript
// GOOD - Automatic cleanup
const componentRegistry = new WeakMap();

function registerComponent(component, metadata) {
  componentRegistry.set(component, metadata);
  // Automatically garbage collected when component unmounts
}

// BAD - Memory leak risk
const componentRegistry = new Map();

function registerComponent(component, metadata) {
  componentRegistry.set(component.id, metadata);
  // ❌ Must manually delete when component unmounts
}
```

### 2. Cleanup Animation Listeners

Always remove animation listeners to prevent memory leaks.

**✅ DO: Clean Up Listeners**

```javascript
function AnimatedComponent() {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const listenerId = animValue.addListener(({ value }) => {
      console.log("Animation value:", value);
    });

    // ✅ Critical: Remove listener on unmount
    return () => {
      animValue.removeListener(listenerId);
      animValue.removeAllListeners(); // Extra safety
    };
  }, [animValue]);
}

// BAD - Memory leak
function AnimatedComponent() {
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    animValue.addListener(({ value }) => {
      console.log("Animation value:", value);
    });
    // ❌ No cleanup - listener persists after unmount
  }, []);
}
```

### 3. Animation Cleanup Pattern

Stop running animations when components unmount.

**✅ DO: Stop Animations on Unmount**

```javascript
function LoadingSpinner() {
  const rotation = useRef(new Animated.Value(0)).current;
  const animationRef = useRef(null);

  useEffect(() => {
    animationRef.current = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );

    animationRef.current.start();

    // ✅ Stop animation on unmount
    return () => {
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [rotation]);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      {/* Spinner content */}
    </Animated.View>
  );
}
```

## Batching and Scheduling Optimizations

### 1. Microtask Batching

Use queueMicrotask for immediate but batched updates.

**✅ DO: Batch Updates with Microtasks**

```javascript
class AnimationBatcher {
  constructor() {
    this.pendingUpdates = [];
    this.flushScheduled = false;
  }

  scheduleUpdate(update) {
    this.pendingUpdates.push(update);

    if (!this.flushScheduled) {
      this.flushScheduled = true;
      queueMicrotask(() => this.flush());
    }
  }

  flush() {
    const updates = this.pendingUpdates;
    this.pendingUpdates = [];
    this.flushScheduled = false;

    // Process all updates in single batch
    Animated.parallel(updates).start();
  }
}

const batcher = new AnimationBatcher();

// Usage - multiple calls get batched
batcher.scheduleUpdate(Animated.timing(x, config));
batcher.scheduleUpdate(Animated.timing(y, config));
batcher.scheduleUpdate(Animated.timing(z, config));
// All three animations start together in next microtask
```

### 2. RequestAnimationFrame Scheduling

Use RAF for visual updates to sync with browser paint cycles.

**✅ DO: Use RAF for Visual Updates**

```javascript
class FrameScheduler {
  constructor() {
    this.callbacks = new Set();
    this.rafId = null;
  }

  schedule(callback) {
    this.callbacks.add(callback);

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => this.run());
    }
  }

  run() {
    const callbacks = Array.from(this.callbacks);
    this.callbacks.clear();
    this.rafId = null;

    // Execute all callbacks in single frame
    callbacks.forEach((cb) => cb());

    // Continue if new callbacks were added
    if (this.callbacks.size > 0) {
      this.rafId = requestAnimationFrame(() => this.run());
    }
  }

  cancel() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.callbacks.clear();
  }
}
```

### 3. Debouncing and Throttling

Limit animation triggers to improve performance.

**✅ DO: Throttle Expensive Operations**

```javascript
// Throttle scroll animations
function useThrottledScroll(delay = 16) {
  // ~60fps
  const [scrollY] = useState(new Animated.Value(0));
  const lastUpdate = useRef(0);

  const handleScroll = useCallback(
    (event) => {
      const now = Date.now();
      if (now - lastUpdate.current >= delay) {
        lastUpdate.current = now;
        scrollY.setValue(event.nativeEvent.contentOffset.y);
      }
    },
    [scrollY, delay],
  );

  return { scrollY, handleScroll };
}

// Debounce gesture end
function useDebouncedGestureEnd(callback, delay = 100) {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}
```

## Object Allocation Strategies

### 1. Object Pooling

Reuse objects instead of creating new ones.

**✅ DO: Implement Object Pools**

```javascript
class AnimatedValuePool {
  constructor(initialSize = 10) {
    this.available = [];
    this.inUse = new Set();

    // Pre-allocate pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(new Animated.Value(0));
    }
  }

  acquire(initialValue = 0) {
    let value;

    if (this.available.length > 0) {
      value = this.available.pop();
      value.setValue(initialValue);
    } else {
      value = new Animated.Value(initialValue);
    }

    this.inUse.add(value);
    return value;
  }

  release(value) {
    if (this.inUse.has(value)) {
      this.inUse.delete(value);
      value.setValue(0); // Reset
      value.removeAllListeners();
      this.available.push(value);
    }
  }

  releaseAll() {
    this.inUse.forEach((value) => this.release(value));
  }
}

// Usage
const pool = new AnimatedValuePool();

function ParticleSystem() {
  const particles = useRef([]);

  const createParticle = () => {
    const x = pool.acquire(0);
    const y = pool.acquire(0);
    const opacity = pool.acquire(1);

    return { x, y, opacity };
  };

  const destroyParticle = (particle) => {
    pool.release(particle.x);
    pool.release(particle.y);
    pool.release(particle.opacity);
  };

  useEffect(() => {
    return () => {
      particles.current.forEach(destroyParticle);
    };
  }, []);
}
```

### 2. Transform Array Caching

Cache transform arrays to avoid recreating them.

**✅ DO: Cache Transform Arrays**

```javascript
function OptimizedTransform() {
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  // Cache transform array structure
  const transformCache = useMemo(
    () => [
      { translateX },
      { scale },
      {
        rotate: rotation.interpolate({
          inputRange: [0, 360],
          outputRange: ["0deg", "360deg"],
        }),
      },
    ],
    [],
  ); // Empty deps - created once

  return <Animated.View style={{ transform: transformCache }} />;
}

// BAD - Creates new array every render
function UnoptimizedTransform() {
  const translateX = useRef(new Animated.Value(0)).current;

  return (
    <Animated.View
      style={{
        transform: [{ translateX }], // ❌ New array every render
      }}
    />
  );
}
```

### 3. Style Object Optimization

Separate static and animated styles.

**✅ DO: Separate Static and Animated Styles**

```javascript
// GOOD - Static styles cached, animated styles minimal
const staticStyles = StyleSheet.create({
  container: {
    width: 100,
    height: 100,
    backgroundColor: "blue",
    borderRadius: 10,
  },
});

function AnimatedBox() {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;

  // Only animated properties in animated style
  const animatedStyle = useMemo(
    () => ({
      opacity,
      transform: [{ scale }],
    }),
    [opacity, scale],
  );

  return <Animated.View style={[staticStyles.container, animatedStyle]} />;
}

// BAD - Recreates entire style object
function UnoptimizedBox() {
  const opacity = useRef(new Animated.Value(1)).current;

  return (
    <Animated.View
      style={{
        width: 100, // ❌ Static property in animated style
        height: 100,
        backgroundColor: "blue",
        borderRadius: 10,
        opacity, // Only this needs to be animated
      }}
    />
  );
}
```

## Animation Frame Optimization

### 1. Single RAF Loop Pattern

Use a single requestAnimationFrame loop for multiple animations.

**✅ DO: Centralized Animation Loop**

```javascript
class AnimationLoop {
  constructor() {
    this.animations = new Map();
    this.rafId = null;
    this.running = false;
  }

  register(id, updateFn) {
    this.animations.set(id, updateFn);
    this.start();
  }

  unregister(id) {
    this.animations.delete(id);
    if (this.animations.size === 0) {
      this.stop();
    }
  }

  start() {
    if (!this.running && this.animations.size > 0) {
      this.running = true;
      this.tick();
    }
  }

  stop() {
    this.running = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  tick = (timestamp) => {
    if (!this.running) return;

    // Update all animations in single frame
    this.animations.forEach((updateFn) => {
      updateFn(timestamp);
    });

    this.rafId = requestAnimationFrame(this.tick);
  };
}

const globalLoop = new AnimationLoop();

// Usage
function useAnimationLoop(updateFn) {
  const id = useRef(Math.random()).current;

  useEffect(() => {
    globalLoop.register(id, updateFn);
    return () => globalLoop.unregister(id);
  }, [id, updateFn]);
}
```

### 2. Frame Skipping for Performance

Skip frames when falling behind to maintain smooth animation.

**✅ DO: Implement Frame Skipping**

```javascript
class AdaptiveAnimator {
  constructor(targetFPS = 60) {
    this.targetFrameTime = 1000 / targetFPS;
    this.lastFrameTime = 0;
    this.accumulatedTime = 0;
  }

  update(currentTime, animationFn) {
    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
      animationFn(0);
      return;
    }

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    this.accumulatedTime += deltaTime;

    // Skip frames if falling behind
    let framesSkipped = 0;
    while (this.accumulatedTime >= this.targetFrameTime) {
      this.accumulatedTime -= this.targetFrameTime;
      framesSkipped++;

      // Cap frame skipping to prevent spiral of death
      if (framesSkipped >= 3) {
        this.accumulatedTime = 0;
        break;
      }
    }

    // Update with accumulated progress
    const progress = framesSkipped * this.targetFrameTime;
    if (progress > 0) {
      animationFn(progress);
    }
  }
}
```

### 3. Priority-Based Animation Scheduling

Prioritize critical animations over decorative ones.

**✅ DO: Implement Animation Priorities**

```javascript
class PriorityAnimationScheduler {
  constructor() {
    this.queues = {
      critical: [], // User interactions
      high: [], // Visible animations
      normal: [], // Standard animations
      low: [], // Background/decorative
    };
    this.frameTimeLimit = 16; // Target 60fps
  }

  schedule(animation, priority = "normal") {
    this.queues[priority].push(animation);
  }

  execute() {
    const startTime = performance.now();
    const priorities = ["critical", "high", "normal", "low"];

    for (const priority of priorities) {
      const queue = this.queues[priority];

      while (queue.length > 0) {
        const animation = queue.shift();
        animation();

        // Check if we're running out of frame time
        if (performance.now() - startTime > this.frameTimeLimit * 0.8) {
          // Defer remaining animations to next frame
          requestAnimationFrame(() => this.execute());
          return;
        }
      }
    }
  }
}
```

## Caching and Memoization Patterns

### 1. Interpolation Caching

Cache expensive interpolation calculations.

**✅ DO: Cache Interpolations**

```javascript
// Interpolation cache for complex calculations
const interpolationCache = new Map();

function getCachedInterpolation(animatedValue, config) {
  const key = `${config.inputRange.join(",")}-${config.outputRange.join(",")}`;

  if (!interpolationCache.has(key)) {
    interpolationCache.set(key, animatedValue.interpolate(config));
  }

  return interpolationCache.get(key);
}

// Color interpolation with caching
function useCachedColorInterpolation(animatedValue, colors) {
  return useMemo(() => {
    const key = colors.join("-");
    const cached = interpolationCache.get(key);

    if (cached) return cached;

    const interpolation = animatedValue.interpolate({
      inputRange: colors.map((_, i) => i),
      outputRange: colors,
    });

    interpolationCache.set(key, interpolation);
    return interpolation;
  }, [animatedValue, colors]);
}
```

### 2. Transform Matrix Caching

Cache matrix calculations for complex transforms.

**✅ DO: Cache Transform Matrices**

```javascript
class TransformMatrixCache {
  constructor() {
    this.cache = new Map();
  }

  getMatrix(transforms) {
    const key = this.generateKey(transforms);

    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const matrix = this.calculateMatrix(transforms);
    this.cache.set(key, matrix);

    // LRU eviction
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    return matrix;
  }

  generateKey(transforms) {
    return transforms
      .map((t) => `${Object.keys(t)[0]}:${Object.values(t)[0]}`)
      .join("|");
  }

  calculateMatrix(transforms) {
    // Expensive matrix calculation
    let matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

    transforms.forEach((transform) => {
      const [key, value] = Object.entries(transform)[0];
      // Apply transform to matrix
      // ... matrix multiplication logic
    });

    return matrix;
  }
}
```

### 3. Worklet-Style Function Caching

Cache function results based on inputs.

**✅ DO: Implement Function Memoization**

```javascript
function createMemoizedAnimationFunction(fn) {
  const cache = new Map();
  const maxCacheSize = 50;

  return (...args) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);

    // LRU cache eviction
    if (cache.size > maxCacheSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return result;
  };
}

// Usage
const memoizedEasing = createMemoizedAnimationFunction((t) => {
  // Expensive easing calculation
  return t * t * (3 - 2 * t); // smoothstep
});
```

## Component Update Optimization

### 1. Prevent Unnecessary Re-renders

Use React.memo and careful prop management.

**✅ DO: Optimize Component Re-renders**

```javascript
// GOOD - Memoized component with stable props
const AnimatedItem = React.memo(
  ({ animatedValue, onPress }) => {
    const scale = useMemo(
      () =>
        animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2],
        }),
      [], // animatedValue reference is stable
    );

    return (
      <TouchableOpacity onPress={onPress}>
        <Animated.View style={{ transform: [{ scale }] }}>
          {/* Content */}
        </Animated.View>
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison - only re-render if onPress changes
    return prevProps.onPress === nextProps.onPress;
  },
);

// Parent component
function ParentComponent() {
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Stable callback reference
  const handlePress = useCallback(() => {
    console.log("Pressed");
  }, []);

  return <AnimatedItem animatedValue={animatedValue} onPress={handlePress} />;
}
```

### 2. Direct Manipulation Pattern

Bypass React's reconciliation for performance-critical updates.

**✅ DO: Use Direct Manipulation When Needed**

```javascript
function DirectManipulationExample() {
  const viewRef = useRef(null);
  const position = useRef({ x: 0, y: 0 }).current;

  const updatePosition = useCallback(
    (x, y) => {
      // Direct manipulation - bypasses React
      viewRef.current?.setNativeProps({
        style: {
          transform: [{ translateX: x }, { translateY: y }],
        },
      });

      // Track position without re-render
      position.x = x;
      position.y = y;
    },
    [position],
  );

  return <View ref={viewRef}>{/* Content */}</View>;
}
```

### 3. Batch Component Updates

Group multiple state updates together.

**✅ DO: Batch State Updates**

```javascript
import { unstable_batchedUpdates } from "react-native";

function BatchedUpdates() {
  const [state1, setState1] = useState(0);
  const [state2, setState2] = useState(0);
  const [state3, setState3] = useState(0);

  const updateAllStates = useCallback(() => {
    // GOOD - Single re-render
    unstable_batchedUpdates(() => {
      setState1((prev) => prev + 1);
      setState2((prev) => prev + 1);
      setState3((prev) => prev + 1);
    });
  }, []);

  // BAD - Three re-renders
  const updateAllStatesBad = useCallback(() => {
    setState1((prev) => prev + 1);
    setState2((prev) => prev + 1);
    setState3((prev) => prev + 1);
  }, []);
}
```

## Event Handler Optimization

### 1. Event Pooling Pattern

Reuse event objects to reduce allocation.

**✅ DO: Implement Event Pooling**

```javascript
class EventPool {
  constructor(EventClass, poolSize = 10) {
    this.EventClass = EventClass;
    this.available = [];

    // Pre-populate pool
    for (let i = 0; i < poolSize; i++) {
      this.available.push(new EventClass());
    }
  }

  acquire(data) {
    let event;

    if (this.available.length > 0) {
      event = this.available.pop();
      event.reset(data);
    } else {
      event = new this.EventClass(data);
    }

    // Auto-release after use
    setTimeout(() => this.release(event), 0);

    return event;
  }

  release(event) {
    event.reset();
    this.available.push(event);
  }
}

class TouchEvent {
  constructor(data = {}) {
    this.reset(data);
  }

  reset(data = {}) {
    this.x = data.x || 0;
    this.y = data.y || 0;
    this.timestamp = data.timestamp || Date.now();
  }
}

const touchEventPool = new EventPool(TouchEvent);

// Usage
function handleTouch(x, y) {
  const event = touchEventPool.acquire({ x, y });
  // Process event
  // Automatically returned to pool
}
```

### 2. Gesture Handler Optimization

Optimize gesture handling for smooth interactions.

**✅ DO: Optimize Gesture Handlers**

```javascript
function OptimizedGestureHandler() {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef({ x: 0, y: 0 }).current;

  // Pre-create gesture config
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: () => {
        // Store offset without creating new object
        lastOffset.x = translateX._value;
        lastOffset.y = translateY._value;

        translateX.setOffset(lastOffset.x);
        translateY.setOffset(lastOffset.y);
        translateX.setValue(0);
        translateY.setValue(0);
      },

      // Use Animated.event for optimal performance
      onPanResponderMove: Animated.event(
        [null, { dx: translateX, dy: translateY }],
        {
          useNativeDriver: false,
          listener: null, // No JS callback for better performance
        },
      ),

      onPanResponderRelease: () => {
        translateX.flattenOffset();
        translateY.flattenOffset();
      },
    }),
  ).current;

  return (
    <Animated.View
      style={{
        transform: [{ translateX }, { translateY }],
      }}
      {...panResponder.panHandlers}
    >
      {/* Content */}
    </Animated.View>
  );
}
```

### 3. Scroll Event Optimization

Optimize scroll event handling.

**✅ DO: Optimize Scroll Events**

```javascript
function OptimizedScrollView() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const scrollDirection = useRef("down");

  // Optimized scroll event
  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: (event) => {
          const currentY = event.nativeEvent.contentOffset.y;

          // Throttled direction detection
          if (Math.abs(currentY - lastScrollY.current) > 5) {
            scrollDirection.current =
              currentY > lastScrollY.current ? "down" : "up";
            lastScrollY.current = currentY;
          }
        },
      }),
    [scrollY],
  );

  return (
    <Animated.ScrollView
      onScroll={handleScroll}
      scrollEventThrottle={16} // 60fps
      // Remove momentum events for better performance
      onMomentumScrollEnd={null}
      onScrollEndDrag={null}
    >
      {/* Content */}
    </Animated.ScrollView>
  );
}
```

## Style and Transform Optimizations

### 1. Transform Property Order

Order transforms for optimal performance.

**✅ DO: Order Transforms Correctly**

```javascript
// GOOD - Optimal transform order
const optimalTransform = [
  { translateX: 100 }, // Translation first
  { translateY: 50 },
  { scale: 2 }, // Scale second
  { rotate: "45deg" }, // Rotation last
];

// BAD - Suboptimal order
const suboptimalTransform = [
  { rotate: "45deg" }, // Rotation first causes recalculation
  { scale: 2 },
  { translateX: 100 },
  { translateY: 50 },
];

// Best practice: Create transform once
function OptimizedTransformComponent() {
  const animatedValue = useRef(new Animated.Value(0)).current;

  // Create interpolations once
  const transform = useMemo(() => {
    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 2],
    });

    const rotate = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ["0deg", "360deg"],
    });

    return [{ translateX: 100 }, { scale }, { rotate }];
  }, [animatedValue]);

  return <Animated.View style={{ transform }} />;
}
```

### 2. Shadow Optimization

Shadows are expensive - optimize carefully.

**✅ DO: Optimize Shadows**

```javascript
// GOOD - Static shadow separated
const staticShadowStyle = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Android
  },
});

function OptimizedShadow() {
  const animatedOpacity = useRef(new Animated.Value(1)).current;

  return (
    <View style={staticShadowStyle.shadow}>
      <Animated.View style={{ opacity: animatedOpacity }}>
        {/* Content */}
      </Animated.View>
    </View>
  );
}

// BAD - Animating shadow properties
function ExpensiveShadow() {
  const shadowOpacity = useRef(new Animated.Value(0.25)).current;

  return (
    <Animated.View
      style={{
        shadowOpacity, // ❌ Expensive to animate
        shadowRadius: 3.84,
        elevation: 5,
      }}
    />
  );
}
```

### 3. Border Radius Optimization

Optimize border radius rendering.

**✅ DO: Optimize Border Radius**

```javascript
// GOOD - Use overflow hidden for performance
const optimizedBorderRadius = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: "hidden", // Improves rendering performance
    backgroundColor: "white", // Opaque background for optimization
  },
});

// For animated border radius
function AnimatedBorderRadius() {
  const borderRadius = useRef(new Animated.Value(0)).current;

  // Pre-calculate interpolation
  const animatedRadius = useMemo(
    () =>
      borderRadius.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 20],
        extrapolate: "clamp", // Prevent negative values
      }),
    [borderRadius],
  );

  return (
    <Animated.View
      style={{
        borderRadius: animatedRadius,
        overflow: "hidden",
        backgroundColor: "white", // Keep opaque
      }}
    />
  );
}
```

## Development vs Production Optimizations

### 1. Conditional Debug Code

Remove debug code in production.

**✅ DO: Use **DEV** Flag**

```javascript
// Development-only validation
function validateAnimation(config) {
  if (__DEV__) {
    if (!config.duration || config.duration <= 0) {
      console.warn("Invalid animation duration:", config.duration);
    }
    if (!config.useNativeDriver) {
      console.warn("Consider using useNativeDriver for better performance");
    }
  }
}

// Development-only performance monitoring
class PerformanceMonitor {
  constructor() {
    this.enabled = __DEV__;
    this.metrics = new Map();
  }

  start(label) {
    if (!this.enabled) return;
    this.metrics.set(label, performance.now());
  }

  end(label) {
    if (!this.enabled) return;

    const startTime = this.metrics.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);
      this.metrics.delete(label);
    }
  }
}

const perfMonitor = new PerformanceMonitor();

// Usage - zero cost in production
function animateComponent() {
  perfMonitor.start("animation");

  Animated.timing(value, config).start(() => {
    perfMonitor.end("animation");
  });
}
```

### 2. Production Build Optimizations

Configure Metro for optimal production builds.

**✅ DO: Configure Metro for Production**

```javascript
// metro.config.js
module.exports = {
  transformer: {
    minifierConfig: {
      keep_fnames: false,
      mangle: {
        toplevel: true,
      },
      compress: {
        drop_console: true, // Remove console logs
        drop_debugger: true,
        pure_funcs: ["console.log", "console.warn"],
      },
    },
  },
};

// babel.config.js
module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: [
    ["transform-remove-console", { exclude: ["error", "warn"] }],
    "react-native-reanimated/plugin", // Must be last
  ],
  env: {
    production: {
      plugins: ["transform-remove-console"],
    },
  },
};
```

## Real-World Implementation Examples

### Example 1: High-Performance List with Animations

```javascript
import React, { useRef, useMemo, useCallback, memo } from "react";
import {
  FlatList,
  Animated,
  StyleSheet,
  View,
  Text,
  Dimensions,
} from "react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const ITEM_HEIGHT = 80;

// Pre-create styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    width: SCREEN_WIDTH,
    padding: 20,
    backgroundColor: "white",
  },
  separator: {
    height: 1,
    backgroundColor: "#E0E0E0",
  },
});

// Memoized list item
const ListItem = memo(
  ({ item, index, scrollY }) => {
    // Calculate animations once
    const inputRange = useMemo(
      () => [
        (index - 1) * ITEM_HEIGHT,
        index * ITEM_HEIGHT,
        (index + 1) * ITEM_HEIGHT,
      ],
      [index],
    );

    const scale = useMemo(
      () =>
        scrollY.interpolate({
          inputRange,
          outputRange: [0.9, 1, 0.9],
          extrapolate: "clamp",
        }),
      [scrollY, inputRange],
    );

    const opacity = useMemo(
      () =>
        scrollY.interpolate({
          inputRange,
          outputRange: [0.5, 1, 0.5],
          extrapolate: "clamp",
        }),
      [scrollY, inputRange],
    );

    return (
      <Animated.View
        style={[
          styles.item,
          {
            transform: [{ scale }],
            opacity,
          },
        ]}
      >
        <Text>{item.title}</Text>
      </Animated.View>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if item changes
    return prevProps.item.id === nextProps.item.id;
  },
);

// Main component
export function HighPerformanceList({ data }) {
  const scrollY = useRef(new Animated.Value(0)).current;

  // Optimized scroll handler
  const handleScroll = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
        useNativeDriver: true,
        listener: null, // No JS callback
      }),
    [scrollY],
  );

  // Stable references
  const keyExtractor = useCallback((item) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }) => (
      <ListItem item={item} index={index} scrollY={scrollY} />
    ),
    [scrollY],
  );

  const getItemLayout = useCallback(
    (_, index) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    [],
  );

  const ItemSeparatorComponent = useCallback(
    () => <View style={styles.separator} />,
    [],
  );

  return (
    <Animated.FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      ItemSeparatorComponent={ItemSeparatorComponent}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      // Disable expensive features
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      bounces={false}
    />
  );
}
```

### Example 2: Complex Gesture-Driven Animation

```javascript
import React, { useRef, useMemo } from "react";
import {
  View,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
} from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Animation constants
const SWIPE_THRESHOLD = 120;
const SWIPE_OUT_DURATION = 250;
const SPRING_CONFIG = {
  tension: 40,
  friction: 8,
  useNativeDriver: true,
};

export function SwipeableCard({ onSwipeComplete }) {
  // Animation values
  const pan = useRef(new Animated.ValueXY()).current;
  const scale = useRef(new Animated.Value(1)).current;
  const cardOpacity = useRef(new Animated.Value(1)).current;

  // Track position without re-renders
  const currentPosition = useRef({ x: 0, y: 0 });

  // Pre-calculate interpolations
  const rotate = useMemo(
    () =>
      pan.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        outputRange: ["-10deg", "0deg", "10deg"],
        extrapolate: "clamp",
      }),
    [pan.x],
  );

  const likeOpacity = useMemo(
    () =>
      pan.x.interpolate({
        inputRange: [0, SCREEN_WIDTH / 4],
        outputRange: [0, 1],
        extrapolate: "clamp",
      }),
    [pan.x],
  );

  const nopeOpacity = useMemo(
    () =>
      pan.x.interpolate({
        inputRange: [-SCREEN_WIDTH / 4, 0],
        outputRange: [1, 0],
        extrapolate: "clamp",
      }),
    [pan.x],
  );

  // Optimized pan responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture if moved enough
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },

      onPanResponderGrant: () => {
        // Store current position
        currentPosition.current = {
          x: pan.x._value,
          y: pan.y._value,
        };

        pan.setOffset(currentPosition.current);
        pan.setValue({ x: 0, y: 0 });

        // Scale down on touch
        Animated.spring(scale, {
          toValue: 0.95,
          ...SPRING_CONFIG,
        }).start();
      },

      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
        listener: null, // No JS overhead
      }),

      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();

        // Scale back
        Animated.spring(scale, {
          toValue: 1,
          ...SPRING_CONFIG,
        }).start();

        // Check for swipe
        if (Math.abs(gestureState.dx) > SWIPE_THRESHOLD) {
          const direction = gestureState.dx > 0 ? "right" : "left";

          // Swipe out animation
          Animated.parallel([
            Animated.timing(pan.x, {
              toValue: gestureState.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
              duration: SWIPE_OUT_DURATION,
              useNativeDriver: true,
            }),
            Animated.timing(cardOpacity, {
              toValue: 0,
              duration: SWIPE_OUT_DURATION,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onSwipeComplete?.(direction);
            resetPosition();
          });
        } else {
          // Spring back
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            ...SPRING_CONFIG,
          }).start();
        }
      },
    }),
  ).current;

  const resetPosition = () => {
    pan.setValue({ x: 0, y: 0 });
    scale.setValue(1);
    cardOpacity.setValue(1);
    currentPosition.current = { x: 0, y: 0 };
  };

  // Pre-calculate animated style
  const animatedCardStyle = useMemo(
    () => ({
      transform: [
        { translateX: pan.x },
        { translateY: pan.y },
        { rotate },
        { scale },
      ],
      opacity: cardOpacity,
    }),
    [pan.x, pan.y, rotate, scale, cardOpacity],
  );

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.card, animatedCardStyle]}
        {...panResponder.panHandlers}
      >
        {/* Like indicator */}
        <Animated.View style={[styles.likeIndicator, { opacity: likeOpacity }]}>
          <Text style={styles.likeText}>LIKE</Text>
        </Animated.View>

        {/* Nope indicator */}
        <Animated.View style={[styles.nopeIndicator, { opacity: nopeOpacity }]}>
          <Text style={styles.nopeText}>NOPE</Text>
        </Animated.View>

        {/* Card content */}
        <View style={styles.cardContent}>{/* Your content here */}</View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    width: SCREEN_WIDTH * 0.9,
    height: SCREEN_HEIGHT * 0.7,
    backgroundColor: "white",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  // ... other styles
});
```

## Performance Measurement Techniques

### 1. Custom Performance Monitor

```javascript
class AnimationPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.frameCount = 0;
    this.frameDrops = 0;
    this.lastFrameTime = 0;
  }

  startMonitoring() {
    this.rafId = requestAnimationFrame(this.measureFrame);
  }

  measureFrame = (timestamp) => {
    if (this.lastFrameTime) {
      const frameDuration = timestamp - this.lastFrameTime;

      // Detect frame drops (> 16.67ms for 60fps)
      if (frameDuration > 17) {
        this.frameDrops++;
        if (__DEV__) {
          console.warn(`Frame drop detected: ${frameDuration.toFixed(2)}ms`);
        }
      }
    }

    this.frameCount++;
    this.lastFrameTime = timestamp;

    // Continue monitoring
    this.rafId = requestAnimationFrame(this.measureFrame);
  };

  stopMonitoring() {
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }

    const fps = (this.frameCount / this.frameDrops) * 60;
    console.log(`Average FPS: ${fps.toFixed(2)}`);
    console.log(`Frame drops: ${this.frameDrops}`);
  }

  measureAnimation(name, animationFn) {
    const startTime = performance.now();
    const startMemory = performance.memory?.usedJSHeapSize;

    animationFn(() => {
      const duration = performance.now() - startTime;
      const memoryUsed = performance.memory?.usedJSHeapSize - startMemory;

      this.metrics.set(name, {
        duration,
        memoryUsed: memoryUsed / 1024 / 1024, // Convert to MB
      });

      if (__DEV__) {
        console.log(
          `[${name}] Duration: ${duration.toFixed(2)}ms, Memory: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`,
        );
      }
    });
  }

  getReport() {
    return {
      frameCount: this.frameCount,
      frameDrops: this.frameDrops,
      averageFPS: (this.frameCount / this.frameDrops) * 60,
      animations: Array.from(this.metrics.entries()),
    };
  }
}

// Usage
const perfMonitor = new AnimationPerformanceMonitor();

// Monitor specific animation
perfMonitor.measureAnimation("complexAnimation", (onComplete) => {
  Animated.parallel([
    // Your animations
  ]).start(onComplete);
});
```

### 2. React DevTools Profiler Integration

```javascript
import { Profiler } from "react";

function AnimationProfiler({ children, id }) {
  const handleRender = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
  ) => {
    if (__DEV__) {
      console.log(`[${id}] ${phase} render:`, {
        actualDuration: actualDuration.toFixed(2),
        baseDuration: baseDuration.toFixed(2),
        renderTime: (commitTime - startTime).toFixed(2),
      });

      // Detect slow renders
      if (actualDuration > 16) {
        console.warn(
          `Slow render detected in ${id}: ${actualDuration.toFixed(2)}ms`,
        );
      }
    }
  };

  return (
    <Profiler id={id} onRender={handleRender}>
      {children}
    </Profiler>
  );
}

// Usage
<AnimationProfiler id="AnimatedList">
  <YourAnimatedComponent />
</AnimationProfiler>;
```

## Common Anti-Patterns to Avoid

### ❌ DON'T: Create Functions in Render

```javascript
// BAD - Creates new function every render
function BadComponent() {
  return (
    <TouchableOpacity
      onPress={() => {
        // ❌ New function every render
        Animated.timing(value, { toValue: 1 }).start();
      }}
    />
  );
}

// GOOD - Stable function reference
function GoodComponent() {
  const handlePress = useCallback(() => {
    Animated.timing(value, { toValue: 1 }).start();
  }, [value]);

  return <TouchableOpacity onPress={handlePress} />;
}
```

### ❌ DON'T: Animate Without Native Driver

```javascript
// BAD - Runs on JS thread
Animated.timing(value, {
  toValue: 100,
  useNativeDriver: false, // ❌ Performance killer
}).start();

// GOOD - Runs on native thread
Animated.timing(value, {
  toValue: 100,
  useNativeDriver: true, // ✅ 60fps
}).start();
```

### ❌ DON'T: Create Animated Values in Render

```javascript
// BAD - New Animated.Value every render
function BadComponent() {
  const value = new Animated.Value(0); // ❌ Memory leak
  return <Animated.View style={{ opacity: value }} />;
}

// GOOD - Persistent Animated.Value
function GoodComponent() {
  const value = useRef(new Animated.Value(0)).current; // ✅ Created once
  return <Animated.View style={{ opacity: value }} />;
}
```

### ❌ DON'T: Forget to Clean Up

```javascript
// BAD - Memory leak
function BadComponent() {
  useEffect(() => {
    const animation = Animated.loop(Animated.timing(value, config));
    animation.start();
    // ❌ No cleanup
  }, []);
}

// GOOD - Proper cleanup
function GoodComponent() {
  useEffect(() => {
    const animation = Animated.loop(Animated.timing(value, config));
    animation.start();

    return () => animation.stop(); // ✅ Cleanup
  }, []);
}
```

### ❌ DON'T: Use Expensive Operations in Interpolation

```javascript
// BAD - Complex calculation every frame
const color = animatedValue.interpolate({
  inputRange: [0, 1],
  outputRange: [
    calculateComplexColor(props.startColor), // ❌ Recalculated every frame
    calculateComplexColor(props.endColor),
  ],
});

// GOOD - Pre-calculate expensive values
const startColor = useMemo(
  () => calculateComplexColor(props.startColor),
  [props.startColor],
);
const endColor = useMemo(
  () => calculateComplexColor(props.endColor),
  [props.endColor],
);

const color = animatedValue.interpolate({
  inputRange: [0, 1],
  outputRange: [startColor, endColor], // ✅ Pre-calculated
});
```

### ❌ DON'T: Chain Animations Incorrectly

```javascript
// BAD - Race condition
Animated.timing(x, config).start();
Animated.timing(y, config).start(); // ❌ May not start together

// GOOD - Guaranteed synchronization
Animated.parallel([
  Animated.timing(x, config),
  Animated.timing(y, config),
]).start(); // ✅ Start together
```

## Summary of Best Practices

### Critical Performance Rules

1. **Always use `useNativeDriver: true`** when possible
2. **Pre-create all objects** outside render cycle
3. **Clean up animations and listeners** on unmount
4. **Batch operations** to minimize bridge calls
5. **Use `InteractionManager`** for post-animation work
6. **Separate static and animated styles**
7. **Memoize expensive calculations**
8. **Use `getItemLayout`** for FlatList when possible
9. **Profile performance** in production builds
10. **Test on low-end devices** for real performance

### Performance Checklist

- [ ] All animations use `useNativeDriver: true`
- [ ] No functions created in render
- [ ] All Animated.Values created with useRef
- [ ] Animations cleaned up on unmount
- [ ] Styles separated (static vs animated)
- [ ] Transform order optimized
- [ ] Event handlers memoized with useCallback
- [ ] Interpolations pre-calculated with useMemo
- [ ] FlatList optimized with getItemLayout
- [ ] Performance tested on slowest target device

### Optimization Priority Order

1. **Enable native driver** (biggest impact)
2. **Reduce bridge calls** (batch operations)
3. **Minimize re-renders** (React.memo, PureComponent)
4. **Cache calculations** (useMemo, interpolation caching)
5. **Optimize styles** (separate static/animated)
6. **Clean up resources** (prevent memory leaks)
7. **Profile and measure** (identify actual bottlenecks)

By following these optimization patterns derived from React Native Reanimated's codebase, you can achieve near-native performance even with pure React Native animations. The key is understanding what causes performance issues and systematically applying these optimization techniques.
