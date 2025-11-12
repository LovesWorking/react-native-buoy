# The Ultimate React Native Reanimated Performance & Advanced Animations Guide

## 🚀 From Zero to Animation Master: The Complete Guide

This comprehensive guide contains everything learned from analyzing the entire React Native Reanimated codebase, including all APIs, types, documentation, examples, and internal optimizations. Follow this guide to write the fastest, most advanced animations possible.

---

## Table of Contents

1. [Core Concepts & Architecture](#core-concepts--architecture)
2. [Starting Your Animation Journey](#starting-your-animation-journey)
3. [Performance Fundamentals](#performance-fundamentals)
4. [Animation Types Deep Dive](#animation-types-deep-dive)
5. [Advanced Animation Techniques](#advanced-animation-techniques)
6. [Gesture-Driven Animations](#gesture-driven-animations)
7. [Layout Animations Mastery](#layout-animations-mastery)
8. [Scroll & List Optimizations](#scroll--list-optimizations)
9. [Debugging & Profiling](#debugging--profiling)
10. [Platform-Specific Optimizations](#platform-specific-optimizations)
11. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
12. [Real-World Examples](#real-world-examples)
13. [Performance Measurement](#performance-measurement)
14. [Migration & Breaking Changes](#migration--breaking-changes)
15. [Ultimate Performance Checklist](#ultimate-performance-checklist)

---

## Core Concepts & Architecture

### Understanding the Threading Model

React Native Reanimated operates on three main threads:

```typescript
// 1. JavaScript Thread - Where React runs
const [state, setState] = useState(0); // Runs here

// 2. UI Thread - Where native rendering happens
const animatedStyle = useAnimatedStyle(() => {
  "worklet"; // This marks code to run on UI thread
  return { transform: [{ translateX: offset.value }] };
});

// 3. Native Module Thread - Bridge between JS and Native
// Automatically handled by Reanimated
```

### The Worklet System

**Worklets** are JavaScript functions that can run on the UI thread. They're the foundation of Reanimated's performance.

```typescript
// ✅ CORRECT: Worklet function
const myWorklet = () => {
  "worklet"; // MUST be the first statement
  console.log("Running on UI thread");
  return 42;
};

// ❌ WRONG: 'worklet' not first
const badWorklet = () => {
  const x = 5; // ❌ Statement before 'worklet'
  ("worklet");
  return x;
};

// ✅ AUTOMATIC: Hooks automatically create worklets
useAnimatedStyle(() => {
  // Automatically a worklet - no directive needed
  return { opacity: progress.value };
});
```

### Shared Values: The Bridge Between Threads

Shared values are the primary way to share data between JS and UI threads:

```typescript
// Creation and basic usage
const progress = useSharedValue(0);

// Reading on JS thread
console.log(progress.value); // Use .value property

// Writing from JS thread
progress.value = 50;

// Animating
progress.value = withSpring(100);

// Reading in worklet (UI thread)
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  return { width: progress.value }; // Direct access to .value
});

// Modifying in worklet
const gesture = Gesture.Tap().onEnd(() => {
  "worklet";
  progress.value = withSpring(progress.value + 10);
});
```

---

## Starting Your Animation Journey

### Step 1: Installation & Setup

```bash
# Install with proper version matching
npm install react-native-reanimated@~3.16.0
npm install react-native-gesture-handler@~2.20.0

# iOS specific
cd ios && pod install

# Configure babel.config.js - MUST be last plugin
module.exports = {
  plugins: [
    // ... other plugins
    'react-native-reanimated/plugin' // ALWAYS LAST
  ]
};
```

### Step 2: Your First Performant Animation

```typescript
import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Button, View } from 'react-native';

function FirstAnimation() {
  // 1. Create shared value
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  // 2. Create animated styles
  const animatedStyle = useAnimatedStyle(() => {
    // This runs on UI thread - no bridge calls!
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ]
    };
  });

  // 3. Trigger animations
  const animate = () => {
    // These animations run entirely on UI thread
    scale.value = withSpring(1.5, {
      damping: 15,
      stiffness: 100
    });
    rotation.value = withTiming(360, {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
  };

  const reset = () => {
    scale.value = withSpring(1);
    rotation.value = withTiming(0);
  };

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            width: 100,
            height: 100,
            backgroundColor: 'blue',
            borderRadius: 10,
          },
          animatedStyle // Apply animated styles
        ]}
      />
      <Button title="Animate" onPress={animate} />
      <Button title="Reset" onPress={reset} />
    </View>
  );
}
```

### Step 3: Understanding Animation Lifecycle

```typescript
function AnimationLifecycle() {
  const progress = useSharedValue(0);

  useEffect(() => {
    // Start animation on mount
    progress.value = withTiming(
      1,
      {
        duration: 2000,
      },
      (finished) => {
        "worklet";
        if (finished) {
          console.log("Animation completed!");
          // Can trigger another animation here
          runOnJS(onAnimationComplete)();
        }
      },
    );

    // Cleanup on unmount - CRITICAL for performance
    return () => {
      cancelAnimation(progress);
    };
  }, []);

  const onAnimationComplete = () => {
    // Handle completion on JS thread
    console.log("Back on JS thread");
  };
}
```

---

## Performance Fundamentals

### 1. The Golden Rule: Keep Everything on UI Thread

```typescript
// ❌ BAD: Causes bridge traffic on every frame
function BadAnimation() {
  const [jsValue, setJsValue] = useState(0);

  const animatedStyle = useAnimatedStyle(() => {
    // This causes bridge call to get jsValue!
    return { opacity: jsValue };
  });
}

// ✅ GOOD: Everything stays on UI thread
function GoodAnimation() {
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return { opacity: opacity.value };
  });
}
```

### 2. Optimize Worklet Captures

Worklets capture variables from their surrounding scope. Minimize what gets captured:

```typescript
// ❌ BAD: Captures entire theme object (could be huge)
function BadCapture() {
  const theme = {
    colors: { primary: "#007AFF", secondary: "#5856D6" /*...*/ },
    fonts: {
      /*...*/
    },
    spacing: {
      /*...*/
    },
  };

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    // Captures ALL of theme even though we only use one color
    return { backgroundColor: theme.colors.primary };
  });
}

// ✅ GOOD: Only capture what you need
function GoodCapture() {
  const theme = {
    /*...*/
  };
  const primaryColor = theme.colors.primary; // Extract needed value

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    // Only captures primaryColor string
    return { backgroundColor: primaryColor };
  });
}

// ✅ BEST: Use constants for static values
const ANIMATION_CONSTANTS = {
  PRIMARY_COLOR: "#007AFF",
  ANIMATION_DURATION: 300,
  MAX_SCALE: 1.5,
} as const;

function BestCapture() {
  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return { backgroundColor: ANIMATION_CONSTANTS.PRIMARY_COLOR };
  });
}
```

### 3. Memory Management & Cleanup

```typescript
function ProperCleanup() {
  const translateX = useSharedValue(0);
  const animationRef = useRef<AnimationCallback | null>(null);

  useEffect(() => {
    // Store animation reference for cleanup
    animationRef.current = withRepeat(
      withSequence(
        withTiming(100, { duration: 1000 }),
        withTiming(0, { duration: 1000 }),
      ),
      -1, // Infinite repeat
      true, // Reverse
    );

    translateX.value = animationRef.current;

    // CRITICAL: Clean up on unmount
    return () => {
      cancelAnimation(translateX);
      animationRef.current = null;
    };
  }, []);
}
```

### 4. Avoid Re-creating Animated Styles

```typescript
// ❌ BAD: Creates new function every render
function BadStyleCreation() {
  const opacity = useSharedValue(1);

  // This creates a new function on every render!
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));
}

// ✅ GOOD: Stable function reference
function GoodStyleCreation() {
  const opacity = useSharedValue(1);

  // Dependencies array ensures stable reference
  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: opacity.value,
    }),
    [],
  ); // Empty deps if opacity reference is stable
}

// ✅ BEST: Memoize complex calculations
function BestStyleCreation() {
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";

    // Complex but optimized calculations
    const scale = interpolate(
      progress.value,
      [0, 0.5, 1],
      [1, 1.2, 1],
      Extrapolation.CLAMP,
    );

    const rotation = interpolate(
      progress.value,
      [0, 1],
      [0, 360],
      Extrapolation.EXTEND,
    );

    return {
      transform: [{ scale }, { rotate: `${rotation}deg` }],
    };
  }, []);
}
```

---

## Animation Types Deep Dive

### withTiming - Precise Control

```typescript
// Full API
interface TimingConfig {
  duration?: number; // Default: 300
  easing?: EasingFunction; // Default: Easing.inOut(Easing.quad)
  reduceMotion?: ReduceMotion; // Accessibility support
}

// Basic usage
progress.value = withTiming(1); // 300ms, default easing

// Custom configuration
progress.value = withTiming(1, {
  duration: 500,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1), // Custom cubic-bezier
});

// With completion callback
progress.value = withTiming(1, { duration: 1000 }, (finished) => {
  "worklet";
  if (finished) {
    // Animation completed normally
    runOnJS(onComplete)();
  } else {
    // Animation was cancelled
    runOnJS(onCancelled)();
  }
});

// All available easing functions
const easings = {
  linear: Easing.linear,
  ease: Easing.ease,
  quad: Easing.quad,
  cubic: Easing.cubic,
  poly: Easing.poly(4), // Custom power
  sin: Easing.sin,
  circle: Easing.circle,
  exp: Easing.exp,
  elastic: Easing.elastic(1), // Bounciness
  back: Easing.back(1.5), // Overshoot
  bounce: Easing.bounce,
  bezier: Easing.bezier(0.42, 0, 0.58, 1), // Custom curve
  in: Easing.in(Easing.ease), // Acceleration
  out: Easing.out(Easing.ease), // Deceleration
  inOut: Easing.inOut(Easing.ease), // Both
};
```

### withSpring - Natural Physics

```typescript
// Spring configurations
interface SpringConfig {
  damping?: number; // Default: 10
  mass?: number; // Default: 1
  stiffness?: number; // Default: 100
  overshootClamping?: boolean; // Default: false
  restDisplacementThreshold?: number; // Default: 0.01
  restSpeedThreshold?: number; // Default: 2
  velocity?: number; // Initial velocity
  duration?: number; // Alternative to physics config
  dampingRatio?: number; // Alternative to damping
  reduceMotion?: ReduceMotion;
}

// Pre-tuned configurations from Reanimated
const SPRING_CONFIGS = {
  // Snappy - Quick and responsive
  Snappy: {
    damping: 20,
    stiffness: 250,
    mass: 0.5,
  },

  // Gentle - Smooth and subtle
  Gentle: {
    damping: 20,
    stiffness: 120,
    mass: 1,
  },

  // Wiggly - Bouncy and playful
  Wiggly: {
    damping: 8,
    stiffness: 120,
    mass: 0.8,
  },

  // Stiff - Minimal bounce
  Stiff: {
    damping: 30,
    stiffness: 400,
    mass: 0.5,
  },

  // Slow - Relaxed motion
  Slow: {
    damping: 25,
    stiffness: 50,
    mass: 2,
  },
};

// Usage examples
translateX.value = withSpring(100); // Default config

translateX.value = withSpring(100, SPRING_CONFIGS.Snappy);

// Duration-based spring (easier to reason about)
translateX.value = withSpring(100, {
  duration: 1000,
  dampingRatio: 0.7, // 0 = maximum bounce, 1 = no bounce
});

// With initial velocity (for gesture continuity)
translateX.value = withSpring(0, {
  velocity: gestureVelocity,
  damping: 15,
  stiffness: 100,
});
```

### withDecay - Momentum Scrolling

```typescript
interface DecayConfig {
  velocity: number; // REQUIRED - Initial velocity
  deceleration?: number; // Default: 0.998
  clamp?: [number, number]; // Min/max bounds
  velocityFactor?: number; // Velocity multiplier
  rubberBandEffect?: boolean; // Bounce at boundaries
  rubberBandFactor?: number; // Bounce strength
  reduceMotion?: ReduceMotion;
}

// Fling gesture with decay
const gesture = Gesture.Pan().onEnd((event) => {
  "worklet";
  translateX.value = withDecay({
    velocity: event.velocityX,
    clamp: [-200, 200], // Boundaries
    rubberBandEffect: true, // Bounce at edges
  });
});

// Momentum scrolling implementation
const scrollOffset = useSharedValue(0);
const velocity = useSharedValue(0);

const handleRelease = () => {
  "worklet";
  scrollOffset.value = withDecay({
    velocity: velocity.value,
    deceleration: 0.997,
    clamp: [0, contentHeight - containerHeight],
  });
};
```

### withSequence - Chained Animations

```typescript
// Sequential animations
progress.value = withSequence(
  withTiming(1, { duration: 300 }),
  withTiming(0.5, { duration: 200 }),
  withSpring(1),
);

// Complex sequence with different types
scale.value = withSequence(
  withTiming(0, { duration: 0 }), // Instant reset
  withDelay(200, withSpring(1.2)), // Delayed spring
  withTiming(1, { duration: 300, easing: Easing.bounce }),
);

// Practical example: Attention-grabbing animation
function AttentionAnimation() {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const grabAttention = () => {
    scale.value = withSequence(
      withTiming(1.1, { duration: 100 }),
      withTiming(0.95, { duration: 100 }),
      withSpring(1, { damping: 5, stiffness: 200 }),
    );

    rotation.value = withSequence(
      withTiming(-5, { duration: 50 }),
      withTiming(5, { duration: 100 }),
      withTiming(-5, { duration: 100 }),
      withSpring(0),
    );
  };
}
```

### withDelay - Timing Control

```typescript
// Delay single animation
opacity.value = withDelay(500, withTiming(1));

// Staggered animations
items.forEach((item, index) => {
  item.translateY.value = withDelay(
    index * 50, // Stagger by 50ms
    withSpring(0),
  );
});

// Complex choreography
function StaggeredEntrance({ items }: { items: SharedValue<number>[] }) {
  useEffect(() => {
    items.forEach((item, index) => {
      // Staggered entrance with different delays
      item.value = withDelay(
        index * 100,
        withSpring(1, {
          damping: 10 + index * 2, // Vary spring config
          stiffness: 100,
        }),
      );
    });
  }, []);
}
```

### withRepeat - Looping Animations

```typescript
interface RepeatConfig {
  numberOfReps?: number; // -1 for infinite
  reverse?: boolean; // Alternate direction
  callback?: (finished: boolean) => void;
  reduceMotion?: ReduceMotion;
}

// Infinite loop
progress.value = withRepeat(
  withTiming(1, { duration: 1000 }),
  -1, // Infinite
  true, // Reverse (ping-pong)
);

// Fixed repetitions
scale.value = withRepeat(
  withSequence(
    withTiming(1.2, { duration: 300 }),
    withTiming(1, { duration: 300 }),
  ),
  3, // Repeat 3 times
  false, // Don't reverse
);

// Breathing animation
function BreathingDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );

    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.5, { duration: 1000 }),
      ),
      -1,
    );

    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);
}
```

---

## Advanced Animation Techniques

### 1. Interpolation Mastery

```typescript
// Basic interpolation
const scale = interpolate(
  progress.value,
  [0, 1], // Input range
  [1, 2], // Output range
  Extrapolation.CLAMP, // Behavior outside range
);

// Multi-point interpolation for complex curves
const complexAnimation = interpolate(
  scrollY.value,
  [0, 100, 200, 300, 400], // Input breakpoints
  [0, 0.5, 0.8, 0.9, 1], // Output values
  {
    extrapolateLeft: Extrapolation.CLAMP,
    extrapolateRight: Extrapolation.EXTEND,
  },
);

// Color interpolation with different color spaces
const backgroundColor = interpolateColor(
  progress.value,
  [0, 0.5, 1],
  ["#FF0000", "#00FF00", "#0000FF"],
  ColorSpace.RGB, // or HSV, LAB, OKLCH
);

// Practical example: Parallax effect
function ParallaxHeader() {
  const scrollY = useSharedValue(0);
  const HEADER_HEIGHT = 300;

  const headerStyle = useAnimatedStyle(() => {
    "worklet";

    const scale = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
      [2, 1, 0.75],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT / 2, HEADER_HEIGHT],
      [1, 0.5, 0],
      Extrapolation.CLAMP,
    );

    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT / 2],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });
}
```

### 2. Derived Values for Complex Calculations

```typescript
// Derived values automatically update when dependencies change
function DerivedAnimation() {
  const progress = useSharedValue(0);

  // Simple derived value
  const doubled = useDerivedValue(() => {
    "worklet";
    return progress.value * 2;
  });

  // Complex derived value with multiple dependencies
  const x = useSharedValue(0);
  const y = useSharedValue(0);

  const distance = useDerivedValue(() => {
    "worklet";
    return Math.sqrt(x.value ** 2 + y.value ** 2);
  });

  const angle = useDerivedValue(() => {
    "worklet";
    return Math.atan2(y.value, x.value) * (180 / Math.PI);
  });

  // Use in animated styles
  const pointerStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [{ rotate: `${angle.value}deg` }],
      width: distance.value,
    };
  });
}
```

### 3. Animated Reactions for Side Effects

```typescript
// Trigger side effects when values change
function AnimatedReactionExample() {
  const progress = useSharedValue(0);
  const threshold = 0.5;

  // Simple reaction
  useAnimatedReaction(
    () => progress.value > threshold,
    (result, previous) => {
      "worklet";
      if (result !== previous) {
        if (result) {
          // Crossed threshold upward
          runOnJS(onThresholdCrossed)(true);
        } else {
          // Crossed threshold downward
          runOnJS(onThresholdCrossed)(false);
        }
      }
    },
    [threshold], // Dependencies
  );

  // Complex reaction with preparation
  useAnimatedReaction(
    () => ({
      x: translateX.value,
      y: translateY.value,
    }), // Prepare function
    (current, previous) => {
      "worklet";
      if (previous) {
        const distance = Math.sqrt(
          (current.x - previous.x) ** 2 + (current.y - previous.y) ** 2,
        );

        if (distance > 100) {
          // Moved more than 100 units
          runOnJS(onLargeMovement)();
        }
      }
    },
  );
}
```

### 4. Custom Animation Functions

```typescript
// Create custom animation modifiers
function withBounce(toValue: number, config?: SpringConfig) {
  "worklet";
  return withSequence(
    withSpring(toValue * 1.2, config),
    withSpring(toValue, { ...config, damping: 20 }),
  );
}

// Custom easing function
function customEasing(t: number): number {
  "worklet";
  // Elastic easing
  const p = 0.3;
  return Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1;
}

// Use in animations
progress.value = withTiming(1, {
  duration: 1000,
  easing: customEasing,
});

// Complex custom animation
function withPulse(
  value: SharedValue<number>,
  toValue: number,
  pulseScale = 1.1,
  duration = 300,
) {
  "worklet";
  return withSequence(
    withTiming(toValue * pulseScale, { duration: duration / 2 }),
    withSpring(toValue, { damping: 15, stiffness: 200 }),
  );
}
```

### 5. Shared Element Transitions

```typescript
import { SharedTransition, SharedTransitionType } from 'react-native-reanimated';

// Custom shared transition
const customTransition = SharedTransition.custom((values) => {
  'worklet';
  return {
    originX: withSpring(values.targetOriginX, { damping: 15 }),
    originY: withSpring(values.targetOriginY, { damping: 15 }),
    width: withSpring(values.targetWidth),
    height: withSpring(values.targetHeight),
    opacity: withTiming(values.targetOpacity, { duration: 300 })
  };
});

// Progressive shared transition
const progressiveTransition = SharedTransition.progressAnimation((values, progress) => {
  'worklet';
  const scale = interpolate(progress, [0, 0.5, 1], [1, 1.2, 1]);

  return {
    originX: values.currentOriginX + (values.targetOriginX - values.currentOriginX) * progress,
    originY: values.currentOriginY + (values.targetOriginY - values.currentOriginY) * progress,
    width: values.currentWidth + (values.targetWidth - values.currentWidth) * progress,
    height: values.currentHeight + (values.targetHeight - values.currentHeight) * progress,
    transform: [{ scale }]
  };
});

// Usage
<Animated.View
  sharedTransitionTag="hero"
  sharedTransitionStyle={customTransition}
>
  {/* Content */}
</Animated.View>
```

---

## Gesture-Driven Animations

### 1. Basic Gesture Handling

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function GestureExample() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Pan gesture
  const pan = Gesture.Pan()
    .onStart(() => {
      'worklet';
      // Store initial position if needed
    })
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      'worklet';
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  // Pinch gesture
  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      'worklet';
      scale.value = event.scale;
    })
    .onEnd(() => {
      'worklet';
      scale.value = withSpring(1);
    });

  // Composed gesture
  const composed = Gesture.Simultaneous(pan, pinch);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ]
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.box, animatedStyle]} />
    </GestureDetector>
  );
}
```

### 2. Advanced Gesture Patterns

```typescript
function SwipeableCard() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const context = useSharedValue({ x: 0, y: 0 });

  const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
  const VELOCITY_THRESHOLD = 500;

  const gesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      context.value = {
        x: translateX.value,
        y: translateY.value,
      };
    })
    .onUpdate((event) => {
      "worklet";
      translateX.value = context.value.x + event.translationX;
      translateY.value = context.value.y + event.translationY;
    })
    .onEnd((event) => {
      "worklet";
      const shouldSwipe =
        Math.abs(event.translationX) > SWIPE_THRESHOLD ||
        Math.abs(event.velocityX) > VELOCITY_THRESHOLD;

      if (shouldSwipe) {
        // Swipe away
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withSpring(direction * SCREEN_WIDTH * 1.5, {
          velocity: event.velocityX,
        });
        translateY.value = withSpring(event.translationY, {
          velocity: event.velocityY,
        });

        runOnJS(onSwipe)(direction > 0 ? "right" : "left");
      } else {
        // Spring back
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-15, 0, 15],
      Extrapolation.CLAMP,
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });
}
```

### 3. Gesture State Management

```typescript
function GestureStateExample() {
  const isPressed = useSharedValue(false);
  const isDragging = useSharedValue(false);

  const gesture = Gesture.Pan()
    .onBegin(() => {
      "worklet";
      isPressed.value = true;
    })
    .onStart(() => {
      "worklet";
      isDragging.value = true;
    })
    .onEnd(() => {
      "worklet";
      isDragging.value = false;
      isPressed.value = false;
    })
    .onFinalize(() => {
      "worklet";
      // Always called, even if gesture is cancelled
      isPressed.value = false;
      isDragging.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: isDragging.value
      ? "lightblue"
      : isPressed.value
        ? "lightgray"
        : "white",
    transform: [
      {
        scale: withSpring(isPressed.value ? 0.95 : 1),
      },
    ],
  }));
}
```

---

## Layout Animations Mastery

### 1. Entering Animations

```typescript
import {
  FadeIn,
  SlideInRight,
  SlideInLeft,
  SlideInUp,
  SlideInDown,
  ZoomIn,
  BounceIn,
  FlipInXUp,
  FlipInYLeft,
  StretchInX,
  RotateInUpLeft
} from 'react-native-reanimated';

// Basic entering animation
<Animated.View entering={FadeIn} />

// With configuration
<Animated.View
  entering={FadeIn.duration(500).delay(200)}
/>

// Chained modifiers
<Animated.View
  entering={SlideInRight
    .duration(400)
    .delay(100)
    .springify()
    .damping(15)
    .stiffness(100)
    .withCallback((finished) => {
      'worklet';
      if (finished) {
        runOnJS(onEntered)();
      }
    })
  }
/>

// Custom entering animation
const customEntering = () => {
  'worklet';
  const animations = {
    opacity: withTiming(1, { duration: 300 }),
    transform: [
      { scale: withSpring(1, { damping: 15 }) },
      { rotate: withTiming(0, { duration: 400 }) }
    ]
  };

  const initialValues = {
    opacity: 0,
    transform: [
      { scale: 0 },
      { rotate: '180deg' }
    ]
  };

  return {
    initialValues,
    animations
  };
};
```

### 2. Exiting Animations

```typescript
import {
  FadeOut,
  SlideOutRight,
  ZoomOut,
  BounceOut,
  FlipOutXDown
} from 'react-native-reanimated';

// Conditional rendering with exit animation
{isVisible && (
  <Animated.View
    exiting={FadeOut.duration(300)}
  />
)}

// Complex exit animation
const customExiting = () => {
  'worklet';
  return {
    animations: {
      opacity: withTiming(0, { duration: 200 }),
      transform: [
        { scale: withTiming(0.5, { duration: 300 }) },
        { translateY: withSpring(-100) }
      ]
    },
    initialValues: {
      opacity: 1,
      transform: [
        { scale: 1 },
        { translateY: 0 }
      ]
    }
  };
};
```

### 3. Layout Transitions

```typescript
import {
  LinearTransition,
  FadingTransition,
  SequencedTransition,
  JumpingTransition,
  CurvedTransition,
  EntryExitTransition
} from 'react-native-reanimated';

// Smooth layout changes
<Animated.View layout={LinearTransition} />

// Springy layout changes
<Animated.View layout={LinearTransition.springify()} />

// Custom layout transition
const customLayout = (values: LayoutAnimationValues) => {
  'worklet';
  return {
    animations: {
      originX: withSpring(values.targetOriginX, { damping: 20 }),
      originY: withSpring(values.targetOriginY, { damping: 20 }),
      width: withTiming(values.targetWidth, { duration: 300 }),
      height: withTiming(values.targetHeight, { duration: 300 })
    },
    initialValues: {
      originX: values.currentOriginX,
      originY: values.currentOriginY,
      width: values.currentWidth,
      height: values.currentHeight
    }
  };
};

// List with layout animations
function AnimatedList({ items }) {
  return (
    <ScrollView>
      {items.map((item, index) => (
        <Animated.View
          key={item.id}
          entering={SlideInRight.delay(index * 100)}
          exiting={SlideOutLeft}
          layout={LinearTransition.springify()}
        >
          <Text>{item.title}</Text>
        </Animated.View>
      ))}
    </ScrollView>
  );
}
```

### 4. Keyframe Animations

```typescript
import { Keyframe } from 'react-native-reanimated';

// Define keyframe animation
const keyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ scale: 0.5 }, { rotate: '0deg' }]
  },
  25: {
    opacity: 0.5,
    transform: [{ scale: 0.75 }, { rotate: '90deg' }]
  },
  50: {
    opacity: 0.75,
    transform: [{ scale: 1.2 }, { rotate: '180deg' }]
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }, { rotate: '360deg' }]
  }
}).duration(1000);

