# PokemonCardSwipeable – Senior Swipe Experience Review

## Summary
- Reproduced frequent "stuck" states when performing wide or diagonal swipes; the card keeps its partial offset and stops responding until the next render.
- Root causes are a mix of missing responder‑cancellation handling, aggressive dismissal thresholds, and ScrollView gesture conflicts.
- Several low-level tweaks can substantially smooth the interaction without redesigning the component; consider a more modern gesture stack (Gesture Handler + Reanimated) for longer-term maintainability.

## High-Impact Issues

### 1. Cards remain stuck after large/diagonal swipes (gesture cancellation not handled)
**Severity:** High  
**References:** `example/screens/pokemon/PokemonCardSwipeable.tsx:93-180`

**What happens**  
Big swipes that include a vertical component (try swiping down-right) reliably leave the card frozen mid-gesture. The ScrollView parent starts to claim the gesture once the user moves vertically, React Native terminates the card’s responder, and the component never receives `onPanResponderRelease` to finish or reset the state. Because we never reset the animated values, the card stays offset/rotated and `onSwipe` never fires.

**Why it happens**  
`PanResponder.create` lacks both `onPanResponderTerminationRequest` (to refuse handing control back to the ScrollView) and `onPanResponderTerminate` (to clean up if the system cancels the gesture). By default, RN will happily terminate the responder chain when a ScrollView wants to scroll. When that happens, our `translateX`, `translateY`, rotation, opacity, and `decisionProgress` values stay where they were, leaving the card visually "stuck".

