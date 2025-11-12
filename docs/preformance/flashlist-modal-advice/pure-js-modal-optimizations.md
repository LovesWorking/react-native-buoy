---
id: pure-js-modal-optimizations
title: Pure JS Modal/Bottom Sheet Performance Patterns (FlashList-inspired)
description: High-performance, pure-JavaScript patterns for modals and bottom sheets using React Native primitives, adapted from techniques in this repository.
---

## Overview

This guide distills the pure JavaScript and React Native techniques used across this repository that you can adapt for a reusable modal/bottom sheet (no native packages). Each section explains:

- What/Why: The optimization and the problem it solves
- When to use / When not to use
- Example: Minimal snippet for a modal/bottom sheet
- Benefits: Concrete performance or stability wins

All examples are pure JS/TS on the React Native side.

---

## 1) Unmount-aware setTimeout

**What/Why**: A timeout utility that auto-clears on unmount to prevent leaks and late callbacks after a sheet/modal is closed.

**Use When**: Scheduling delayed actions (e.g., post-close cleanup, delayed snap) that must not fire after unmount.

**Avoid When**: You require long-lived timers across component lifetimes; put those outside React.

**Example**

```ts
// Derived from: src/recyclerview/hooks/useUnmountAwareCallbacks.ts
import { useEffect, useState } from "react";

export function useUnmountAwareTimeout() {
  const [timeoutIds] = useState<Set<NodeJS.Timeout>>(() => new Set());

  useEffect(
    () => () => {
      timeoutIds.forEach((id) => global.clearTimeout(id));
      timeoutIds.clear();
    },
    [timeoutIds]
  );

  const setTimeoutSafe = (cb: () => void, delay: number) => {
    const id = global.setTimeout(() => {
      timeoutIds.delete(id);
      cb();
    }, delay);
    timeoutIds.add(id);
  };

  return { setTimeout: setTimeoutSafe };
}
```

**Benefits**: Prevents memory leaks and race conditions when a modal is quickly opened/closed.

---

## 2) Unmount-aware requestAnimationFrame

**What/Why**: A `requestAnimationFrame` wrapper that auto-cancels on unmount. Ideal for driving JS-thread animations without stale callbacks.

**Use When**: Animating during drag, snapping, or doing post-layout measurements on next frame.

**Avoid When**: You move animations fully to native/JSI; then this is less relevant.

**Example**

```ts
// Derived from: src/recyclerview/hooks/useUnmountAwareCallbacks.ts
import { useCallback, useEffect, useState } from "react";

export function useUnmountAwareAnimationFrame() {
  const [requestIds] = useState<Set<number>>(() => new Set());

  useEffect(
    () => () => {
      requestIds.forEach((id) => cancelAnimationFrame(id));
      requestIds.clear();
    },
    [requestIds]
  );

  const requestAnimationFrameSafe = useCallback(
    (cb: FrameRequestCallback) => {
      const id = global.requestAnimationFrame((ts) => {
        requestIds.delete(id);
        cb(ts);
      });
      requestIds.add(id);
    },
    [requestIds]
  );

  return { requestAnimationFrame: requestAnimationFrameSafe };
}
```

**Benefits**: Eliminates layout thrash and callback leaks; keeps JS animation loops safe across unmounts.

---

## 3) Unmount flag (stale update guard)

**What/Why**: A simple flag to prevent state updates after unmount; pairs well with async work, timers, and raf.

**Use When**: Any async-driven updates (drag handlers, measurements) can outlive the component.

**Avoid When**: All logic is synchronous and solely within render.

**Example**

```ts
// Derived from: src/recyclerview/hooks/useUnmountFlag.ts
import { useLayoutEffect, useRef } from "react";

export function useUnmountFlag() {
  const isUnmounted = useRef(false);
  useLayoutEffect(() => {
    isUnmounted.current = false;
    return () => {
      isUnmounted.current = true;
    };
  }, []);
  return isUnmounted;
}
```

**Benefits**: Stops “setState on unmounted component” warnings and logic races.

---

## 4) VelocityTracker (pure JS drag velocity + momentum end)

**What/Why**: Compute drag velocity using `Date.now()` deltas, with auto “momentum end” after inactivity (~100ms). Perfect for determining snap targets.

**Use When**: You need snap-to-position logic based on user fling velocity.

**Avoid When**: Using a physics engine or native gesture libraries that already expose reliable velocity and momentum events.

**Example**

