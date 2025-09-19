---
id: installation
title: Installation
---

Follow these steps to add the floating dev menu to a fresh or existing React Native workspace. The repo ships as a pnpm-based monorepo; adapt the steps if you consume packages individually.

## Prerequisites

- React Native 0.81+ or Expo SDK 54+
- TypeScript 5.8
- pnpm 10 or yarn/npm with workspace support
- Metro configured to resolve workspace packages (see `metro.config.js` in the monorepo example)

## Install Packages

1. Add the devtool packages to your app shell:

```bash
pnpm add @monorepo/devtools-floating-menu @monorepo/env-tools @monorepo/network @monorepo/storage @tanstack/react-query
```

2. If you do not already depend on the shared design system, fetch it as well:

```bash
pnpm add @monorepo/shared
```

3. Ensure each package is linked in your metro resolver. In an Expo app, extend the `watchFolders` array:

[//]: # 'Example'
```ts
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

module.exports = config;
```
[//]: # 'Example'

## Configure Fonts & Icons (Optional)

The shared package exposes icon components and typography tokens. Importing them works out of the box; if you rely on custom fonts ensure Expo or React Native CLI loads them during app bootstrap.

## Wrap the App

Integrate the host provider and menu near the root of your component tree.

[//]: # 'Example'
```tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppHostProvider, FloatingMenu } from '@monorepo/devtools-floating-menu';

const queryClient = new QueryClient();

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppHostProvider>
        {children}
        <FloatingMenu apps={[]} />
      </AppHostProvider>
    </QueryClientProvider>
  );
}
```
[//]: # 'Example'

Later docs will populate the `apps` array.

## Verify the Build

Run the Metro bundler, ensure the floating bubble renders without tools configured, and confirm no missing dependency warnings.

```bash
pnpm start
```

Proceed to the [Quick Start](./quick-start.md) to install sample tools and test the workflow end to end.
