# Advanced Reanimated Animation Handbook

A comprehensive, pragmatic guide to writing the cleanest and fastest animations using React Native Reanimated (v2/v3+), drawing on patterns and cautions from this repository’s examples and docs. Includes: setup, API deep-dives, performance principles, do/don’ts, crash-avoidance, debugging, migration insights, and a large actionable TODO list.

This handbook assumes you are using the Reanimated Babel plugin and Hermes, with Fabric enabled where relevant.

---

## 0) Setup and Foundations

### Babel plugin configuration

```js
// babel.config.js
module.exports = {
  presets: ["module:metro-react-native-babel-preset"],
  plugins: [
    "react-native-reanimated/plugin", // must be last
  ],
};
```

- The plugin enables worklets, automatic workletization (e.g., for `useAnimatedStyle` callbacks), and various compile-time optimizations.
- Keep the plugin last to ensure it transforms after other plugins.

### Mental model: runtimes and worklets

- UI runtime: Worklets execute off the JS thread, close to rendering. Put animation math here.
- JS runtime: Regular React code, effects, and business logic.
- Bridge crossing is expensive; minimize `runOnJS` calls from worklets.

### Key building blocks

- `useSharedValue(initial)` stores mutable state for animations.
- `useDerivedValue(derive)` derives values reactively on the UI runtime.
- `useAnimatedStyle(fn)` returns styles computed from shared/derived values, executed as a worklet.
- `useAnimatedProps(fn)` animates props without causing React re-renders.
- Animation drivers: `withTiming`, `withSpring`, `withDecay`.
- Modifiers: `withDelay`, `withRepeat`, `withSequence`, `withClamp`.
- Layout animations: entering/exiting, layout transitions, and keyframe builders.

---

## 1) Start Here: A Minimal Fast Pattern

```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

export function Pulse() {
  const v = useSharedValue(0);

  const style = useAnimatedStyle(() => ({
    opacity: v.value,
    transform: [
      {
        scale: v.value * 0.1 + 1,
      },
    ],
  }));

  // kick off once (e.g., in useEffect)
  // v.value = withRepeat(withTiming(1, { duration: 250, easing: Easing.inOut(Easing.quad) }), -1, true);

  return (
    <Animated.View
      style={[{ width: 80, height: 80, backgroundColor: "tomato" }, style]}
    />
  );
}
```

Notes for speed:

- Compute everything in worklets (`useAnimatedStyle`).
- Prefer `transform` and `opacity` for smoothness.
- Use `withRepeat` with `reverse: true` for yoyo.

---

## 2) Core APIs and Fast Usage

### 2.1 Shared and Derived Values

```tsx
const progress = useSharedValue(0);
const doubled = useDerivedValue(() => progress.value * 2);
```

- Put math in `useDerivedValue` or in animated styles; both are UI-runtime worklets.
- Avoid `setState` during animation; prefer shared/derived values.

### 2.2 Animated Styles vs Animated Props

```tsx
const style = useAnimatedStyle(() => ({
  transform: [{ translateY: progress.value * -40 }],
}));

const animatedProps = useAnimatedProps(() => ({
  // e.g., for SVG or TextInput
  strokeWidth: progress.value * 2,
}));
```

- Use `useAnimatedProps` for props that would otherwise cause re-renders.
- For cross-platform or SVG, props often perform better than styles.

### 2.3 Timing (withTiming)

```tsx
progress.value = withTiming(1, {
  duration: 300,
  easing: Easing.inOut(Easing.quad),
});
```

- Use timing for predictable, UI-thread-friendly motion.
- Use an easing curve matched to the interaction (easeInOut for toggles, standard material curves for transitions).

### 2.4 Spring (withSpring)

```tsx
x.value = withSpring(100, {
  stiffness: 200,
  damping: 18,
  mass: 1,
});
```

- Physics feels natural; tune `stiffness/damping/mass` for responsiveness.
- Avoid over-damped springs that take long to settle.

### 2.5 Decay (withDecay)

```tsx
x.value = withDecay({ velocity: 1500, clamp: [0, width] });
```

- Simulates momentum. Always clamp to safe bounds when required.

### 2.6 Modifiers

