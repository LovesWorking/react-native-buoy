# @react-buoy/network

## 0.1.21

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

- Updated dependencies [16c3d8d]
  - @react-buoy/react-query@0.1.21

## 0.1.14

### Patch Changes

- Automated patch release for all packages.
- 5f9e386: support axios usage
- Updated dependencies
  - @react-buoy/react-query@0.1.14
  - @react-buoy/shared-ui@0.1.14

## 0.1.13

### Patch Changes

- Automated patch release for all packages.
- Updated dependencies
  - @react-buoy/react-query@0.1.13
  - @react-buoy/shared-ui@0.1.13

## 0.1.12

### Patch Changes

- Automated patch release for all packages.
- Updated dependencies
  - @react-buoy/react-query@0.1.12
  - @react-buoy/shared-ui@0.1.12

## 0.1.11

### Patch Changes

- Automated patch release for all packages.
- Updated dependencies
  - @react-buoy/react-query@0.1.11
  - @react-buoy/shared-ui@0.1.11

## 0.1.10

### Patch Changes

- Automated patch release for all packages.
- Updated dependencies
  - @react-buoy/react-query@0.1.10
  - @react-buoy/shared-ui@0.1.10

## 0.1.9

### Patch Changes

- Automated patch release for all packages.
- Updated dependencies
  - @react-buoy/react-query@0.1.9
  - @react-buoy/shared-ui@0.1.9

## 0.1.8

### Patch Changes

- Automated patch release for all packages.
- Updated dependencies
  - @react-buoy/react-query@0.1.8
  - @react-buoy/shared-ui@0.1.8

## 0.1.7

### Patch Changes

- b280b95: Automated patch release for all packages.
- Automated patch release for all packages.
- Updated dependencies [b280b95]
- Updated dependencies
  - @react-buoy/react-query@0.1.7
  - @react-buoy/shared-ui@0.1.7

## 0.1.6

### Patch Changes

- Automated patch release for all packages.
- Updated dependencies
  - @react-buoy/react-query@0.1.6
  - @react-buoy/shared-ui@0.1.6

## 0.1.5

### Patch Changes

- Automated patch release for all packages.
- Updated dependencies
  - @react-buoy/react-query@0.1.5
  - @react-buoy/shared-ui@0.1.5

## 0.1.4

### Patch Changes

- Automated patch release for all packages.
- Updated dependencies
  - @react-buoy/react-query@0.1.4
  - @react-buoy/shared-ui@0.1.4

## 0.1.3

### Patch Changes

- Automated patch release for all packages.
- Updated dependencies
  - @react-buoy/react-query@0.1.3
  - @react-buoy/shared-ui@0.1.3

## 0.1.2

### Patch Changes

- 88dba34: Automated patch release for all packages.
- Automated patch release for all packages.
- Updated dependencies [88dba34]
- Updated dependencies
  - @react-buoy/react-query@0.1.2
  - @react-buoy/shared-ui@0.1.2

## 0.1.1

### Patch Changes

- 54242e7: Initial publish of the React Buoy tool suite under the new repository.
- Updated dependencies [54242e7]
  - @react-buoy/shared-ui@0.1.1
  - @react-buoy/react-query@0.1.1

## Unreleased

- No published releases yet. Future updates will be recorded automatically by Changesets.
