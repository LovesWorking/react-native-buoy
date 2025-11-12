# Optimizing Pure JS React Native Animations (Animated)

This guide distills optimization patterns from this repository and applies them to pure JS React Native `Animated` (JS-only; `useNativeDriver: false`). It includes principles, do/don’t lists, concrete examples, repo references, and a large actionable TODO checklist with search commands.

Assumptions:

- You’re replacing `react-native-reanimated` APIs with core `Animated` for testing.
- All timing/spring animations here set `useNativeDriver: false` to stay on the JS thread.

---

## Core Principles

1. Stable component trees

- Keep view hierarchies structurally stable during animation. Animate styles, not JSX structure.
- Prefer composition over conditional rendering. Build dedicated small components and toggle visibility via styles.

2. Composition over memoization

- Split large components into focused subcomponents. Let `Animated.Value` drive styles directly.
- Avoid `useMemo`/`useCallback`/`React.memo` unless profiling shows a clear win. Prefer moving logic into small, reusable components and hooks.

3. Animate cheap properties

- Prefer `transform` and `opacity`. Avoid reflow-heavy layout props (`width`, `height`, complex shadows) during continuous animations.

4. Reuse animated state and animations

- Create `Animated.Value` once via `useRef` and reuse. Pre-compose `Animated.sequence`/`loop` functions; don’t rebuild them every frame.

5. Keep renders light

- Avoid creating fresh objects/arrays for memoized children. Precompute animated style fragments and reuse arrays.

6. Avoid state updates during animations

- Drive visuals via `Animated.Value` only. Don’t call `setState` in animation frames.

7. Respect reduced motion

- Gate or simplify animations when the user requests reduced motion.

8. Instrument and verify

- Validate improvements using a simple FPS monitor or perf markers to prevent regressions.

---

## Do / Don’t (with examples)

### Reuse Animated.Value and compose once

```tsx
// Do: create once, reuse
const progress = useRef(new Animated.Value(0)).current;

const forward = () =>
  Animated.timing(progress, {
    toValue: 1,
    duration: 300,
    useNativeDriver: false,
  }).start();

const back = () =>
  Animated.timing(progress, {
    toValue: 0,
    duration: 300,
    useNativeDriver: false,
  }).start();

const pulse = () =>
  Animated.sequence([
    Animated.timing(progress, {
      toValue: 1,
      duration: 180,
      useNativeDriver: false,
    }),
    Animated.timing(progress, {
      toValue: 0,
      duration: 180,
      useNativeDriver: false,
    }),
  ]).start();
```

```tsx
// Don’t: recreate values/animations inside render or every press
const onPress = () => {
  const v = new Animated.Value(0); // bad: allocation per call
  Animated.timing(v, {
    toValue: 1,
    duration: 300,
    useNativeDriver: false,
  }).start();
};
```

### Animate transforms/opacity, avoid layout props

```tsx
// Do
const translateY = progress.interpolate({
  inputRange: [0, 1],
  outputRange: [0, -40],
});
const style = { transform: [{ translateY }], opacity: progress };
```

```tsx
// Don’t
const style = { height: progress }; // frequent layout changes are costly on JS-only
```

### Keep styles stable, avoid inline churn

```tsx
// Do
const animatedStyle = useMemo(
  () => ({
    transform: [
      {
        scale: progress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.1],
        }),
      },
    ],
  }),
  [progress],
);

return <Animated.View style={[baseStyle, animatedStyle]} />;
```

```tsx
// Don’t: new arrays/objects each render for memoized children
return (
  <Animated.View
    style={[
      {
        transform: [
          {
            scale: progress.interpolate({
              /*...*/
            }),
          },
        ],
      },
    ]}
  />
);
```

### Avoid setState or heavy work in frames

```tsx
// Do: drive visuals from Animated.Value only
Animated.loop(
  Animated.timing(progress, {
    toValue: 1,
    duration: 800,
    useNativeDriver: false,
  }),
).start();
```

```tsx
// Don’t: set state every frame (janks renders)
const tick = () => requestAnimationFrame(() => setTick((t) => t + 1));
```

### Reduced motion toggle

```tsx
import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => mounted && setReduced(!!enabled),
    );
    const sub = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);
  return reduced;
}

// Usage
const reduced = useReducedMotion();
if (reduced) {
  progress.setValue(1); // or skip long loops entirely
}
```

### Map input events without re-renders

```tsx
// Do: JS-only scroll mapping without setState
const y = useRef(new Animated.Value(0)).current;
const onScroll = Animated.event([{ nativeEvent: { contentOffset: { y } } }], {
  useNativeDriver: false,
});

return <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} />;
```

---

## Practical Patterns

- Prebuild sequences/loops: create factory functions that receive a shared value and return an animation, e.g. `buildPulse(progress)` → re-used across components.
- Clamp interpolations: always specify `extrapolate: 'clamp'` when outputs shouldn’t exceed bounds.
- Shorten update chains: prefer a single `Animated.Value` with multiple interpolations rather than multiple cascading values.
- Cancel on unmount: store animation handles and stop them in `useEffect` cleanup when needed.
- Throttle high-frequency events: `scrollEventThrottle={16}` and coarser than needed when acceptable.
- Avoid color interpolation in tight loops: precompute discrete steps or shorten duration.

---

## Lightweight FPS Monitor (JS)

