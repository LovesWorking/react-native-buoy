# @react-buoy/shared-ui

## 1.5.0-beta.1

### Patch Changes

- Automated beta release for all packages.

## 0.1.34-beta.5

### Patch Changes

- Automated beta release for all packages.

## 0.1.34-beta.4

### Patch Changes

- Automated beta release for all packages.

## 0.1.34-beta.3

### Patch Changes

- Automated beta release for all packages.

## 0.1.34-beta.2

### Patch Changes

- Automated beta release for all packages.

## 0.1.34-beta.1

### Patch Changes

- Automated beta release for all packages.

## 0.1.34-beta.0

### Patch Changes

- fix: comprehensive optional dependency improvements

  - **AsyncStorage**: Enhanced error handling to catch ALL initialization errors including native module failures
  - **expo-router**: Created safe wrappers with graceful fallbacks for all hooks
  - **react-navigation**: Created safe wrappers with graceful fallbacks
  - **React Query**: Added helpful error message when peer dependency is missing
  - All optional dependencies now work reliably when packages are missing or native modules aren't linked

## 0.1.33

### Patch Changes

- Automated beta release for all packages.
- 5abd85c: Fix back button touch handling in floating modals and resolve ESLint errors

  - **JsModal**: Add `onBack` prop to enable tap detection on top-left corner resize handle, preventing accidental resize when tapping back button
  - **StorageModalWithTabs**: Pass appropriate back handler to JsModal based on current view state
  - **clearAllStorage**: Remove useless try/catch wrappers that only re-threw errors
  - **Switch statements**: Add explicit fallthrough comments to satisfy ESLint no-fallthrough rule

- fix: improve optional dependency handling for AsyncStorage, expo-router, and react-navigation

  - Enhanced error handling to catch all AsyncStorage initialization errors (not just module not found)
  - Now handles case where AsyncStorage package is installed but native module isn't linked
  - Added protection against React Fast Refresh internal property access
  - Created safe wrappers for expo-router and react-navigation hooks
  - All optional peer dependencies now gracefully fall back when unavailable
  - Added helpful error message for @react-buoy/react-query when React Query is missing

## 0.1.33-beta.2

### Patch Changes

- Automated beta release for all packages.
- 5abd85c: Fix back button touch handling in floating modals and resolve ESLint errors

  - **JsModal**: Add `onBack` prop to enable tap detection on top-left corner resize handle, preventing accidental resize when tapping back button
  - **StorageModalWithTabs**: Pass appropriate back handler to JsModal based on current view state
  - **clearAllStorage**: Remove useless try/catch wrappers that only re-threw errors
  - **Switch statements**: Add explicit fallthrough comments to satisfy ESLint no-fallthrough rule

## 0.1.33-beta.1

### Patch Changes

- Automated beta release for all packages.
- 5abd85c: Fix back button touch handling in floating modals and resolve ESLint errors

  - **JsModal**: Add `onBack` prop to enable tap detection on top-left corner resize handle, preventing accidental resize when tapping back button
  - **StorageModalWithTabs**: Pass appropriate back handler to JsModal based on current view state
  - **clearAllStorage**: Remove useless try/catch wrappers that only re-threw errors
  - **Switch statements**: Add explicit fallthrough comments to satisfy ESLint no-fallthrough rule

## 0.1.33-beta.0

### Patch Changes

- Automated beta release for all packages.
- 5abd85c: Fix back button touch handling in floating modals and resolve ESLint errors

  - **JsModal**: Add `onBack` prop to enable tap detection on top-left corner resize handle, preventing accidental resize when tapping back button
  - **StorageModalWithTabs**: Pass appropriate back handler to JsModal based on current view state
  - **clearAllStorage**: Remove useless try/catch wrappers that only re-threw errors
  - **Switch statements**: Add explicit fallthrough comments to satisfy ESLint no-fallthrough rule

## 0.1.14

### Patch Changes

- Automated patch release for all packages.

## 0.1.13

### Patch Changes

- Automated patch release for all packages.

## 0.1.12

### Patch Changes

- Automated patch release for all packages.

## 0.1.11

### Patch Changes

- Automated patch release for all packages.

## 0.1.10

### Patch Changes

- Automated patch release for all packages.

## 0.1.9

### Patch Changes

- Automated patch release for all packages.

## 0.1.8

### Patch Changes

- Automated patch release for all packages.

## 0.1.7

### Patch Changes

- b280b95: Automated patch release for all packages.
- Automated patch release for all packages.

## 0.1.6

### Patch Changes

- Automated patch release for all packages.

## 0.1.5

### Patch Changes

- Automated patch release for all packages.

## 0.1.4

### Patch Changes

- Automated patch release for all packages.

## 0.1.3

### Patch Changes

- Automated patch release for all packages.

## 0.1.2

### Patch Changes

- 88dba34: Automated patch release for all packages.
- Automated patch release for all packages.

## 0.1.1

### Patch Changes

- 54242e7: Initial publish of the React Buoy tool suite under the new repository.

## Unreleased

- No published releases yet. Future updates will be recorded automatically by Changesets.
