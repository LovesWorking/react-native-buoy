# Floating Dev Tools

Drop a floating bubble into any React Native or Expo app, tap it, and launch the dev tools you need. The host takes care of opening modals, remembering state, and hiding the menu when tools are active.

## What You Get
- **Floating bubble** – Draggable launcher with a dial for extra tools.
- **App Host** – Central brain for opening, closing, and persisting tools.
- **Bundled tools** – Environment inspector, network monitor, storage browser, React Query panel (install only the ones you want).
- **Pluggable API** – Describe tools in an `apps` array and you are done.

## Install
Base packages — always add these:
```bash
pnpm add @react-buoy/core @react-buoy/shared-ui
```

Dev tools (pick what you need):
```bash
pnpm add @react-buoy/env      # Environment inspector
pnpm add @react-buoy/network        # Network monitor
pnpm add @react-buoy/storage        # Storage browser
pnpm add @react-buoy/react-query    # React Query panel
pnpm add @tanstack/react-query    # Required only if you use the React Query panel
```

## Wire It Up (copy + paste)
```tsx
import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppHostProvider, FloatingMenu } from '@react-buoy/core';
import { EnvVarsModal } from '@react-buoy/env';
import { NetworkModal } from '@react-buoy/network';
import { StorageModalWithTabs } from '@react-buoy/storage';
import { ReactQueryDevToolsModal } from '@react-buoy/react-query';
import {
  EnvLaptopIcon,
  WifiCircuitIcon,
  StorageStackIcon,
  ReactQueryIcon,
} from '@react-buoy/shared-ui';

const queryClient = new QueryClient();

const APPS = [
  {
    id: 'env',
    name: 'Environment',
    icon: <EnvLaptopIcon size={16} />,
    component: EnvVarsModal,
    props: {
      requiredEnvVars: [
        { key: 'API_URL', description: 'Backend base URL' },
        { key: 'SENTRY_DSN', description: 'Crash reporting DSN' },
      ],
    },
  },
  {
    id: 'network',
    name: 'Network',
    icon: <WifiCircuitIcon size={16} />,
    component: NetworkModal,
    launchMode: 'host-modal',
    singleton: true,
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: <StorageStackIcon size={16} />,
    component: StorageModalWithTabs,
    singleton: true,
  },
  {
    id: 'query',
    name: 'React Query',
    icon: <ReactQueryIcon size={16} />,
    component: ReactQueryDevToolsModal,
    singleton: true,
  },
];

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppHostProvider>
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text>Tap the bubble to open Dev Tools.</Text>
        </SafeAreaView>

        <FloatingMenu
          apps={APPS}
          environment={{ name: 'QA', color: '#22d3ee' }}
          userRole="internal"
        />
      </AppHostProvider>
    </QueryClientProvider>
  );
}
```

## Release Workflow

- Run `pnpm changeset` for every meaningful change to record the package bump and changelog entry.
- When you are ready to cut versions, run `pnpm run release:version` to apply the collected changesets and refresh lockfiles.
- After verifying the repo (builds, tests, docs), publish with `pnpm run release:publish` to push all pending `@react-buoy/*` packages to npm.
- Prefer the one-shot helper `pnpm run release` locally if you want lint → typecheck → build → version → publish in a single command (it creates the release commit for you).

> Only install the dev tool packages you actually list in `APPS`. Remove entries you do not need.

## Next Steps
- Installation notes – `docs/codex-docs/framework/react-native/installation.md`
- Quick start walkthrough – `docs/codex-docs/framework/react-native/quick-start.md`
- Build your own tool – `docs/codex-docs/guides/building-a-tool.md`

## Try the Example App
```bash
pnpm install
pnpm start
```

## Useful Scripts
- `pnpm build`
- `pnpm typecheck`
- `pnpm lint`

## License
MIT
