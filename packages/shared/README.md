# @react-buoy/shared-ui

Design system pieces shared across the React Buoy dev tools.

## Install
```bash
pnpm add @react-buoy/shared-ui
```

## What You Get
- Icon set with cyberpunk variants (`EnvLaptopIcon`, `WifiCircuitIcon`, etc.).
- Themed UI primitives (`CyberpunkSectionButton`, `CompactRow`).
- Utility helpers (safe storage wrappers, display formatting).
- Hooks (`useSafeAreaInsets`, `useHoverState`) tuned for React Native.

## Usage
```tsx
import { CyberpunkSectionButton, ReactQueryIcon } from '@react-buoy/shared-ui';

export function LaunchReactQuery({ onPress }: { onPress: () => void }) {
  return (
    <CyberpunkSectionButton
      label="React Query"
      icon={<ReactQueryIcon size={18} />}
      onPress={onPress}
    />
  );
}
```

These primitives back every `@react-buoy/*` package, but you can also use them directly in your own tooling to stay visually consistent.