// Use in component
<Animated.View entering={keyframe} />

// Complex keyframe with easing
const complexKeyframe = new Keyframe({
  0: {
    opacity: 0,
    transform: [{ translateY: -100 }],
    easing: Easing.out(Easing.exp)
  },
  50: {
    opacity: 1,
    transform: [{ translateY: 0 }],
    easing: Easing.inOut(Easing.ease)
  },
  100: {
    transform: [{ translateY: 0 }]
  }
})
.duration(800)
.delay(200)
.withCallback((finished) => {
  'worklet';
  console.log('Keyframe animation finished:', finished);
});
```

---

## Scroll & List Optimizations

### 1. Optimized Scroll Handling

```typescript
// Use scrollTo for programmatic scrolling
function OptimizedScrollView() {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
    },
    onBeginDrag: () => {
      'worklet';
      // User started scrolling
    },
    onEndDrag: (event) => {
      'worklet';
      // Check velocity for momentum
      if (Math.abs(event.velocity.y) < 0.5) {
        // Snap to nearest item
        const itemHeight = 100;
        const targetY = Math.round(scrollY.value / itemHeight) * itemHeight;
        scrollTo(scrollRef, 0, targetY, true);
      }
    }
  });

  // Programmatic scroll
  const scrollToTop = () => {
    scrollTo(scrollRef, 0, 0, true); // Animated
  };

  return (
    <Animated.ScrollView
      ref={scrollRef}
      onScroll={scrollHandler}
      scrollEventThrottle={16} // 60fps
    >
      {/* Content */}
    </Animated.ScrollView>
  );
}
```

### 2. FlatList with Animations

```typescript
// Item-level animations in FlatList
const AnimatedFlatListItem = ({ item, index, scrollY }) => {
  const inputRange = [
    (index - 1) * ITEM_HEIGHT,
    index * ITEM_HEIGHT,
    (index + 1) * ITEM_HEIGHT
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity
    };
  });

  return (
    <Animated.View style={[styles.item, animatedStyle]}>
      <Text>{item.title}</Text>
    </Animated.View>
  );
};