```ts
// Inspired by: src/recyclerview/helpers/VelocityTracker.ts
class VelocityTracker {
  private last = Date.now();
  private v = { x: 0, y: 0 };
  private to: NodeJS.Timeout | null = null;

  compute(
    newOffset: number,
    oldOffset: number,
    isHorizontal: boolean,
    onUpdate: (v: { x: number; y: number }, momentumEnd: boolean) => void
  ) {
    this.clean();
    const now = Date.now();
    const dt = Math.max(1, now - this.last);
    const vel = (newOffset - oldOffset) / dt;
    this.last = now;
    this.v.x = isHorizontal ? vel : 0;
    this.v.y = isHorizontal ? 0 : vel;
    onUpdate(this.v, false);
    this.to = setTimeout(() => {
      this.clean();
      this.last = Date.now();
      this.v = { x: 0, y: 0 };
      onUpdate(this.v, true);
    }, 100);
  }
  clean() {
    if (this.to) {
      clearTimeout(this.to);
      this.to = null;
    }
  }
}
```

**Benefits**: Butter-smooth snap decisions without native dependencies; tiny GC footprint; easy to tune.

---

## 5) Running Average smoothing (AverageWindow) + RenderTimeTracker

**What/Why**: Maintain a running average (ring buffer) for noisy samples (e.g., frame times, velocities). Use the average to project positions or select snap thresholds.

**Use When**: Noisy JS timings/velocity should be smoothed to avoid jittery decisions.

**Avoid When**: You can rely on native gestures/animations for smoothing.

**Example**

```ts
// Derived from: src/utils/AverageWindow.ts
class AverageWindow {
  private avg = 0;
  private count = 0;
  private buf: (number | undefined)[];
  private i = 0;
  constructor(size: number, start?: number) {
    this.buf = new Array(Math.max(1, size));
    this.avg = start ?? 0;
    this.count = start === undefined ? 0 : 1;
    this.i = this.count;
    this.buf[0] = start;
  }
  get currentValue() {
    return this.avg;
  }
  addValue(value: number) {
    const idx = this.i;
    const old = this.buf[idx];
    const newCount = old === undefined ? this.count + 1 : this.count;
    this.buf[idx] = value;
    this.avg =
      this.avg * (this.count / newCount) + (value - (old ?? 0)) / newCount;
    this.count = newCount;
    this.i = (this.i + 1) % this.buf.length;
  }
}
```

**Benefits**: Stable snap/threshold logic; fewer oscillations near boundaries; predictable UX.

---

## 6) Pixel-accurate layout measurement (roundToNearestPixel)

**What/Why**: Measure with `measureLayout` and snap sizes to device pixels to avoid sub-pixel jitter during animations.

**Use When**: Rendering content whose height/width affects sheet/modal layout; animating to precise boundaries.

**Avoid When**: You’re exclusively using percentage-based layouts without animated numeric transforms.

**Example**

```ts
// Adapted from: src/recyclerview/utils/measureLayout.ts
import { PixelRatio, View } from "react-native";

function round(value: number) {
  return PixelRatio.roundToNearestPixel(value);
}

export function measureRelative(
  view: View,
  relativeTo: View,
  old?: { width: number; height: number }
) {
  const layout = { x: 0, y: 0, width: 0, height: 0 };
  view.measureLayout(relativeTo, (x, y, w, h) => {
    layout.x = x;
    layout.y = y;
    layout.width = round(w);
    layout.height = round(h);
  });
  if (old) {
    if (Math.abs(layout.width - old.width) <= 1) layout.width = old.width;
    if (Math.abs(layout.height - old.height) <= 1) layout.height = old.height;
  }
  return layout;
}
```

**Benefits**: Eliminates visual jitter due to floating-point deltas; smoother animations.

---

## 7) Offset-correction pattern (maintain visual position on content change)

**What/Why**: If content height changes mid-drag, apply a delta to the controlled offset to maintain visual continuity (no jump).

**Use When**: Dynamic content (keyboard, async content) changes while sheet is open.

**Avoid When**: Positions are static or fully offloaded to native animated layout.

**Example**

```ts
// Inspired by: src/recyclerview/hooks/useRecyclerViewController.tsx
function applyOffsetCorrection({
  prevTop: number,
  nextTop: number,
  getCurrentOffset: () => number,
  setOffsetBy: (delta: number) => void,
  ignoreForMs: (ms: number) => void,
}) {
  const diff = nextTop - prevTop;
  if (diff !== 0) {
    setOffsetBy(diff); // relative correction
    ignoreForMs(100);  // temporarily ignore events to prevent feedback loops
  }
}
```

**Benefits**: No jumps when intrinsic sizes change; preserves user-perceived position.

---

## 8) ScrollAnchor-style “scrollBy” helper

