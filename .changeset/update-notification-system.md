---
"@react-buoy/core": patch
"@react-buoy/network": patch
"@react-buoy/storage": patch
"@react-buoy/env": patch
"@react-buoy/react-query": patch
"@react-buoy/route-events": patch
---

Add unified update notification system with automatic package manager detection

- **Update Notifications**: Automatically notify users when new versions are available
  - Detects package manager (npm, pnpm, yarn, bun) and shows appropriate command
  - Version-locked across all packages for consistency
  - Smart deduplication to show notification only once
  - Perfect box alignment with proper ANSI code handling
  - Clear, user-friendly messaging

- **Network Icon Fix**: Changed network tool icon from WifiCircuitIcon to Globe icon
  - Now consistent across dial menu, floating menu, and settings
  - More flexible API with `iconColor` instead of `colorPreset`

- **TypeScript Improvements**: 
  - Removed problematic re-exports that caused `rootDir` conflicts
  - All typecheck errors resolved
  - Cleaner import structure for better monorepo compatibility

- **Testing**: Added comprehensive test suite for update notifications
  - 21 automated tests covering all functionality
  - Single command for complete verification
  - Visual demo to preview notification appearance