// Main component
function AnimatedFlatList() {
  const scrollY = useSharedValue(0);

  const renderItem = useCallback(({ item, index }) => (
    <AnimatedFlatListItem
      item={item}
      index={index}
      scrollY={scrollY}
    />
  ), [scrollY]);

  return (
    <Animated.FlatList
      data={data}
      renderItem={renderItem}
      onScroll={useAnimatedScrollHandler((event) => {
        scrollY.value = event.contentOffset.y;
      })}
      scrollEventThrottle={16}
      // Performance optimizations
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      windowSize={10}
      initialNumToRender={10}
      getItemLayout={(_, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index
      })}
    />
  );
}
```

### 3. Parallax ScrollView

```typescript
function ParallaxScrollView() {
  const scrollY = useSharedValue(0);
  const HEADER_HEIGHT = 300;

  const headerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_HEIGHT],
      [0, -HEADER_HEIGHT / 2],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0],
      [2, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }]
    };
  });

  const contentStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: Math.max(0, scrollY.value)
    }]
  }));

  return (
    <View style={{ flex: 1 }}>
      <Animated.Image
        source={{ uri: 'header-image' }}
        style={[styles.header, headerStyle]}
      />
      <Animated.ScrollView
        onScroll={useAnimatedScrollHandler((e) => {
          scrollY.value = e.contentOffset.y;
        })}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: HEADER_HEIGHT }}
      >
        <Animated.View style={contentStyle}>
          {/* Content */}
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}
```

---

## Debugging & Profiling

### 1. Performance Monitor Setup

```typescript
import { PerformanceMonitor } from 'react-native-reanimated';