**What/Why**: Provide an imperative `scrollBy(delta)` (or `translateBy`) instead of recomputing absolutes, reducing precision errors and complexity.

**Use When**: You frequently apply small deltas during drag/measure cycles.

**Avoid When**: You only set absolute targets once.

**Example**

```tsx
// Inspired by: src/recyclerview/components/ScrollAnchor.tsx
import React, { useImperativeHandle, useMemo, useState } from "react";
import { View } from "react-native";

export interface AnchorRef {
  scrollBy: (delta: number) => void;
}

export function ScrollAnchor({
  anchorRef,
}: {
  anchorRef: React.Ref<AnchorRef>;
}) {
  const [offset, setOffset] = useState(1_000_000);
  useImperativeHandle(
    anchorRef,
    () => ({ scrollBy: (d) => setOffset((p) => p + d) }),
    []
  );
  const anchor = useMemo(
    () => (
      <View style={{ position: "absolute", height: 0, top: offset, left: 0 }} />
    ),
    [offset]
  );
  return anchor;
}
```

**Benefits**: Reliable relative movement; simpler correction logic.

---

## 9) Debounced visibility checks

**What/Why**: For visibility/reporting events, apply a small `minimumViewTime` debounce to avoid thrash while users scroll/drag quickly.

**Use When**: Reporting “sheet opened X%” or exposure events that should be stable.

**Avoid When**: Hard real-time thresholds are required.

**Example**

```ts
// Pattern from: src/recyclerview/viewability/ViewabilityHelper.ts
function reportVisibleWithDelay(
  indices: number[],
  delay = 250,
  fire: (i: number[]) => void
) {
  const id = setTimeout(() => fire(indices), delay);
  return () => clearTimeout(id); // cancel if state changes before delay elapses
}
```

**Benefits**: Fewer spurious events; better perf during fast interactions.

---

## 10) useLayoutState pattern (optional parent-layout trigger)

**What/Why**: A state setter that can skip parent layout recalculation when a change is purely visual.

**Use When**: You have internal visual toggles that shouldn’t recompute higher-level layout.

**Avoid When**: State changes affect measurable layout that parents must recalc.

**Example**

```ts
// Derived from: src/recyclerview/hooks/useLayoutState.ts
type Setter<T> = (value: T | ((p: T) => T), skipParentLayout?: boolean) => void;

export function useLayoutState<T>(initial: T): [T, Setter<T>] {
  const [state, setState] = React.useState(initial);
  const setLayoutState: Setter<T> = (next, skip) => {
    setState((prev) =>
      typeof next === "function" ? (next as any)(prev) : next
    );
    if (!skip) {
      // optionally call a parent layout recalculation here
    }
  };
  return [state, setLayoutState];
}
```

**Benefits**: Avoids unnecessary layout work; finer control of recomputation.

---

## 11) useRecyclingState (reset-on-deps without double renders)

**What/Why**: Reset internal state when keys/deps change without extra setState churn; helpful for reusing instances.

**Use When**: Switching modal content or sheet modes (e.g., compact/expanded) should reset internals.

**Avoid When**: State must be preserved across these transitions.

**Example**

```ts
// Derived from: src/recyclerview/hooks/useRecyclingState.ts
export function useRecyclingState<T>(
  initial: T | (() => T),
  deps: React.DependencyList
) {
  const store = React.useRef<T>();
  const [_, trigger] = useLayoutState(0);
  React.useMemo(() => {
    store.current =
      typeof initial === "function" ? (initial as any)() : initial;
  }, deps);
  const set = (next: T | ((p: T) => T)) => {
    const value =
      typeof next === "function" ? (next as any)(store.current!) : next;
    if (value !== store.current) {
      store.current = value;
      trigger((p) => p + 1, true);
    }
  };
  return [store.current!, set] as const;
}
```

**Benefits**: Keeps state transitions minimal; prevents extra renders during recycling.

---

## 12) Animated.createAnimatedComponent wrapper

**What/Why**: Wrap custom components in `Animated.createAnimatedComponent` to get RN Animated support with minimal re-renders.

**Use When**: You provide a custom scroll/view component for your sheet/modal that needs animated props.

**Avoid When**: Using Reanimated/native drivers that require different wrappers.

**Example**

```tsx
// Pattern from: src/recyclerview/hooks/useSecondaryProps.tsx
const AnimatedContainer = React.useMemo(() => {
  const Base = MyContainer; // or a forwarded ref component
  return Animated.createAnimatedComponent(Base);
}, []);
```

**Benefits**: Smooth Animated-driven props on your own components without refactors.

---

## 13) getValidComponent (component-or-element slots)

