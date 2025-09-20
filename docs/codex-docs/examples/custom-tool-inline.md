---
id: custom-tool-inline
title: Custom Inline Tool
---

Render a HUD-style tool that floats above the app instead of opening a modal—ideal for FPS or feature flags.

[//]: # 'Example'
```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppHostProvider, FloatingMenu } from '@react-buoy/core';

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
    name: 'FPS',
    icon: ({ size }) => <Text style={{ color: '#22d3ee', fontSize: size }}>FPS</Text>,
    component: FpsOverlay,
    props: { fps: 60 },
    launchMode: 'inline',
    slot: 'dial',
    singleton: true,
  },
];

const queryClient = new QueryClient();

export default function InlineToolExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppHostProvider>
        <FloatingMenu apps={INSTALLED_APPS} />
      </AppHostProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});
```
[//]: # 'Example'

**Key points**
- `launchMode: 'inline'` skips modal props and renders directly inside the overlay layer.
- Keep inline tools pure and stateless—no gestures or async side effects.
- Use `pointerEvents="none"` so HUDs never block the app.