function App() {
  const [showPerf, setShowPerf] = useState(__DEV__);

  return (
    <>
      {showPerf && <PerformanceMonitor />}
      <YourApp />
    </>
  );
}
```

### 2. Logging Configuration

```typescript
import {
  configureReanimatedLogger,
  ReanimatedLogLevel,
} from "react-native-reanimated";

// Configure logging
configureReanimatedLogger({
  level: __DEV__ ? ReanimatedLogLevel.warn : ReanimatedLogLevel.error,
  strict: __DEV__, // Throw on warnings in development
});

// Custom logger in worklets
const debugWorklet = (value: any) => {
  "worklet";
  console.log("[Worklet]:", value);
};

// Use in animations
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  debugWorklet(`Progress: ${progress.value}`);
  return { opacity: progress.value };
});
```

### 3. Chrome DevTools Debugging

```javascript
// In your index.js or App.js
if (__DEV__) {
  require("react-native-reanimated").configureReanimatedLogger({
    level: "warn",
    strict: false,
  });
}

// Enable worklet debugging (experimental)
// 1. Install patches: npx patch-package react-native-reanimated
// 2. Enable in Metro config
module.exports = {
  transformer: {
    // ... other config
    workerPath: require.resolve(
      "react-native-reanimated/lib/reanimated2/js-reanimated/workerString",
    ),
  },
};
```

### 4. Common Debugging Patterns

```typescript
// Track animation state
function DebugAnimation() {
  const progress = useSharedValue(0);
  const [jsProgress, setJsProgress] = useState(0);

  // Sync to JS for debugging
  useAnimatedReaction(
    () => progress.value,
    (current) => {
      runOnJS(setJsProgress)(current);
    }
  );

  return (
    <View>
      <Text>Progress: {jsProgress.toFixed(2)}</Text>
      <Animated.View style={animatedStyle} />
    </View>
  );
}