```tsx
import { useEffect, useRef, useState } from "react";

export function useFps(sampleMs = 1000) {
  const last = useRef(performance.now());
  const frames = useRef(0);
  const [fps, setFps] = useState(0);

  useEffect(() => {
    let mounted = true;
    let id = 0;
    const loop = () => {
      frames.current += 1;
      const now = performance.now();
      if (now - last.current >= sampleMs) {
        const next = Math.round((frames.current * 1000) / (now - last.current));
        if (mounted) setFps(next);
        frames.current = 0;
        last.current = now;
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      cancelAnimationFrame(id);
    };
  }, [sampleMs]);

  return fps;
}
```

Render a small overlay in dev builds showing `fps` to validate changes.

---

## Repo References (optimization touchpoints)

- Reduced motion hooks and configs:
  - `packages/react-native-reanimated/src/component/ReducedMotionConfig.tsx`
  - `packages/react-native-reanimated/src/hook/useReducedMotion.ts`
  - `apps/common-app/src/apps/reanimated/examples/ReducedMotionExample.tsx`
- Performance monitor examples:
  - `packages/react-native-reanimated/src/component/PerformanceMonitor.tsx`
  - `apps/common-app/src/apps/reanimated/examples/PerfomanceMonitorExample.tsx`
- Event/frame patterns:
  - `packages/react-native-worklets/src/runLoop/mockedRequestAnimationFrame.ts`
  - `apps/common-app/src/apps/reanimated/examples/RuntimeTests/tests/runLoop/requestAnimationFrame.test.tsx`
- Transform-focused examples (good targets for transform/opacity-first animations):
  - `apps/common-app/src/apps/reanimated/examples/TransformOriginExample.tsx`
  - `apps/common-app/src/apps/reanimated/examples/OpacityTransformExample.tsx`
  - `apps/common-app/src/apps/reanimated/examples/AnimatedTabBarExample.tsx`

---

## Big TODO Checklist (actionable)

### A. Ensure JS-only Animated configuration

- [ ] Audit all timing/spring animations to set `useNativeDriver: false` for testing

```sh
rg --no-ignore -n "Animated\.(timing|spring)\(" apps/ | rg -v "useNativeDriver:\s*false" -n
```

### B. Prefer transform/opacity over layout props

- [ ] Find animations driving `width|height|top|left|shadow*`

```sh
rg --no-ignore -n "Animated\.(timing|spring).*\{[\n\s\S]*?toValue:[\s\S]*?\}" apps/ | rg -n "(width|height|top|left|shadow)"
```

- [ ] Replace with transform-based equivalents where visually acceptable

### C. Reuse Animated.Value and sequences

- [ ] Detect new `Animated.Value` constructed inside render bodies

```sh
rg --no-ignore -n "function .*\(|=>\s*\(|React\.FC|export function" apps/ -U | rg -n "new\s+Animated\.Value\("
```

- [ ] Move to `useRef` and reuse across interactions

### D. Remove heavy inline props for memoized children

- [ ] Find animated components with inline style arrays

```sh
rg --no-ignore -n "<Animated\.[A-Za-z]+\s+style=\{\[" apps/
```

- [ ] Hoist style fragments outside render or into small subcomponents

### E. Avoid setState during animations

- [ ] Locate RAF loops or tickers calling `setState`

```sh
rg --no-ignore -n "requestAnimationFrame\(|setInterval\(" apps/ | rg -n "set(State|.*\))"
```

- [ ] Replace with `Animated.Value`-driven visuals

### F. Gate with reduced motion

- [ ] Integrate a `useReducedMotion` hook (AccessibilityInfo) and skip/reduce continuous loops when enabled

### G. Throttle high-frequency events

- [ ] Ensure `scrollEventThrottle={16}` or higher where applicable

```sh
rg --no-ignore -n "<Animated\.(FlatList|ScrollView|SectionList)[^>]*onScroll" apps/
```

### H. Cancel animations on unmount

- [ ] Track long-running loops and stop them in effect cleanups

### I. Color interpolation prudence

- [ ] Identify color interpolations and long durations; consider discrete steps or shorter spans

```sh
rg --no-ignore -n "outputRange:\s*\[.*'#|\"#" apps/
```

### J. Verify transform-first in key examples

- [ ] Review:
  - `apps/common-app/src/apps/reanimated/examples/TransformOriginExample.tsx`
  - `apps/common-app/src/apps/reanimated/examples/OpacityTransformExample.tsx`
  - `apps/common-app/src/apps/reanimated/examples/AnimatedTabBarExample.tsx`

### K. Optional: Basic FPS overlay in dev

- [ ] Add `useFps` hook and small overlay to validate improvements

---

## Anti-Patterns Summary

- Creating `new Animated.Value()` per interaction instead of reusing a ref
- Starting animations inside render
- Animating `width/height` continuously when a transform alternative exists
- Frequent `setState` during animation frames
- Heavy color interpolations in long-running loops
- Inline style arrays/objects handed to memoized children

---

## Quick Reference Snippets

### Timing with repeat and delay

```tsx
const v = useRef(new Animated.Value(0)).current;
const cycle = Animated.sequence([
  Animated.delay(150),
  Animated.timing(v, { toValue: 1, duration: 250, useNativeDriver: false }),
  Animated.timing(v, { toValue: 0, duration: 250, useNativeDriver: false }),
]);
Animated.loop(cycle, { iterations: 6 }).start();
```

### Spring to position with transform

```tsx
const x = useRef(new Animated.Value(0)).current;
Animated.spring(x, {
  toValue: 160,
  stiffness: 200,
  damping: 18,
  mass: 1,
  useNativeDriver: false,
}).start();
return <Animated.View style={{ transform: [{ translateX: x }] }} />;
```

---

Adopt these patterns incrementally, verify with an FPS readout or simple profiling, and keep trees stable while driving visuals with `Animated.Value`. This will get you close to the repo’s optimization ethos while staying in pure JS for testing.