**What/Why**: Accept either a component type or an element for modal slots (header/footer/content) and normalize to an element.

**Use When**: Building flexible APIs for modal/bottom sheet composition.

**Avoid When**: You strictly control rendering internally.

**Example**

```ts
// From: src/recyclerview/utils/componentUtils.ts
export function getValidComponent(
  c: React.ComponentType | React.ReactElement | null | undefined
) {
  if (React.isValidElement(c)) return c;
  if (typeof c === "function") return React.createElement(c);
  return null;
}
```

**Benefits**: Cleaner composition APIs; fewer conditional render paths.

---

## 14) Platform configuration via static maps

**What/Why**: Centralize platform-dependent toggles (e.g., offset correction support) in a simple config object; branch once.

**Use When**: Behavior differs across iOS/Android/web but should not create hot-path branching everywhere.

**Avoid When**: Feature parity is identical across platforms.

**Example**

```ts
// Inspired by: src/native/config/PlatformHelper.*
export const PlatformConfig = {
  supportsOffsetCorrection: true,
  trackAverageRenderTimeForProjection: false,
};

// usage
if (PlatformConfig.supportsOffsetCorrection) {
  // do fast correction path
}
```

**Benefits**: Fewer hot-path conditionals; easier testing and tuning.

---

## 15) RTL offset adjustment

**What/Why**: Convert LTR offsets to RTL equivalents for horizontal interactions.

**Use When**: Supporting RTL for horizontal sheets or carousels.

**Avoid When**: Vertical-only sheets; no RTL needed.

**Example**

```ts
// From: src/recyclerview/utils/adjustOffsetForRTL.ts
export function adjustOffsetForRTL(
  offset: number,
  contentSize: number,
  windowSize: number
) {
  return contentSize - offset - windowSize;
}
```

**Benefits**: Correct physics in RTL, no mirrored-jank.

---

## 16) Stable modal router composition (Fabric-safe trees)

**What/Why**: Avoid conditional subtrees inside a single component. Compose specialized modals, each returns `null` when not visible, to maintain a stable view hierarchy.

**Use When**: Toggling between bottom sheet and fullscreen modal.

**Avoid When**: N/A — this is the safe default in RN Fabric.

**Example**

```tsx
// Specialized modals
export function BottomSheetModal({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  if (!visible) return null; // stable
  return <Animated.View key="bottom-sheet">{children}</Animated.View>;
}

export function FullscreenModal({
  visible,
  children,
}: {
  visible: boolean;
  children: React.ReactNode;
}) {
  if (!visible) return null; // stable
  return <Animated.View key="fullscreen-modal">{children}</Animated.View>;
}

// Router keeps tree stable; toggles visibility only
export function ModalRouter({
  isSheet,
  sheet,
  modal,
}: {
  isSheet: boolean;
  sheet: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      <BottomSheetModal visible={isSheet}>{sheet}</BottomSheetModal>
      <FullscreenModal visible={!isSheet}>{modal}</FullscreenModal>
    </>
  );
}
```

**Benefits**: Prevents view index mismatches and crashes; predictable mounts/unmounts; easier perf tuning.

---

## Putting it together: minimal bottom sheet drag flow

```tsx
import { PanResponder, View } from "react-native";
import { useUnmountAwareAnimationFrame, useUnmountFlag } from "./scheduling";

class VelocityTracker {
  /* as above */
}

export function useSheetDrag(onSnap: (open: boolean) => void) {
  const { requestAnimationFrame } = useUnmountAwareAnimationFrame();
  const isUnmounted = useUnmountFlag();
  const vt = React.useRef(new VelocityTracker()).current;
  const last = React.useRef(0);

  const pan = React.useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_, g) => {
          vt.compute(g.dy, last.current, false, (v, end) => {
            if (isUnmounted.current) return;
            last.current = g.dy;
            if (end) {
              requestAnimationFrame(() => {
                onSnap(Math.abs(v.y) < 0.5 ? g.dy < 100 : v.y < 0); // sample rule
              });
            }
          });
        },
      }),
    [requestAnimationFrame, vt]
  );

  return { panHandlers: pan.panHandlers };
}

export function BottomSheet({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const { panHandlers } = useSheetDrag(() => {});
  return <View {...panHandlers} />;
}
```

---

## Summary of Benefits

- Unmount-aware scheduling and guards remove leaks/races when modals rapidly open/close
- Velocity-driven snaps feel instant without native deps; smoothing improves stability
- Pixel rounding and offset correction eliminate visible jitter and jumps
- Stable router composition prevents Fabric crashes and re-layout thrash
- Precomputation and flexible slots simplify composition while reducing re-renders