// Measure animation performance
function measureAnimationPerformance(name: string, animation: () => void) {
  const start = performance.now();

  animation();

  const end = performance.now();
  console.log(`[${name}] took ${(end - start).toFixed(2)}ms`);
}

// Validate animation values
function validateAnimation(value: SharedValue<number>, min: number, max: number) {
  'worklet';
  if (value.value < min || value.value > max) {
    console.warn(`Animation value out of bounds: ${value.value}`);
  }
}
```

---

## Platform-Specific Optimizations

### 1. iOS Optimizations

```typescript
import { Platform } from "react-native";

// iOS-specific spring configurations
const IOS_SPRING = Platform.select({
  ios: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  default: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
});

// iOS-specific gesture handling
const gesture = Gesture.Pan()
  .shouldCancelWhenOutside(Platform.OS === "ios") // iOS-specific behavior
  .minDistance(Platform.OS === "ios" ? 5 : 10);

// iOS haptic feedback
function triggerHaptic() {
  "worklet";
  if (Platform.OS === "ios") {
    runOnJS(HapticFeedback.impact)(HapticFeedback.ImpactFeedbackStyle.Light);
  }
}
```

### 2. Android Optimizations

```typescript
// Android-specific elevation for shadows
const animatedStyle = useAnimatedStyle(() => {
  "worklet";

  if (Platform.OS === "android") {
    return {
      elevation: interpolate(progress.value, [0, 1], [0, 8]),
      // Android doesn't support shadow properties
    };
  }

  return {
    shadowOpacity: interpolate(progress.value, [0, 1], [0, 0.3]),
    shadowRadius: interpolate(progress.value, [0, 1], [0, 10]),
    shadowOffset: {
      width: 0,
      height: interpolate(progress.value, [0, 1], [0, 5]),
    },
  };
});

