# Changelog

## 0.1.34-beta.1

### Patch Changes

- Automated beta release for all packages.
- Updated dependencies
  - @react-buoy/shared-ui@0.1.34-beta.1

## 0.1.34-beta.0

### Patch Changes

- fix: comprehensive optional dependency improvements

  - **AsyncStorage**: Enhanced error handling to catch ALL initialization errors including native module failures
  - **expo-router**: Created safe wrappers with graceful fallbacks for all hooks
  - **react-navigation**: Created safe wrappers with graceful fallbacks
  - **React Query**: Added helpful error message when peer dependency is missing
  - All optional dependencies now work reliably when packages are missing or native modules aren't linked

- Updated dependencies
  - @react-buoy/shared-ui@0.1.34-beta.0

## 0.1.33

### Patch Changes

- Automated beta release for all packages.
- fix: improve optional dependency handling for AsyncStorage, expo-router, and react-navigation

  - Enhanced error handling to catch all AsyncStorage initialization errors (not just module not found)
  - Now handles case where AsyncStorage package is installed but native module isn't linked
  - Added protection against React Fast Refresh internal property access
  - Created safe wrappers for expo-router and react-navigation hooks
  - All optional peer dependencies now gracefully fall back when unavailable
  - Added helpful error message for @react-buoy/react-query when React Query is missing

- Updated dependencies
- Updated dependencies [5abd85c]
- Updated dependencies
  - @react-buoy/shared-ui@0.1.33

## 0.1.33-beta.2

### Patch Changes

- Automated beta release for all packages.
- Updated dependencies
- Updated dependencies [5abd85c]
  - @react-buoy/shared-ui@0.1.33-beta.2

## 0.1.33-beta.1

### Patch Changes

- Automated beta release for all packages.
- Updated dependencies
- Updated dependencies [5abd85c]
  - @react-buoy/shared-ui@0.1.33-beta.1

## 0.1.33-beta.0

### Patch Changes

- Automated beta release for all packages.
- Updated dependencies
- Updated dependencies [5abd85c]
  - @react-buoy/shared-ui@0.1.33-beta.0

## 0.1.22

### Patch Changes

- 16c3d8d: Improvements to package compatibility, type system, and documentation

  - **Removed postinstall scripts**: Modern package managers (pnpm v10+) block postinstall scripts by default for security. Removed all postinstall scripts to prevent installation warnings.

  - **Debug Borders Auto-Discovery**: `@react-buoy/debug-borders` now auto-discovers and integrates automatically

    - No manual import or setup required
    - Automatically appears in DevTools Settings menu when installed
    - Automatically renders the overlay when enabled
    - Works seamlessly with FloatingDevTools visibility context
    - Added `debugBordersToolPreset` and `createDebugBordersTool` exports

  - **Documentation Updates**:

    - Added `@react-buoy/debug-borders` to README with auto-discovery setup
    - Updated all package installation examples to include debug-borders
    - Clarified zero-config integration pattern
    - Updated example app to demonstrate auto-discovery

  - **Network Icon Fix**: Changed network tool icon from WifiCircuitIcon to Globe icon

    - Now consistent across dial menu, floating menu, and settings
    - More flexible API with `iconColor` instead of `colorPreset`

  - **Type Compatibility Fix**: Fixed `EnvVarConfig` to be fully compatible with `RequiredEnvVar`

    - `createEnvVarConfig()` and `envVar()` helpers now work seamlessly with `FloatingDevTools`
    - Changed from optional `expectedValue?` and `expectedType?` to proper union types
    - Added "url" type support
    - Added documentation for helper function usage

  - **TypeScript Improvements**:
    - Removed problematic re-exports that caused `rootDir` conflicts
    - All typecheck errors resolved
    - Added "toggle-only" and "settings-only" to `LaunchMode` type
    - Cleaner import structure for better monorepo compatibility

All notable changes to this project will be documented in this file.

## [0.1.0] - 2025-10-16

### Added

- Initial release of @react-buoy/route-events
