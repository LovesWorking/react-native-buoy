---
id: custom-tool-inline
title: Custom Inline Tool
---

Create a HUD-style tool that renders inline instead of opening a modal—great for FPS counters or live metrics.

[//]: # 'Example'
```tsx
import { View, Text, StyleSheet } from 'react-native';
import { FloatingMenu } from '@monorepo/devtools-floating-menu';

function FpsOverlay({ fps }) {
  return (
    <View style={styles.overlay} pointerEvents="none">
      <Text style={styles.text}>{fps.toFixed(0)} FPS</Text>
    </View>
  );
}

const INSTALLED_APPS = [
  {
    id: 'fps-hud',
    name: 'FPS HUD',
    icon: ({ size }) => <Text style={{ color: '#22d3ee', fontSize: size }}>FPS</Text>,
    component: FpsOverlay,
    props: { fps: 60 },
    launchMode: 'inline',
    slot: 'dial',
    singleton: true,
  },
];

<FloatingMenu apps={INSTALLED_APPS} />;
```
[//]: # 'Example'

**Key Points**

- `launchMode: 'inline'` renders the component inside the App Host overlay without injecting `visible`/`onClose` props.
- Inline tools should be pure and idempotent—no modal animations or gestures.
- Use `pointerEvents="none"` so the overlay does not block the underlying UI.

Pair inline tools with modal tools to deliver both quick-glance metrics and deep inspection in the same floating menu.