// Android render optimization
const ANDROID_OPTIMIZATION = Platform.select({
  android: {
    renderToHardwareTextureAndroid: true,
    collapsable: false,
  },
  default: {},
});
```

### 3. Web Platform Considerations

```typescript
// Web-specific optimizations
const WEB_OPTIMIZATION = Platform.select({
  web: {
    // Web doesn't have separate UI thread
    // Worklets run as regular functions
    userSelect: "none",
    cursor: "pointer",
  },
  default: {},
});

// Conditional native driver
const USE_NATIVE_DRIVER = Platform.OS !== "web";

progress.value = withTiming(1, {
  duration: 300,
  // Web doesn't support native driver
  ...(USE_NATIVE_DRIVER && { useNativeDriver: true }),
});
```

---

## Common Pitfalls & Solutions

### 1. Memory Leaks

```typescript
// ❌ PROBLEM: Animation continues after unmount
function LeakyComponent() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1), -1);
    // ❌ No cleanup!
  }, []);
}

// ✅ SOLUTION: Always clean up
function FixedComponent() {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1), -1);

    return () => {
      cancelAnimation(progress);
    };
  }, []);
}
```

### 2. Worklet Violations

```typescript
// ❌ PROBLEM: Using non-worklet functions
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  // ❌ Math.random() is not a worklet
  const randomValue = Math.random();
  return { opacity: randomValue };
});

// ✅ SOLUTION: Use worklet-compatible code
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  // ✅ Use interpolate for pseudo-random effect
  const pseudoRandom = interpolate(Date.now() % 1000, [0, 1000], [0, 1]);
  return { opacity: pseudoRandom };
});
```

### 3. Bridge Bottlenecks

```typescript
// ❌ PROBLEM: Frequent bridge calls
function BadBridge() {
  const [jsState, setJsState] = useState(0);

  const animatedStyle = useAnimatedStyle(() => {
    // ❌ Accessing JS state causes bridge call
    return { opacity: jsState };
  });
}

// ✅ SOLUTION: Use shared values
function GoodBridge() {
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return { opacity: opacity.value };
  });
}
```

### 4. Stale Closure Issues

```typescript
// ❌ PROBLEM: Stale closure in worklet
function StaleClosureIssue() {
  const [count, setCount] = useState(0);

  const gesture = Gesture.Tap().onEnd(() => {
    "worklet";
    // ❌ count is captured at creation time
    runOnJS(setCount)(count + 1);
  });
}

