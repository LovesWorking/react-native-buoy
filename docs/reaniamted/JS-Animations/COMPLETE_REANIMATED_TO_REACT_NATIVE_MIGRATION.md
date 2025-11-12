# Complete React Native Reanimated to Pure React Native Animation Migration Guide

## 📚 Quick Navigation

Jump directly to the API you want to migrate:

### Core Hooks

- [useSharedValue → Animated.Value](#1-usesharedvalue--animatedvalue)
- [useAnimatedStyle → Direct style binding](#2-useanimatedstyle--direct-style-binding)
- [useDerivedValue → Computed values](#3-usederivedvalue--computed-values)
- [useAnimatedReaction → Effect pattern](#4-useanimatedreaction--effect-pattern)
- [useAnimatedRef → useRef](#5-useanimatedref--useref)
- [useAnimatedProps → setNativeProps](#6-useanimatedprops--setnativeprops)
- [useFrameCallback → requestAnimationFrame](#7-useframecallback--requestanimationframe)
- [useAnimatedScrollHandler → Animated.event](#8-useanimatedscrollhandler--animatedevent)
- [useAnimatedGestureHandler → PanResponder](#9-useanimatedgesturehandler--panresponder)
- [useAnimatedSensor → DeviceEventEmitter](#10-useanimatedsensor--deviceeventemitter)
- [useAnimatedKeyboard → Keyboard API](#11-useanimatedkeyboard--keyboard-api)
- [useScrollOffset → ScrollView onScroll](#12-usescrolloffset--scrollview-onscroll)
- [useReducedMotion → AccessibilityInfo](#13-usereducedmotion--accessibilityinfo)
- [useComposedEventHandler → Combined handlers](#14-usecomposedeventhandler--combined-handlers)

### Animation Functions

- [withTiming → Animated.timing](#15-withtiming--animatedtiming)
- [withSpring → Animated.spring](#16-withspring--animatedspring)
- [withDecay → Animated.decay](#17-withdecay--animateddecay)
- [withSequence → Animated.sequence](#18-withsequence--animatedsequence)
- [withDelay → Animated.delay](#19-withdelay--animateddelay)
- [withRepeat → Animated.loop](#20-withrepeat--animatedloop)
- [withClamp → Custom implementation](#21-withclamp--custom-implementation)

### Utility Functions

- [interpolate → Animated.interpolate](#22-interpolate--animatedinterpolate)
- [interpolateColor → Color animation](#23-interpolatecolor--color-animation)
- [cancelAnimation → stopAnimation](#24-cancelanimation--stopanimation)
- [runOnJS/runOnUI → Direct calls](#25-runonjs-runonui--direct-calls)
- [measure → UIManager.measure](#26-measure--uimanagermeasure)
- [scrollTo → scrollToOffset](#27-scrollto--scrolltooffset)
- [makeMutable → useState/useRef](#28-makemutable--usestateuseref)

### Layout Animations

- [Entering animations → LayoutAnimation](#29-entering-animations--layoutanimation)
- [Exiting animations → LayoutAnimation](#30-exiting-animations--layoutanimation)
- [Layout transitions → LayoutAnimation](#31-layout-transitions--layoutanimation)
- [Keyframe animations → Custom sequence](#32-keyframe-animations--custom-sequence)
- [Shared transitions → Custom implementation](#33-shared-transitions--custom-implementation)

### Component APIs

- [createAnimatedComponent → Animated.createAnimatedComponent](#34-createanimatedcomponent--animatedcreateanimatedcomponent)
- [Animated.FlatList → Animated FlatList](#35-animatedflatlist--animated-flatlist)
- [Animated.ScrollView → Animated ScrollView](#36-animatedscrollview--animated-scrollview)

### Advanced Patterns

- [Worklets → Regular functions](#37-worklets--regular-functions)
- [Gesture.Tap → TouchableOpacity](#38-gesturetap--touchableopacity)
- [Gesture.Pan → PanResponder](#39-gesturepan--panresponder)
- [Gesture.Pinch → PinchGestureHandler alternative](#40-gesturepinch--pinchgesturehandler-alternative)

---

## Complete API Migrations

### 1. useSharedValue → Animated.Value

#### Reanimated

```javascript
import { useSharedValue } from "react-native-reanimated";

const progress = useSharedValue(0);
const position = useSharedValue({ x: 0, y: 0 });

// Read
console.log(progress.value);

// Write
progress.value = 100;

// Animate
progress.value = withSpring(1);
```

#### React Native

```javascript
import { Animated } from "react-native";
import { useRef } from "react";

const progress = useRef(new Animated.Value(0)).current;
const position = useRef({
  x: new Animated.Value(0),
  y: new Animated.Value(0),
}).current;

// Read (use listener or _value)
progress.addListener(({ value }) => console.log(value));
// Or access directly (not recommended): progress._value

// Write
progress.setValue(100);

// Animate
Animated.spring(progress, {
  toValue: 1,
  useNativeDriver: true,
}).start();
```

---

### 2. useAnimatedStyle → Direct style binding

#### Reanimated

```javascript
const animatedStyle = useAnimatedStyle(() => {
  return {
    opacity: progress.value,
    transform: [
      { translateX: translateX.value },
      { scale: interpolate(progress.value, [0, 1], [1, 2]) },
    ],
  };
});

<Animated.View style={animatedStyle} />;
```

#### React Native

```javascript
// Direct binding - no hook needed
const animatedStyle = {
  opacity: progress,
  transform: [
    { translateX },
    {
      scale: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 2],
      }),
    },
  ],
};

<Animated.View style={animatedStyle} />;
```

---

### 3. useDerivedValue → Computed values

#### Reanimated

```javascript
const progress = useSharedValue(0);
const doubled = useDerivedValue(() => {
  return progress.value * 2;
});

const animatedStyle = useAnimatedStyle(() => ({
  width: doubled.value,
}));
```

#### React Native

```javascript
const progress = useRef(new Animated.Value(0)).current;

// Method 1: Using Animated.multiply
const doubled = Animated.multiply(progress, 2);

// Method 2: Using interpolation
const doubled = progress.interpolate({
  inputRange: [0, 1],
  outputRange: [0, 2],
  extrapolate: "extend",
});

// Method 3: For complex calculations, use listener
const [doubledValue, setDoubledValue] = useState(0);
useEffect(() => {
  const listener = progress.addListener(({ value }) => {
    setDoubledValue(value * 2);
  });
  return () => progress.removeListener(listener);
}, []);

// Use in styles
const animatedStyle = {
  width: doubled, // Works with Method 1 or 2
};
```

---

### 4. useAnimatedReaction → Effect pattern

#### Reanimated

```javascript
const threshold = 0.5;

useAnimatedReaction(
  () => progress.value > threshold,
  (result, previous) => {
    if (result !== previous && result) {
      runOnJS(onThresholdCrossed)();
    }
  },
  [threshold],
);
```

#### React Native

```javascript
const threshold = 0.5;
const previousRef = useRef(false);

useEffect(() => {
  const listener = progress.addListener(({ value }) => {
    const result = value > threshold;
    if (result !== previousRef.current) {
      previousRef.current = result;
      if (result) {
        onThresholdCrossed();
      }
    }
  });

  return () => progress.removeListener(listener);
}, [threshold]);
```

---

### 5. useAnimatedRef → useRef

#### Reanimated

```javascript
const scrollRef = useAnimatedRef<ScrollView>();

// Use with scrollTo
scrollTo(scrollRef, 0, 100, true);

// Use with measure
const measurements = measure(scrollRef);
```

#### React Native

```javascript
const scrollRef = useRef < ScrollView > null;

// Scroll programmatically
scrollRef.current?.scrollTo({ x: 0, y: 100, animated: true });

// Measure component
scrollRef.current?.measure((x, y, width, height, pageX, pageY) => {
  console.log({ x, y, width, height, pageX, pageY });
});
```

---

### 6. useAnimatedProps → setNativeProps

#### Reanimated

```javascript
const animatedProps = useAnimatedProps(() => ({
  strokeDashoffset: progress.value * 100,
  fill: interpolateColor(progress.value, [0, 1], ["red", "blue"]),
}));

<AnimatedSvg animatedProps={animatedProps} />;
```

#### React Native

```javascript
// Method 1: Using setNativeProps (imperative)
const svgRef = useRef(null);

useEffect(() => {
  const listener = progress.addListener(({ value }) => {
    svgRef.current?.setNativeProps({
      strokeDashoffset: value * 100,
      fill: interpolateColorManual(value, "red", "blue"),
    });
  });

  return () => progress.removeListener(listener);
}, []);

// Method 2: Using state (declarative)
const [dashOffset, setDashOffset] = useState(0);
const [fillColor, setFillColor] = useState("red");

useEffect(() => {
  const listener = progress.addListener(({ value }) => {
    setDashOffset(value * 100);
    setFillColor(interpolateColorManual(value, "red", "blue"));
  });

  return () => progress.removeListener(listener);
}, []);

<Svg ref={svgRef} strokeDashoffset={dashOffset} fill={fillColor} />;

// Helper function for color interpolation
function interpolateColorManual(progress, startColor, endColor) {
  // Simple RGB interpolation
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);

  const r = Math.round(start.r + (end.r - start.r) * progress);
  const g = Math.round(start.g + (end.g - start.g) * progress);
  const b = Math.round(start.b + (end.b - start.b) * progress);

  return `rgb(${r},${g},${b})`;
}
```

---

### 7. useFrameCallback → requestAnimationFrame

#### Reanimated

```javascript
useFrameCallback((frameInfo) => {
  "worklet";
  const { timestamp, timeSinceFirstFrame } = frameInfo;

  rotation.value = ((timestamp % 2000) / 2000) * 360;
}, true); // auto-start
```

#### React Native

```javascript
useEffect(() => {
  let animationId;
  let startTime = null;

  const animate = (timestamp) => {
    if (!startTime) startTime = timestamp;
    const timeSinceFirstFrame = timestamp - startTime;

    const progress = (timestamp % 2000) / 2000;
    rotation.setValue(progress * 360);

    animationId = requestAnimationFrame(animate);
  };

  animationId = requestAnimationFrame(animate);

  return () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  };
}, []);
```

---

### 8. useAnimatedScrollHandler → Animated.event

#### Reanimated

```javascript
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    scrollY.value = event.contentOffset.y;
  },
  onBeginDrag: () => {
    isDragging.value = true;
  },
  onEndDrag: () => {
    isDragging.value = false;
  },
});

<Animated.ScrollView onScroll={scrollHandler} />;
```

#### React Native

```javascript
const scrollY = useRef(new Animated.Value(0)).current;
const [isDragging, setIsDragging] = useState(false);

// Animated event for scroll
const scrollHandler = Animated.event(
  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
  {
    useNativeDriver: true,
    listener: (event) => {
      // Additional logic if needed
      const offsetY = event.nativeEvent.contentOffset.y;
      console.log("Scrolled to:", offsetY);
    },
  },
);

<Animated.ScrollView
  onScroll={scrollHandler}
  onScrollBeginDrag={() => setIsDragging(true)}
  onScrollEndDrag={() => setIsDragging(false)}
  scrollEventThrottle={16}
/>;
```

---

### 9. useAnimatedGestureHandler → PanResponder

#### Reanimated

```javascript
const gestureHandler = useAnimatedGestureHandler({
  onStart: (event, context) => {
    context.startX = translateX.value;
    context.startY = translateY.value;
  },
  onActive: (event, context) => {
    translateX.value = context.startX + event.translationX;
    translateY.value = context.startY + event.translationY;
  },
  onEnd: () => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  },
});
```

#### React Native

```javascript
const pan = useRef(new Animated.ValueXY()).current;
const startPosition = useRef({ x: 0, y: 0 });

const panResponder = useRef(
  PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,

    onPanResponderGrant: () => {
      startPosition.current = {
        x: pan.x._value,
        y: pan.y._value,
      };
      pan.setOffset(startPosition.current);
      pan.setValue({ x: 0, y: 0 });
    },

    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
      useNativeDriver: false,
    }),

    onPanResponderRelease: () => {
      pan.flattenOffset();
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
      }).start();
    },
  }),
).current;

<Animated.View {...panResponder.panHandlers} />;
```

---

### 10. useAnimatedSensor → DeviceEventEmitter

#### Reanimated

```javascript
import { useAnimatedSensor, SensorType } from "react-native-reanimated";

const gyroscope = useAnimatedSensor(SensorType.GYROSCOPE, {
  interval: 16, // 60fps
});

const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { rotateX: `${gyroscope.sensor.value.pitch}rad` },
    { rotateY: `${gyroscope.sensor.value.roll}rad` },
    { rotateZ: `${gyroscope.sensor.value.yaw}rad` },
  ],
}));
```

#### React Native

```javascript
import { DeviceEventEmitter } from "react-native";
import { Gyroscope } from "expo-sensors"; // or react-native-sensors

const [gyroData, setGyroData] = useState({ x: 0, y: 0, z: 0 });
const rotateX = useRef(new Animated.Value(0)).current;
const rotateY = useRef(new Animated.Value(0)).current;
const rotateZ = useRef(new Animated.Value(0)).current;

useEffect(() => {
  Gyroscope.setUpdateInterval(16); // 60fps

  const subscription = Gyroscope.addListener((data) => {
    setGyroData(data);

    // Animate the values
    Animated.parallel([
      Animated.timing(rotateX, {
        toValue: data.x,
        duration: 16,
        useNativeDriver: true,
      }),
      Animated.timing(rotateY, {
        toValue: data.y,
        duration: 16,
        useNativeDriver: true,
      }),
      Animated.timing(rotateZ, {
        toValue: data.z,
        duration: 16,
        useNativeDriver: true,
      }),
    ]).start();
  });

  return () => {
    subscription.remove();
  };
}, []);

const animatedStyle = {
  transform: [
    {
      rotateX: rotateX.interpolate({
        inputRange: [-Math.PI, Math.PI],
        outputRange: ["-180deg", "180deg"],
      }),
    },
    {
      rotateY: rotateY.interpolate({
        inputRange: [-Math.PI, Math.PI],
        outputRange: ["-180deg", "180deg"],
      }),
    },
    {
      rotateZ: rotateZ.interpolate({
        inputRange: [-Math.PI, Math.PI],
        outputRange: ["-180deg", "180deg"],
      }),
    },
  ],
};
```

---

### 11. useAnimatedKeyboard → Keyboard API

#### Reanimated

```javascript
const keyboard = useAnimatedKeyboard();

const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    {
      translateY: -keyboard.height.value,
    },
  ],
}));
```

#### React Native

```javascript
import { Keyboard, Animated } from "react-native";

const keyboardHeight = useRef(new Animated.Value(0)).current;

useEffect(() => {
  const showSubscription = Keyboard.addListener("keyboardWillShow", (e) => {
    Animated.timing(keyboardHeight, {
      toValue: e.endCoordinates.height,
      duration: e.duration,
      useNativeDriver: true,
    }).start();
  });

  const hideSubscription = Keyboard.addListener("keyboardWillHide", (e) => {
    Animated.timing(keyboardHeight, {
      toValue: 0,
      duration: e.duration,
      useNativeDriver: true,
    }).start();
  });

  return () => {
    showSubscription.remove();
    hideSubscription.remove();
  };
}, []);

const animatedStyle = {
  transform: [
    {
      translateY: Animated.multiply(keyboardHeight, -1),
    },
  ],
};
```

---

### 12. useScrollOffset → ScrollView onScroll

#### Reanimated

```javascript
const scrollRef = useAnimatedRef();
const scrollOffset = useScrollOffset(scrollRef);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: interpolate(scrollOffset.value, [0, 100], [1, 0]),
}));
```

#### React Native

```javascript
const scrollY = useRef(new Animated.Value(0)).current;

const handleScroll = Animated.event(
  [{ nativeEvent: { contentOffset: { y: scrollY } } }],
  { useNativeDriver: true },
);

const animatedStyle = {
  opacity: scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: "clamp",
  }),
};

<Animated.ScrollView onScroll={handleScroll} scrollEventThrottle={16} />;
```

---

### 13. useReducedMotion → AccessibilityInfo

#### Reanimated

```javascript
const reduceMotion = useReducedMotion();

if (reduceMotion) {
  // Skip animations
  translateX.value = 100;
} else {
  translateX.value = withSpring(100);
}
```

#### React Native

```javascript
import { AccessibilityInfo } from "react-native";

const [reduceMotion, setReduceMotion] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

  const subscription = AccessibilityInfo.addEventListener(
    "reduceMotionChanged",
    setReduceMotion,
  );

  return () => subscription.remove();
}, []);

// Use in animations
if (reduceMotion) {
  translateX.setValue(100);
} else {
  Animated.spring(translateX, {
    toValue: 100,
    useNativeDriver: true,
  }).start();
}
```

---

### 14. useComposedEventHandler → Combined handlers

#### Reanimated

```javascript
const composed = useComposedEventHandler([handler1, handler2, handler3]);
```

#### React Native

```javascript
// Combine multiple handlers manually
const composedHandler = useCallback(
  (event) => {
    handler1(event);
    handler2(event);
    handler3(event);
  },
  [handler1, handler2, handler3],
);

// For PanResponder
const panResponder = PanResponder.create({
  onPanResponderMove: (evt, gestureState) => {
    handler1(evt, gestureState);
    handler2(evt, gestureState);
    handler3(evt, gestureState);
  },
});
```

---

### 15. withTiming → Animated.timing

#### Reanimated

```javascript
progress.value = withTiming(1, {
  duration: 500,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
});
```

#### React Native

```javascript
Animated.timing(progress, {
  toValue: 1,
  duration: 500,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  useNativeDriver: true,
}).start();
```

---

### 16. withSpring → Animated.spring

#### Reanimated

```javascript
progress.value = withSpring(1, {
  damping: 15,
  stiffness: 100,
  mass: 1,
});
```

#### React Native

```javascript
Animated.spring(progress, {
  toValue: 1,
  damping: 15,
  stiffness: 100,
  mass: 1,
  useNativeDriver: true,
}).start();
```

---

### 17. withDecay → Animated.decay

#### Reanimated

```javascript
translateX.value = withDecay({
  velocity: gestureVelocity,
  deceleration: 0.997,
  clamp: [-200, 200],
});
```

#### React Native

```javascript
Animated.decay(translateX, {
  velocity: gestureVelocity,
  deceleration: 0.997,
  useNativeDriver: true,
}).start();

// Note: React Native's decay doesn't support clamping directly
// You need to add listeners to stop animation at boundaries
translateX.addListener(({ value }) => {
  if (value < -200 || value > 200) {
    translateX.stopAnimation();
    translateX.setValue(Math.max(-200, Math.min(200, value)));
  }
});
```

---

### 18. withSequence → Animated.sequence

#### Reanimated

```javascript
progress.value = withSequence(
  withTiming(1, { duration: 300 }),
  withTiming(0.5, { duration: 200 }),
  withSpring(1),
);
```

#### React Native

```javascript
Animated.sequence([
  Animated.timing(progress, {
    toValue: 1,
    duration: 300,
    useNativeDriver: true,
  }),
  Animated.timing(progress, {
    toValue: 0.5,
    duration: 200,
    useNativeDriver: true,
  }),
  Animated.spring(progress, {
    toValue: 1,
    useNativeDriver: true,
  }),
]).start();
```

---

### 19. withDelay → Animated.delay

#### Reanimated

```javascript
opacity.value = withDelay(500, withTiming(1));
```

#### React Native

```javascript
Animated.sequence([
  Animated.delay(500),
  Animated.timing(opacity, {
    toValue: 1,
    useNativeDriver: true,
  }),
]).start();
```

---

### 20. withRepeat → Animated.loop

#### Reanimated

```javascript
progress.value = withRepeat(
  withTiming(1, { duration: 1000 }),
  -1, // infinite
  true, // reverse
);
```

#### React Native

```javascript
// For ping-pong effect (reverse), create sequence
Animated.loop(
  Animated.sequence([
    Animated.timing(progress, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }),
    Animated.timing(progress, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }),
  ]),
  { iterations: -1 }, // infinite
).start();
```

---

### 21. withClamp → Custom implementation

#### Reanimated

```javascript
progress.value = withClamp({ min: 0, max: 100 }, withSpring(value));
```

#### React Native

```javascript
// Custom clamp implementation
class ClampedValue {
  constructor(value, min, max) {
    this.animatedValue = new Animated.Value(value);
    this.min = min;
    this.max = max;

    this.animatedValue.addListener(({ value }) => {
      if (value < min || value > max) {
        this.animatedValue.stopAnimation();
        this.animatedValue.setValue(Math.max(min, Math.min(max, value)));
      }
    });
  }

  animateTo(toValue, config) {
    const clampedValue = Math.max(this.min, Math.min(this.max, toValue));
    return Animated.spring(this.animatedValue, {
      ...config,
      toValue: clampedValue,
    });
  }
}

const clamped = new ClampedValue(0, 0, 100);
clamped.animateTo(150, { useNativeDriver: true }).start();
```

---

### 22. interpolate → Animated.interpolate

#### Reanimated

```javascript
const scale = interpolate(
  progress.value,
  [0, 0.5, 1],
  [1, 1.5, 2],
  Extrapolation.CLAMP,
);
```

#### React Native

```javascript
const scale = progress.interpolate({
  inputRange: [0, 0.5, 1],
  outputRange: [1, 1.5, 2],
  extrapolate: "clamp", // 'extend' | 'clamp' | 'identity'
});
```

---

### 23. interpolateColor → Color animation

#### Reanimated

```javascript
const backgroundColor = interpolateColor(
  progress.value,
  [0, 1],
  ["#FF0000", "#0000FF"],
);
```

#### React Native

```javascript
// Method 1: RGB string interpolation
const backgroundColor = progress.interpolate({
  inputRange: [0, 1],
  outputRange: ["rgb(255,0,0)", "rgb(0,0,255)"],
});

// Method 2: Manual color interpolation
function interpolateColorJS(progress, color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  return `rgb(${Math.round(rgb1.r + (rgb2.r - rgb1.r) * progress)},${Math.round(
    rgb1.g + (rgb2.g - rgb1.g) * progress,
  )},${Math.round(rgb1.b + (rgb2.b - rgb1.b) * progress)})`;
}

// Method 3: Using react-native-color library
import Color from "color";

const color1 = Color("#FF0000");
const color2 = Color("#0000FF");

const backgroundColor = progress.interpolate({
  inputRange: [0, 1],
  outputRange: [color1.rgb().string(), color2.rgb().string()],
});
```

---

### 24. cancelAnimation → stopAnimation

#### Reanimated

```javascript
cancelAnimation(progress);
```

#### React Native

```javascript
progress.stopAnimation((value) => {
  console.log("Stopped at:", value);
});

// For multiple animations
[animation1, animation2, animation3].forEach((anim) => {
  anim.stopAnimation();
});
```

---

### 25. runOnJS/runOnUI → Direct calls

#### Reanimated

```javascript
// In worklet
runOnJS(jsFunction)(args);

// From JS to UI
runOnUI(workletFunction)();
```

#### React Native

```javascript
// Everything runs on JS thread, so just call directly
jsFunction(args);

// No equivalent for runOnUI - all animations configured from JS thread
// but can run on native thread with useNativeDriver
```

---

### 26. measure → UIManager.measure

#### Reanimated

```javascript
const measurements = measure(animatedRef);
```

#### React Native

```javascript
import { UIManager, findNodeHandle } from "react-native";

const measureComponent = (ref) => {
  const handle = findNodeHandle(ref.current);

  return new Promise((resolve) => {
    UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
      resolve({ x, y, width, height, pageX, pageY });
    });
  });
};

// Usage
const measurements = await measureComponent(ref);

// Or using ref directly
ref.current?.measure((x, y, width, height, pageX, pageY) => {
  console.log({ x, y, width, height, pageX, pageY });
});
```

---

### 27. scrollTo → scrollToOffset

#### Reanimated

```javascript
scrollTo(scrollRef, x, y, animated);
```

#### React Native

```javascript
// ScrollView
scrollRef.current?.scrollTo({ x, y, animated });

// FlatList
flatListRef.current?.scrollToOffset({ offset: y, animated });

// SectionList
sectionListRef.current?.scrollToLocation({
  sectionIndex: 0,
  itemIndex: 0,
  animated: true,
});
```

---

### 28. makeMutable → useState/useRef

#### Reanimated

```javascript
const mutableValue = makeMutable(0);
mutableValue.value = 100;
```

#### React Native

```javascript
// For values that trigger re-renders
const [value, setValue] = useState(0);
setValue(100);

// For values that don't trigger re-renders
const mutableValue = useRef(0);
mutableValue.current = 100;

// For animated values
const animatedValue = useRef(new Animated.Value(0)).current;
animatedValue.setValue(100);
```

---

### 29. Entering animations → LayoutAnimation

#### Reanimated

```javascript
<Animated.View entering={FadeIn.duration(500)} />
<Animated.View entering={SlideInRight.springify()} />
```

#### React Native

```javascript
import { LayoutAnimation } from "react-native";

// Configure animation before state change
LayoutAnimation.configureNext(
  LayoutAnimation.create(
    500,
    LayoutAnimation.Types.easeInEaseOut,
    LayoutAnimation.Properties.opacity,
  ),
);

// Or use presets
LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);

// Then update state to trigger animation
setItems([...items, newItem]);

// Custom entering animation with Animated API
const EnteringView = ({ children }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
};
```

---

### 30. Exiting animations → LayoutAnimation

#### Reanimated

```javascript
<Animated.View exiting={FadeOut.duration(300)} />
```

#### React Native

```javascript
// Method 1: LayoutAnimation (immediate removal)
LayoutAnimation.configureNext(
  LayoutAnimation.create(
    300,
    LayoutAnimation.Types.easeOut,
    LayoutAnimation.Properties.opacity,
  ),
);
setItems(items.filter((item) => item.id !== targetId));

// Method 2: Animate then remove
const ExitingView = ({ onExit, children }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  const animateOut = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(onExit);
  };

  return (
    <Animated.View style={{ opacity }}>
      {children}
      <Button onPress={animateOut} title="Remove" />
    </Animated.View>
  );
};
```

---

### 31. Layout transitions → LayoutAnimation

#### Reanimated

```javascript
<Animated.View layout={LinearTransition} />
<Animated.View layout={LinearTransition.springify()} />
```

#### React Native

```javascript
// Automatic layout animations
useEffect(() => {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(
      300,
      LayoutAnimation.Types.easeInEaseOut,
      LayoutAnimation.Properties.scaleXY,
    ),
  );
}, [items]); // Trigger on items change

// Custom layout transition
const LayoutTransitionView = ({ style, children }) => {
  const animatedStyle = useRef({
    width: new Animated.Value(style.width || 100),
    height: new Animated.Value(style.height || 100),
  }).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(animatedStyle.width, {
        toValue: style.width,
        useNativeDriver: false,
      }),
      Animated.spring(animatedStyle.height, {
        toValue: style.height,
        useNativeDriver: false,
      }),
    ]).start();
  }, [style.width, style.height]);

  return (
    <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
  );
};
```

---

### 32. Keyframe animations → Custom sequence

#### Reanimated

```javascript
const entering = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.5 }] },
  50: { opacity: 0.5, transform: [{ scale: 1.2 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
}).duration(1000);
```

#### React Native

```javascript
// Keyframe animation implementation
const KeyframeAnimation = ({ children }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.sequence([
      // 0-50% (500ms)
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0.5,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // 50-100% (500ms)
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      {children}
    </Animated.View>
  );
};
```

---

### 33. Shared transitions → Custom implementation

#### Reanimated

```javascript
<Animated.View sharedTransitionTag="hero" />
```

#### React Native

```javascript
// Custom shared element transition
const SharedElementTransition = ({ from, to, children }) => {
  const position = useRef(new Animated.ValueXY(from)).current;
  const size = useRef({
    width: new Animated.Value(from.width),
    height: new Animated.Value(from.height),
  }).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(position, {
        toValue: to,
        useNativeDriver: true,
      }),
      Animated.spring(size.width, {
        toValue: to.width,
        useNativeDriver: false,
      }),
      Animated.spring(size.height, {
        toValue: to.height,
        useNativeDriver: false,
      }),
    ]).start();
  }, [to]);

  return (
    <Animated.View
      style={{
        position: "absolute",
        transform: position.getTranslateTransform(),
        width: size.width,
        height: size.height,
      }}
    >
      {children}
    </Animated.View>
  );
};

// Or use libraries like react-native-shared-element
```

---

### 34. createAnimatedComponent → Animated.createAnimatedComponent

#### Reanimated

```javascript
const AnimatedButton = Animated.createAnimatedComponent(Button);
```

#### React Native

```javascript
// Exact same API!
const AnimatedButton = Animated.createAnimatedComponent(Button);

// Usage
<AnimatedButton style={{ opacity: animatedOpacity }} title="Press me" />;
```

---

### 35. Animated.FlatList → Animated FlatList

#### Reanimated

```javascript
import Animated from "react-native-reanimated";

<Animated.FlatList
  data={data}
  renderItem={renderItem}
  onScroll={scrollHandler}
/>;
```

#### React Native

```javascript
import { Animated } from "react-native";

// Exact same API!
<Animated.FlatList
  data={data}
  renderItem={renderItem}
  onScroll={Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true },
  )}
/>;
```

---

### 36. Animated.ScrollView → Animated ScrollView

Both libraries provide the same component with identical APIs.

---

### 37. Worklets → Regular functions

#### Reanimated

```javascript
const customWorklet = () => {
  "worklet";
  return someValue * 2;
};

const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  return {
    width: customWorklet(),
  };
});
```

#### React Native

```javascript
// No worklet system - just regular functions
const customFunction = (value) => {
  return value * 2;
};

// Use with listeners
useEffect(() => {
  const listener = animatedValue.addListener(({ value }) => {
    const result = customFunction(value);
    // Use result
  });

  return () => animatedValue.removeListener(listener);
}, []);
```

---

### 38. Gesture.Tap → TouchableOpacity

#### Reanimated

```javascript
const tap = Gesture.Tap()
  .numberOfTaps(2)
  .onEnd(() => {
    scale.value = withSpring(1.5);
  });

<GestureDetector gesture={tap}>
  <Animated.View />
</GestureDetector>;
```

#### React Native

```javascript
const handleDoubleTap = () => {
  let lastTap = null;

  return () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;

    if (lastTap && now - lastTap < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      Animated.spring(scale, {
        toValue: 1.5,
        useNativeDriver: true,
      }).start();
      lastTap = null;
    } else {
      lastTap = now;
    }
  };
};

const doubleTapHandler = handleDoubleTap();

<TouchableOpacity onPress={doubleTapHandler}>
  <Animated.View style={{ transform: [{ scale }] }} />
</TouchableOpacity>;
```

---

### 39. Gesture.Pan → PanResponder

#### Reanimated

```javascript
const pan = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX;
  })
  .onEnd(() => {
    translateX.value = withSpring(0);
  });
```

#### React Native

```javascript
const pan = useRef(new Animated.ValueXY()).current;

const panResponder = PanResponder.create({
  onMoveShouldSetPanResponder: () => true,
  onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
    useNativeDriver: false,
  }),
  onPanResponderRelease: () => {
    Animated.spring(pan, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: true,
    }).start();
  },
});

<Animated.View {...panResponder.panHandlers} />;
```

---

### 40. Gesture.Pinch → PinchGestureHandler alternative

#### Reanimated

```javascript
const pinch = Gesture.Pinch().onUpdate((e) => {
  scale.value = e.scale;
});
```

#### React Native

```javascript
// React Native doesn't have built-in pinch support
// Option 1: Use react-native-gesture-handler (without Reanimated)
import { PinchGestureHandler, State } from "react-native-gesture-handler";

const scale = useRef(new Animated.Value(1)).current;
const baseScale = useRef(1);

const onPinchEvent = Animated.event([{ nativeEvent: { scale } }], {
  useNativeDriver: true,
});

const onPinchStateChange = (event) => {
  if (event.nativeEvent.oldState === State.ACTIVE) {
    baseScale.current *= event.nativeEvent.scale;
    scale.setValue(baseScale.current);
  }
};

<PinchGestureHandler
  onGestureEvent={onPinchEvent}
  onHandlerStateChange={onPinchStateChange}
>
  <Animated.View style={{ transform: [{ scale }] }} />
</PinchGestureHandler>;

// Option 2: Custom implementation with touch events
const CustomPinch = ({ children }) => {
  const [touches, setTouches] = useState([]);
  const scale = useRef(new Animated.Value(1)).current;
  const lastDistance = useRef(0);

  const getDistance = (touches) => {
    const [touch1, touch2] = touches;
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchMove = (e) => {
    if (e.nativeEvent.touches.length === 2) {
      const distance = getDistance(e.nativeEvent.touches);

      if (lastDistance.current > 0) {
        const scaleFactor = distance / lastDistance.current;
        scale.setValue(scale._value * scaleFactor);
      }

      lastDistance.current = distance;
    }
  };

  const handleTouchEnd = () => {
    lastDistance.current = 0;
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </View>
  );
};
```

---

## Performance Comparison Table

| Operation              | Reanimated | React Native | Performance Impact   |
| ---------------------- | ---------- | ------------ | -------------------- |
| Simple animations      | UI Thread  | JS Thread\*  | RN slower by ~20-30% |
| Gesture-driven         | UI Thread  | JS Thread    | RN slower by ~40-50% |
| Scroll animations      | UI Thread  | Native\*\*   | Similar performance  |
| Complex interpolations | UI Thread  | JS Thread    | RN slower by ~30-40% |
| Layout animations      | Native     | Native       | Similar performance  |
| Color interpolation    | Optimized  | Manual/JS    | RN slower by ~25%    |
| Spring physics         | Optimized  | Native\*\*   | Similar performance  |

\* With `useNativeDriver: true`, animations run on native thread
\*\* When using `useNativeDriver: true`

---

## Migration Strategy

### Step 1: Identify Animation Complexity

- **Simple**: Use React Native Animated directly
- **Complex**: Consider keeping Reanimated or hybrid approach
- **Gesture-heavy**: May need react-native-gesture-handler

### Step 2: Gradual Migration

1. Start with simple `Animated.Value` replacements
2. Convert basic animations (timing, spring)
3. Migrate complex sequences and gestures
4. Replace worklet-based logic with listeners
5. Test performance on actual devices

### Step 3: Performance Testing

```javascript
// Performance monitoring helper
const measureAnimationPerformance = (name, animationFn) => {
  const start = performance.now();

  animationFn(() => {
    const end = performance.now();
    console.log(`${name}: ${(end - start).toFixed(2)}ms`);
  });
};

// Usage
measureAnimationPerformance("SpringAnimation", (onComplete) => {
  Animated.spring(value, {
    toValue: 100,
    useNativeDriver: true,
  }).start(onComplete);
});
```

---

## Limitations of Pure React Native Animations

### What You Lose:

1. **UI Thread execution** - Most operations on JS thread
2. **Worklet system** - No separate thread for animation logic
3. **Advanced gestures** - Limited gesture support
4. **Shared element transitions** - No built-in support
5. **Complex physics** - Limited decay/spring configurations
6. **Performance** - Generally 20-50% slower for complex animations

### What You Keep:

1. **Smaller bundle size** - No additional native modules
2. **Simpler debugging** - All JS thread, standard debugging
3. **Broader compatibility** - Works with all React Native versions
4. **Less complexity** - No worklet limitations
5. **Standard API** - Familiar to all RN developers

---

## Conclusion

While React Native's built-in Animated API can replace most Reanimated functionality, there are performance trade-offs. For simple to moderate animations, pure React Native is sufficient. For complex, gesture-driven, or performance-critical animations, Reanimated provides significant advantages.

Choose based on:

- **Performance requirements** - 60fps critical? Use Reanimated
- **Bundle size constraints** - Size critical? Use React Native
- **Animation complexity** - Complex gestures? Use Reanimated
- **Team expertise** - Simpler API? Use React Native
- **Development speed** - Faster development? Use Reanimated

The migration is possible for most use cases, but carefully evaluate performance requirements before committing to pure React Native animations.