**Fix ideas**  
- Add `onStartShouldSetPanResponder`/`onMoveShouldSetPanResponder` guards that only claim horizontal drags (see issue #2) so we do not fight vertical scrolling.
- Implement `onPanResponderTerminationRequest` returning `false` to keep control once we start a swipe.
- Handle `onPanResponderTerminate` by springing the card back to its resting pose, resetting `decisionProgress`, and clearing `swipeDirection` just like the non-dismissal branch of `onPanResponderRelease`.
- As a belt-and-suspenders guard, watch `isActive` changes (e.g., `useEffect` on `[isActive]`) and reset the animated values if a card suddenly becomes inactive while still offset.

### 2. Swipe threshold feels unforgiving on phones
**Severity:** High (UX regressions)  
**References:** `example/screens/pokemon/PokemonCardSwipeable.tsx:137-143`

**What happens**  
Users must drag ~30% of the whole screen width (`Dimensions.get("window")`) before the card dismisses. On a 390pt screen, that is ~117pt. Given the card itself is only `width - 60`, the user has to push the card almost completely off screen before `shouldSwipe` trips. If they release earlier (very common on quick gestures), the card snaps back and "feels broken" even though the gesture looked big.

**Why it happens**  
`SWIPE_THRESHOLD` uses the full window width, not the card’s render width. The decision also ignores swipe direction changes (e.g., people overshoot and come back toward center before releasing, bringing `dx` below threshold).

**Fix ideas**  
- Base the threshold on the actual card width (`width - 60`), or compute `cardWidth` directly from layout via `onLayout` + `useRef`.
- Combine distance and velocity more thoughtfully: e.g., treat the gesture as a dismissal when `abs(dx) > cardWidth * 0.18` OR `abs(vx) > 0.45`.
- Snapshot `gestureState.dx` at the moment we cross the threshold and latch the decision; do not allow a late reversal to cancel the swipe unless the user drags back past a defined hysteresis window.

### 3. Cancelled animations still trigger `onSwipe`
**Severity:** Medium (state drift, phantom saves)  
**References:** `example/screens/pokemon/PokemonCardSwipeable.tsx:148-180`

**What happens**  
Even when the dismissal animation is interrupted (e.g., a second finger touches the screen, app loses focus), the `Animated.parallel(...).start(() => { onSwipe(...) })` callback fires. That means we advance the stack, save/release the Pokémon, and play haptics even though the card never actually exited the screen.

**Why it happens**  
`Animated.start` passes `{ finished: boolean }` to its completion callback. When we ignore that flag, interrupted animations look identical to completed ones. In cancellation scenarios the card can pop back into view (because its animated values reset when the component re-renders) but our state has already advanced.

**Fix ideas**  
- Check the `finished` flag before calling `onSwipe`. Skip the handler and fully reset the card if the animation was cancelled.
- As part of issue #1’s termination handling, explicitly call `translateX.setValue(0)` etc. if we detect an aborted animation.

### 4. ScrollView conflicts from unconditional responder capture
**Severity:** Medium (gesture jitter, RNG stuck reproduction)  
**References:** `example/screens/pokemon/PokemonCardSwipeable.tsx:93-134`

**What happens**  
Because `onMoveShouldSetPanResponder` always returns `isActive`, every small movement while touching the active card steals the responder away from the surrounding `ScrollView`. That makes vertical scrolling difficult, but worse: when a user begins a vertical scroll, the ScrollView fights back, sometimes winning and cancelling the gesture (which feeds issue #1).

**Fix ideas**  
- Use both `onStartShouldSetPanResponder` and `onMoveShouldSetPanResponder` to gate on horizontal intent, e.g.
  ```ts
  const shouldStart = isActive && Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.1;
  return shouldStart;
  ```
- Consider `onMoveShouldSetPanResponderCapture` to prevent sibling responders while still handing control to the ScrollView when the user is clearly scrolling vertically.
- If you stick with `PanResponder`, call `evt.preventDefault()` (via native driver) or use `react-native-gesture-handler`’s `simultaneousHandlers` for a more predictable experience.

## Additional Implementation / UX Improvements

- **Reset decision state when card deactivates.** Right now `decisionProgress` and `swipeDirection` stay latched even after the card drops to index 1 or 2. When the same component instance is reused as the top card again, the badge can flash briefly. Add a `useEffect` on `[isActive]` to zero out the animated values and `setSwipeDirection(null)`.
- **Unify reset logic.** The non-dismiss branch of `onPanResponderRelease` repeats the same spring setup three times. Extracting a helper like `resetCard(positionPreset)` makes the flow easier to follow and reduces the chance of forgetting to update one branch.
- **Leverage `Animated.decay` or spring physics for dismissals.** Currently we jump to a fixed 300 ms timing regardless of velocity. Using `Animated.decay` seeded with `gestureState.vx`/`vy` keeps the exit feel consistent and lets slow drags settle smoothly.
- **Explicit haptic error handling.** `Haptics.impactAsync` rejections are ignored. Wrap the calls in `.catch(() => {})` (you already do that elsewhere in the screen) to avoid yellow-box noise in development.
- **Memoization clarity.** The `useMemo` dependency list contains animated values (`translateX`, `translateY`, etc.) which are stable refs, but it obscures the actual dependency (`isActive`, `index`, `onSwipe`). Simplify the array to the real React refs so future maintainers don’t worry about accidental re-instantiation.

## Alternative Approaches Worth Considering

1. **Gesture Handler + Reanimated**  
   Swap `PanResponder` for `react-native-gesture-handler`’s `GestureDetector` and drive transforms with Reanimated worklets. You get:
   - Better simultaneous gesture coordination with the surrounding `ScrollView` via `simultaneousHandlers`/`waitFor`.
   - Native-animated physics (springs, decay) that stay silky at 120 Hz.
   - Easier interruption handling (`onFinalize` guarantees a callback regardless of completion vs cancellation).

2. **Deck abstraction**  
   Encapsulate the swipe logic (position presets, thresholds, animations) inside a reusable `useSwipeableCard` hook or a `Deck` component. This keeps `PokemonCardSwipeable` focused on rendering, and makes it trivial to unit-test the interaction contract independent of the art layer.

3. **State machine for swipe lifecycle**  
   Introducing a tiny state machine (Idle → Dragging → Dismissing → Settling) clarifies the behavior around cancellation, multi-touch, and programmatic skips. Libraries like `xstate` are overkill here; a simple `useReducer` plus descriptive actions (`DRAG_START`, `DRAG_CANCELLED`, `DRAG_COMMIT`) makes regression testing easier.

## Testing & Validation Suggestions

- **Automated gesture regression:** Add Detox or Maestro scripts that simulate diagonal drags and rapid swipe/release sequences to ensure `onSwipe` fires exactly once per dismissal and the card always resets.
- **Threshold tuning sessions:** Log the max drag distance/velocity for real users (or QA) and adjust the threshold constants to match natural behavior. Even a debug overlay showing current `dx`, `vx`, and decision state would make tuning faster.
- **Unit tests around helper logic:** If you extract the dismissal decision into a pure function (`shouldCommitSwipe({ dx, vx, width })`), you can unit-test edge cases without spinning up the UI.

## Recommended Next Steps

1. Patch the responder handling (issues #1 and #4) and tighten the threshold logic (issue #2). This should eliminate the "stuck" perception immediately.
2. Guard `onSwipe` with the animation completion flag (issue #3) to avoid phantom state changes.
3. Add small reset hooks (`useEffect` on `isActive`) to keep badges/opacity from flashing when cards recycle.
4. Schedule a follow-up to evaluate migrating the gesture handling to `react-native-gesture-handler` for long-term ergonomics—especially if you plan to reuse this deck interaction elsewhere in the app.

Let me know if you want sample patches for any of the above; happy to draft them.