// ✅ SOLUTION: Use shared values or updater functions
function FixedClosure() {
  const count = useSharedValue(0);

  const gesture = Gesture.Tap().onEnd(() => {
    "worklet";
    count.value += 1;
    // Or use updater function
    runOnJS(setCount)((prev) => prev + 1);
  });
}
```

### 5. Performance Degradation

```typescript
// ❌ PROBLEM: Heavy calculations in animated style
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  // ❌ Expensive calculation on every frame
  let sum = 0;
  for (let i = 0; i < 10000; i++) {
    sum += Math.sin(i) * Math.cos(i);
  }
  return { opacity: sum % 1 };
});

// ✅ SOLUTION: Pre-calculate or use derived values
const calculatedValue = useDerivedValue(() => {
  "worklet";
  // Calculate once when dependencies change
  return expensiveCalculation();
}, [dependency]);

const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  return { opacity: calculatedValue.value };
});
```

---

## Real-World Examples

### 1. Instagram-like Double Tap Heart

```typescript
function DoubleTapHeart() {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotation = useSharedValue(0);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      'worklet';

      // Reset and animate
      scale.value = 0;
      opacity.value = 1;
      rotation.value = 0;

      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withDelay(200, withSpring(0, { damping: 8 }))
      );

      opacity.value = withDelay(
        400,
        withTiming(0, { duration: 200 })
      );

      rotation.value = withSequence(
        withTiming(15, { duration: 100 }),
        withTiming(-15, { duration: 100 }),
        withSpring(0)
      );
    });

  const heartStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: opacity.value
  }));

  return (
    <GestureDetector gesture={doubleTap}>
      <View style={styles.container}>
        <Image source={require('./photo.jpg')} style={styles.image} />
        <Animated.View style={[styles.heart, heartStyle]} pointerEvents="none">
          <Text style={styles.heartEmoji}>❤️</Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}
```

### 2. Tinder-like Swipe Cards

```typescript
function SwipeCard({ data, onSwipe }) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotateZ = useSharedValue(0);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Rotation based on horizontal movement
      rotateZ.value = interpolate(
        event.translationX,
        [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
        [-15, 0, 15],
        Extrapolation.CLAMP
      );

      // Scale based on distance from center
      const distance = Math.sqrt(
        event.translationX ** 2 + event.translationY ** 2
      );
      scale.value = interpolate(
        distance,
        [0, 200],
        [1, 0.8],
        Extrapolation.CLAMP
      );
    })
    .onEnd((event) => {
      'worklet';
      const THRESHOLD = SCREEN_WIDTH * 0.3;
      const VELOCITY_THRESHOLD = 500;

      const shouldSwipe =
        Math.abs(event.translationX) > THRESHOLD ||
        Math.abs(event.velocityX) > VELOCITY_THRESHOLD;

      if (shouldSwipe) {
        const direction = event.translationX > 0 ? 'right' : 'left';

        // Swipe away with physics
        translateX.value = withSpring(
          event.translationX > 0 ? SCREEN_WIDTH * 2 : -SCREEN_WIDTH * 2,
          { velocity: event.velocityX, damping: 50 }
        );

        translateY.value = withSpring(
          event.translationY + event.velocityY * 0.2,
          { velocity: event.velocityY }
        );

        scale.value = withTiming(0.5, { duration: 300 });

        runOnJS(onSwipe)(direction);
      } else {
        // Spring back to center
        translateX.value = withSpring(0, { damping: 20 });
        translateY.value = withSpring(0, { damping: 20 });
        rotateZ.value = withSpring(0, { damping: 20 });
        scale.value = withSpring(1, { damping: 20 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotateZ: `${rotateZ.value}deg` },
      { scale: scale.value }
    ]
  }));

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SCREEN_WIDTH / 4],
      [0, 1],
      Extrapolation.CLAMP
    )
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 4, 0],
      [1, 0],
      Extrapolation.CLAMP
    )
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Animated.View style={[styles.like, likeOpacity]}>
          <Text style={styles.likeText}>LIKE</Text>
        </Animated.View>
        <Animated.View style={[styles.nope, nopeOpacity]}>
          <Text style={styles.nopeText}>NOPE</Text>
        </Animated.View>
        <CardContent data={data} />
      </Animated.View>
    </GestureDetector>
  );
}
```

### 3. Apple Music-like Now Playing Bar

```typescript
function NowPlayingBar() {
  const COLLAPSED_HEIGHT = 60;
  const EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.9;

  const translateY = useSharedValue(EXPANDED_HEIGHT - COLLAPSED_HEIGHT);
  const context = useSharedValue({ y: 0 });

  const gesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      'worklet';
      translateY.value = Math.max(
        0,
        Math.min(
          EXPANDED_HEIGHT - COLLAPSED_HEIGHT,
          context.value.y + event.translationY
        )
      );
    })
    .onEnd((event) => {
      'worklet';
      const isExpanded = translateY.value < (EXPANDED_HEIGHT - COLLAPSED_HEIGHT) / 2;
      const targetY = isExpanded ? 0 : EXPANDED_HEIGHT - COLLAPSED_HEIGHT;

      translateY.value = withSpring(targetY, {
        velocity: event.velocityY,
        damping: 20,
        stiffness: 200
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  const backdropOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, EXPANDED_HEIGHT - COLLAPSED_HEIGHT],
      [1, 0],
      Extrapolation.CLAMP
    ),
    pointerEvents: translateY.value < 100 ? 'auto' : 'none'
  }));

  const contentOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, 200],
      [1, 0],
      Extrapolation.CLAMP
    )
  }));

  return (
    <>
      <Animated.View style={[styles.backdrop, backdropOpacity]} />
      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.nowPlayingBar, animatedStyle]}>
          <View style={styles.handle} />
          <CollapsedPlayer />
          <Animated.View style={[styles.expandedContent, contentOpacity]}>
            <ExpandedPlayer />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </>
  );
}
```

---

## Performance Measurement

### 1. FPS Monitoring

```typescript
import { useFrameCallback } from 'react-native-reanimated';

