# Floating Menu Dev Tools – Progress Tracker

_Last updated: 2025-02-14_

## ✅ Completed
- **Floating bubble persistence** – allow manual `savePosition` during drags and switched to shared `safeAsyncStorage` helper so location survives reloads even without AsyncStorage installed.
- **Settings defaults merge** – loading settings now overlays stored values on the latest app defaults so new tools automatically appear without wiping storage.
- **Drag-to-hide affordance** – relaxed the draggable clamp so the bubble can cross the right edge and snap into the hidden grabber position again.
- **Auto-unhide after hosted modals** – floating menu now resets its internal hidden state whenever the AppHost finishes closing, so the bubble reappears automatically.
- **Documented plug-and-play API** – added a concise reference covering `InstalledApp.component`, `props`, `launchMode`, and `singleton` usage in `docs/implementation-summary.md`.
- **Removed legacy onPress path** – `InstalledApp` now requires a `component`, and the floating row/dial only launch AppHost-driven tools.

## 🔜 In Flight
- **File decomposition** – split `floatingTools.tsx` into smaller modules (persistence hook, presentation component, helpers) for maintainability.
- **Singleton handling** – update `AppHost.open` so relaunching a singleton returns the existing instance id and promotes it to the top.

## ⏭️ Up Next
- **Restore without timers** – remove the 100 ms `setTimeout` in `AppHost` and gate restoration on explicit app registration.
- **Dial animation cleanup** – stop unused loops (`circuitOpacity`, always-on `Animated.loop`) to reduce idle work on low-end devices.
- **Accessibility polish** – add `accessibilityRole/Label` to the dial button and grip handle, ensure the settings modal toggles announce state.
- **Stronger typing** – replace `ComponentType<any>` / `registerApps(apps: any[])` with generics so plug-ins are type-checked at compile time.
- **Clean persistence refs** – drop the unused `saveTimeoutRef` in `floatingTools.tsx` now that the hook owns debouncing.

## 📌 Backlog
- Orientation/Dimensions listener so saved positions clamp correctly on rotation.
- Host-modal ergonomics (safe-area, keyboard avoidance) for AppHost-wrapped tools.
- Telemetry hooks (`onToolOpened` / `onToolClosed`) for downstream analytics.

_Next focus: land the singleton + restoration fixes, then knock out the animation/accessibility cleanup items._
