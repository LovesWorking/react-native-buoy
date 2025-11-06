---
"@react-buoy/shared-ui": patch
"@react-buoy/storage": patch
---

Fix back button touch handling in floating modals and resolve ESLint errors

- **JsModal**: Add `onBack` prop to enable tap detection on top-left corner resize handle, preventing accidental resize when tapping back button
- **StorageModalWithTabs**: Pass appropriate back handler to JsModal based on current view state
- **clearAllStorage**: Remove useless try/catch wrappers that only re-threw errors
- **Switch statements**: Add explicit fallthrough comments to satisfy ESLint no-fallthrough rule