function FPSMonitor() {
  const fps = useSharedValue(0);
  const frameCount = useSharedValue(0);
  const lastTime = useSharedValue(0);

  useFrameCallback((frameInfo) => {
    'worklet';

    frameCount.value += 1;

    if (frameInfo.timestamp - lastTime.value >= 1000) {
      fps.value = frameCount.value;
      frameCount.value = 0;
      lastTime.value = frameInfo.timestamp;

      runOnJS(console.log)(`FPS: ${fps.value}`);
    }
  }, true);

  const fpsStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      fps.value,
      [0, 30, 60],
      ['red', 'yellow', 'green']
    )
  }));

  return (
    <Animated.View style={[styles.fpsIndicator, fpsStyle]}>
      <AnimatedText text={fps} />
    </Animated.View>
  );
}
```

### 2. Animation Performance Profiling

```typescript
function profileAnimation(name: string, animation: () => void) {
  "worklet";

  const startTime = performance.now();

  animation();

  const endTime = performance.now();
  const duration = endTime - startTime;

  runOnJS(console.log)(`[${name}] took ${duration.toFixed(2)}ms`);

  if (duration > 16.67) {
    runOnJS(console.warn)(`[${name}] missed frame budget!`);
  }
}

// Usage
const animatedStyle = useAnimatedStyle(() => {
  "worklet";

  return profileAnimation("complexStyle", () => {
    // Your animation code
    return {
      transform: [
        { scale: interpolate(progress.value, [0, 1], [1, 2]) },
        { rotate: `${progress.value * 360}deg` },
      ],
    };
  });
});
```

### 3. Memory Usage Tracking

```typescript
function MemoryTracker() {
  const [memoryInfo, setMemoryInfo] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      // React Native specific
      if (global.performance && global.performance.memory) {
        setMemoryInfo({
          used: (global.performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2),
          total: (global.performance.memory.totalJSHeapSize / 1024 / 1024).toFixed(2),
          limit: (global.performance.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.memoryTracker}>
      <Text>Memory: {memoryInfo.used}MB / {memoryInfo.total}MB</Text>
    </View>
  );
}
```

---

## Migration & Breaking Changes

### From Reanimated 2 to 3

```typescript
// Reanimated 2
useAnimatedGestureHandler({
  onActive: (event) => {
    translateX.value = event.translationX;
  }
});

// Reanimated 3 - Use react-native-gesture-handler v2
Gesture.Pan()
  .onUpdate((event) => {
    'worklet';
    translateX.value = event.translationX;
  });

// Layout animations change
// Reanimated 2
<Animated.View
  entering={FadeIn.duration(300)}
  exiting={FadeOut.duration(300)}
/>

// Reanimated 3 - Same API but better performance
<Animated.View
  entering={FadeIn.duration(300)}
  exiting={FadeOut.duration(300)}
  layout={LinearTransition} // New in v3
/>
```

### Web Platform Support

```typescript
// Reanimated 3 adds full web support
const isWeb = Platform.OS === "web";

// Conditional features
const animatedStyle = useAnimatedStyle(() => {
  "worklet";

  if (isWeb) {
    // Web-specific optimizations
    return {
      transform: `translateX(${translateX.value}px)`,
      willChange: "transform",
    };
  }

  return {
    transform: [{ translateX: translateX.value }],
  };
});
```

---

## Ultimate Performance Checklist

### Pre-Development

- [ ] Install latest stable version of Reanimated
- [ ] Configure babel plugin as LAST plugin
- [ ] Set up proper TypeScript types
- [ ] Enable Hermes on Android for best performance
- [ ] Configure ProGuard rules for release builds

### During Development

- [ ] **Always use `'worklet'` directive** when needed
- [ ] **Minimize worklet captures** - only capture necessary variables
- [ ] **Use shared values** for all animated properties
- [ ] **Avoid bridge calls** in animations
- [ ] **Pre-calculate values** outside of animated styles when possible
- [ ] **Use appropriate animation types** (spring vs timing vs decay)
- [ ] **Implement proper cleanup** in useEffect
- [ ] **Cancel animations** on unmount
- [ ] **Use `Extrapolation.CLAMP`** to avoid unnecessary calculations
- [ ] **Batch animations** with Animated.parallel/sequence
- [ ] **Optimize scroll events** with scrollEventThrottle={16}
- [ ] **Use getItemLayout** for FlatList when possible
- [ ] **Memoize components** that receive animated values
- [ ] **Profile on lowest-end target device**

### Optimization Techniques

- [ ] **Enable native driver** where possible (web excluded)
- [ ] **Use layout animations** for position/size changes
- [ ] **Implement frame callbacks** for complex synchronized animations
- [ ] **Use derived values** for dependent calculations
- [ ] **Apply platform-specific optimizations**
- [ ] **Reduce motion** for accessibility
- [ ] **Monitor FPS** in development
- [ ] **Profile memory usage** for leaks
- [ ] **Test gesture responsiveness** on physical devices

### Before Release

- [ ] **Remove console.logs** from worklets
- [ ] **Disable performance monitoring** in production
- [ ] **Test on slowest supported devices**
- [ ] **Verify animations at 60fps**
- [ ] **Check memory leaks** with prolonged usage
- [ ] **Validate gesture handling** across platforms
- [ ] **Test with reduce motion** enabled
- [ ] **Optimize bundle size** (tree-shaking)
- [ ] **Enable Proguard/R8** for Android
- [ ] **Profile release builds** for final validation

### Common Performance Targets

- **Frame Rate**: Maintain 60fps (16.67ms per frame)
- **Gesture Response**: < 100ms for visual feedback
- **Animation Start**: < 16ms from trigger to first frame
- **Memory Usage**: No leaks, stable heap size
- **Bundle Size Impact**: ~300KB (Reanimated) + ~100KB (Gesture Handler)

---

## Conclusion

This guide represents the complete knowledge base for creating the fastest, most advanced animations with React Native Reanimated. By following these patterns, avoiding the pitfalls, and applying the optimizations, you can create native-quality animations that run at a consistent 60fps.

Remember:

1. **Keep animations on the UI thread** using worklets
2. **Minimize bridge communication** with shared values
3. **Clean up resources** to prevent memory leaks
4. **Profile and measure** on real devices
5. **Optimize for your lowest-end target device**

The key to mastery is understanding the threading model, leveraging the power of worklets, and always thinking about performance from the start. With these tools and techniques, you can build animations that rival native applications in both performance and user experience.
