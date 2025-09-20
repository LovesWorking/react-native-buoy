---
id: launching-tools-programmatically
title: Launching Tools Programmatically
---

Trigger tools without tapping the bubble—perfect for deep links, error handlers, or keyboard shortcuts.

[//]: # 'Example'
```tsx
import { useEffect } from 'react';
import { AppState } from 'react-native';
import {
  useAppHost,
  DevToolsSettingsModal,
} from '@monorepo/devtools-floating-menu';

export function AutoOpenSettings({ apps }) {
  const { open } = useAppHost();

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && global.__DEV__) {
        open({
          id: 'settings',
          title: 'Dev Tools Settings',
          component: DevToolsSettingsModal,
          launchMode: 'host-modal',
          singleton: true,
          props: { availableApps: apps },
        });
      }
    });
    return () => sub.remove();
  }, [apps, open]);
}
```
[//]: # 'Example'

## Deep Link Service

Wrap App Host with a service that reacts to deep links or command palette events.

[//]: # 'Example'
```ts
import { Linking } from 'react-native';
import { useAppHost } from '@monorepo/devtools-floating-menu';

export function useDevtoolsLinking(apps) {
  const { open } = useAppHost();

  useEffect(() => {
    const handler = ({ url }: { url: string }) => {
      if (!url.startsWith('devtools://')) return;
      const [, action, target] = url.split('/');

      if (action === 'open') {
        const match = apps.find((app) => app.id === target);
        if (match) {
          open({ ...match, title: match.name });
        }
      }
    };

    const sub = Linking.addEventListener('url', handler);
    return () => sub.remove();
  }, [apps, open]);
}
```
[//]: # 'Example'

## Tips

- Always pass the same `apps` array you registered with `FloatingMenu` so `open` has the right component and props.
- For tools with long-lived state, mark them `singleton` so programmatic launches reuse the existing instance.
- Combine with [`useDevToolsVisibility`](../guides/state-visibility.md) to auto-hide the bubble when launching tools from background events.