```tsx
// Delay
progress.value = withDelay(150, withTiming(1, { duration: 200 }));

// Repeat (infinite, yoyo)
progress.value = withRepeat(withTiming(1, { duration: 250 }), -1, true);

// Sequence
progress.value = withSequence(
  withTiming(1, { duration: 180 }),
  withSpring(0, { stiffness: 240, damping: 20 }),
);

// Clamp (limit over-shoot)
progress.value = withClamp({ min: 0, max: 1 }, withSpring(2));
```

- Compose small building blocks; prefer composition over complex conditionals.

---

## 3) Layout Animations (Fabric-safe patterns)

- Entering/Exiting: `FadeIn`, `SlideIn*`, `BounceIn`, etc.
- Layout transitions: `Layout`, `SequencedTransition`, `CurvedTransition`, etc.
- Keyframes: Explicitly define
  timing for complex sequences.

Guidelines:

- Stable trees: Avoid conditional rendering that swaps different component subtrees within one component. Prefer separate components that return `null` when not visible.
- Use consistent keys for mount/unmount.
- Keep structure invariant; only animate layout or styles.

Modal composition template (Fabric-safe):

```tsx
// Good: separate components with visibility guards
<ListModal visible={!selected} onItemSelect={setSelected} />
<DetailModal visible={!!selected} item={selected} onClose={() => setSelected(null)} />
```

---

## 4) Gestures (high-performance)

- Use `react-native-gesture-handler` for touch input and map gesture events to shared values.
- Run gesture logic as worklets; avoid `runOnJS` except for side effects.

```tsx
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const pan = Gesture.Pan()
  .onUpdate((e) => {
    x.value = e.translationX;
    y.value = e.translationY;
  })
  .onEnd(() => {
    x.value = withDecay({ velocity: 1000 });
    y.value = withDecay({ velocity: 1000 });
  });

return (
  <GestureDetector gesture={pan}>
    <Animated.View style={style} />
  </GestureDetector>
);
```

- Keep gesture computations minimal. Use derived values and `interpolate` for style mapping.

---

## 5) Performance Principles (Do / Don’t)

### Do

- Compute in worklets: `useAnimatedStyle`, `useDerivedValue`, gesture handlers.
- Prefer `transform`/`opacity` over layout properties.
- Reuse shared values; avoid creating them per interaction.
- Use `useAnimatedProps` to avoid React re-renders when animating props.
- `withRepeat/withDelay/withSequence` for composition, not nested conditionals.
- Gate animations with reduced motion preferences.

### Don’t

- Don’t call `setState` every frame.
- Don’t overuse `runOnJS`; cross only when necessary.
- Don’t allocate large objects in worklets each frame.
- Don’t conditionally switch view trees mid-animation (Fabric).
- Don’t block the UI runtime with heavy math; precompute or simplify.

---

## 6) Reduced Motion and Accessibility

```tsx
import { ReducedMotionConfig } from "react-native-reanimated";

// At app root
<ReducedMotionConfig skipAnimations>
  <App />
</ReducedMotionConfig>;
```

- Alternatively, read platform accessibility settings and scale down or skip animations.

---

## 7) Debugging and Profiling

### Performance monitor

```tsx
import { PerformanceMonitor } from "react-native-reanimated";

// Render in dev only
{
  __DEV__ && <PerformanceMonitor />;
}
```

- Watch FPS and UI/JS thread utilization.

### Logging from worklets

- Use minimal logging in worklets; prefer `runOnJS(console.log)` if needed, but sparingly.

### Testing animations

- Unit tests: verify animation end-states and derived values.
- For runtime behavior, guard animations behind flags or test utilities.

### Common issues and fixes

- Jank: move math to worklets; reduce allocations; switch to transforms.
- Stale closures: prefer `useDerivedValue` or update refs.
- Crashes with Fabric: stabilize trees and keys; avoid swapping component structures conditionally.

---

## 8) Migration Notes (v1 → v2 → v3+)

- v1 (nodes) → v2 (worklets/shared values): Move imperative node graphs to declarative worklets. Use Babel plugin.
- v2 → v3: Expanded layout animations, improved web support, and CSS-inspired helpers; prefer the new layout builders for complex entering/exiting.
- Breaking changes: Review docs for `useSharedValue` typing, default spring configs, and layout animation APIs.

Checklist when upgrading:

- [ ] Ensure Babel plugin is last.
- [ ] Replace deprecated APIs with current equivalents (`useAnimatedStyle`, `useDerivedValue`).
- [ ] Verify layout animations for Fabric safety (stable trees, consistent keys).
- [ ] Validate default spring/timing configs against visual baselines.

