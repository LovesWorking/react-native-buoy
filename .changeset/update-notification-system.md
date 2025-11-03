---
"@react-buoy/core": patch
"@react-buoy/network": patch
"@react-buoy/storage": patch
"@react-buoy/env": patch
"@react-buoy/react-query": patch
"@react-buoy/route-events": patch
"@react-buoy/debug-borders": patch
---

Improvements to package compatibility and type system

- **Removed postinstall scripts**: Modern package managers (pnpm v10+) block postinstall scripts by default for security. Removed all postinstall scripts to prevent installation warnings.

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
  - Added "toggle-only" to `LaunchMode` type
  - Cleaner import structure for better monorepo compatibility

