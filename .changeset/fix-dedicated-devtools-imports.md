---
"@react-buoy/storage": patch
"@react-buoy/route-events": patch
---

fix: revert dedicated devtools to use direct imports of their peer dependencies

- **@react-buoy/storage**: Now directly imports AsyncStorage (like react-query does with React Query)
- **@react-buoy/route-events**: Now directly imports expo-router and react-navigation
- These packages are ONLY useful when you have their peer dependencies installed
- Safe wrappers remain in @react-buoy/shared-ui and @react-buoy/core for optional usage
- Fixes AsyncStorage event listener not working (was using no-op fallback instead of real AsyncStorage)