---

## 9) Advanced Patterns

### Hybrid sequences

```tsx
const attention = () => {
  v.value = withSequence(
    withSpring(1.08, { stiffness: 300, damping: 16 }),
    withTiming(1, { duration: 120 }),
    withDelay(60, withTiming(1.06, { duration: 80 })),
    withTiming(1, { duration: 80 }),
  );
};
```

### Interpolation helpers

```tsx
const translateY = interpolate(
  scroll.value,
  [0, 100],
  [0, -48],
  Extrapolation.CLAMP,
);
```

- Always clamp when values should not exceed bounds.

### Animated props for expensive components

```tsx
const animatedProps = useAnimatedProps(() => ({
  // Skip React re-render path
  text: `Score: ${Math.round(score.value)}`,
}));
```

### Frame callbacks (use sparingly)

```tsx
import { useFrameCallback } from "react-native-reanimated";

useFrameCallback((frame) => {
  // lightweight sampling only
});
```

---

## 10) Crash-Avoidance Checklist (Fabric)

- [ ] No conditional JSX swapping different child trees within a single component.
- [ ] Modal components return `null` when not visible; never empty fragments.
- [ ] Stable keys for mount/unmounting items.
- [ ] Layout animations only where tree structure stays constant.

---

## 11) Big TODO List (Project-Wide)

### A. Ensure plugin and environment

- [ ] Babel plugin is installed and last in the chain
- [ ] Hermes enabled; RN version compatible with current Reanimated

### B. Audit animated props vs styles

- [ ] High-frequency updates moved to `useAnimatedProps` where possible
- [ ] Transform/opacity preferred over layout props

### C. Shared values hygiene

- [ ] No new shared values created per interaction; use `useSharedValue` once
- [ ] No `setState` in animation frames; rely on shared/derived values

### D. Worklet boundaries

- [ ] Gesture logic runs in worklets; minimize `runOnJS`
- [ ] Animated math lives in `useAnimatedStyle`/`useDerivedValue`

### E. Layout animations correctness

- [ ] Use entering/exiting/layout transitions in stable trees only
- [ ] Consistent keys for items; avoid reparenting surprises

### F. Reduced motion & accessibility

- [ ] Global reduced motion config or per-animation gating exists

### G. Debug & tests

- [ ] `PerformanceMonitor` available in dev
- [ ] Key animations have unit/regression tests for end-states

### H. Migrations & docs

- [ ] Review docs on timing/spring defaults after upgrades
- [ ] Replace deprecated APIs and ensure types match (e.g., `SharedValue<T>`, `DerivedValue<T>`)

---

## 12) Frequently Used Snippets

### Timing with repeat (yoyo)

```tsx
v.value = withRepeat(withTiming(1, { duration: 200 }), -1, true);
```

### Spring to snap points

```tsx
v.value = withSpring(snapPoint, { stiffness: 320, damping: 24, mass: 1 });
```

### Sequence with delay

```tsx
v.value = withSequence(
  withDelay(100, withTiming(1, { duration: 180 })),
  withTiming(0, { duration: 120 }),
);
```

### Animated props (SVG example)

```tsx
const animatedProps = useAnimatedProps(() => ({
  strokeDashoffset: dash.value,
}));
```

---

## 13) Where to Read More in This Repo

Docs and examples (non-exhaustive pointers):

- Layout animations: `packages/docs-reanimated/versioned_docs/version-3.x/layout-animations/*`
- Fundamentals & modifiers: `packages/docs-reanimated/versioned_docs/version-3.x/fundamentals/*`, `.../animations/*`
- Device & sensors: `packages/docs-reanimated/versioned_docs/version-3.x/device/*`
- Worklets & threading: `packages/docs-reanimated/versioned_docs/version-3.x/guides/worklets.mdx`
- Plugin internals: `packages/react-native-worklets/plugin/README-dev.md`
- Examples gallery: `packages/docs-reanimated/src/examples/*`, `apps/common-app/src/apps/reanimated/examples/*`

---

Craft animations with small, composable pieces, compute on the UI runtime, avoid re-renders, and keep your view trees stable. These patterns, combined with disciplined debugging and profiling, produce the fastest, cleanest animations Reanimated can deliver.
