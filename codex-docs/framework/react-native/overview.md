---
id: overview
title: Overview
---

Our floating developer menu turns any React Native app into a launchpad for diagnostics, QA, and feature toggles. It layers a persistent bubble over the UI, lets teams open modular tools on demand, and keeps every overlay consistent via a shared App Host runtime.

## Motivation

Shipping mobile apps with confidence means answering questions fast: Are env variables loaded? Which requests are failing? Can support reproduce a bug on-device? Typical answers involve ad-hoc debug screens that drift apart. The floating menu unifies that story by:

- Mounting a reusable host that owns tool lifecycle, modals, and persistence
- Providing a configurable dial and row so teams decide which tools surface first
- Remembering open apps across reloads to preserve developer workflow
- Offering opinionated defaults (network inspector, env audit, storage browser) while staying pluggable

## Core Concepts

- **App Host** – A provider that tracks open tools, enforces singleton behavior, persists state, and exposes typed `open/close` helpers.
- **Floating Menu Shell** – Renders the draggable bubble, dial launcher, environment badge, and tool icons with position persistence.
- **Installed Apps** – Declarative objects describing each tool (id, icon, launch mode, component, props).
- **Settings Modal** – Lets engineers toggle dial slots, hide floating buttons, and store preferences per device.
- **Integrations** – Bundled tools (Env Inspector, Network Monitor, Storage Browser, React Query Panel) you can ship or replace.

## Show Me the Menu

[//]: # 'Example'
```tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppHostProvider, FloatingMenu } from '@monorepo/devtools-floating-menu';
import { EnvVarsModal } from '@monorepo/env-tools';
import { NetworkModal } from '@monorepo/network';
import { StorageModalWithTabs } from '@monorepo/storage';
import { EnvironmentIndicator, WifiCircuitIcon, StorageStackIcon } from '@monorepo/shared';

const queryClient = new QueryClient();

const INSTALLED_APPS = [
  {
    id: 'env',
    name: 'Environment',
    icon: ({ size }) => <EnvironmentIndicator environment={{ name: 'Dev' }} size={size} />, // row slot icon
    component: EnvVarsModal,
    props: { requiredEnvKeys: ['API_URL', 'SUPABASE_URL'] },
  },
  {
    id: 'network',
    name: 'Network',
    icon: <WifiCircuitIcon size={16} />, // simple React node works too
    component: NetworkModal,
    launchMode: 'host-modal',
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: <StorageStackIcon size={16} />,
    component: StorageModalWithTabs,
  },
];

export function DevtoolsRoot({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppHostProvider>
        {children}
        <FloatingMenu
          apps={INSTALLED_APPS}
          environment={{ name: 'Staging', color: '#8B5CF6' }}
          userRole="internal"
        />
      </AppHostProvider>
    </QueryClientProvider>
  );
}
```
[//]: # 'Example'

## Where to Go Next

- Set up the host and menu for your project in the [Quick Start](./quick-start.md)
- Wire in the bundled tools using their dedicated guides (see [Plugins](../plugins/environment-inspector.md))
- Dive into the App Host lifecycle in the [App Host guide](../guides/app-host.md)

The remaining docs follow the same structure: concise, example-driven, and always linking you to the next step.
