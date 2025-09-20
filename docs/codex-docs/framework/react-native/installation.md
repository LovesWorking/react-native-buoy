---
id: installation
title: Installation
---

Install the floating menu once, then add only the dev tools you care about.

## Requirements
- React Native 0.81+ or Expo SDK 54+
- TypeScript 5.8+
- pnpm 10+ (or yarn/npm workspaces)
- Metro config that watches workspace packages (see example below)

## 1. Base packages (always install)
```bash
pnpm add @monorepo/devtools-floating-menu @monorepo/shared
```

## 2. Optional dev tools
Install the packages for the tools you plan to expose:
```bash
pnpm add @monorepo/env-tools      # Environment inspector
pnpm add @monorepo/network        # Network monitor
pnpm add @monorepo/storage        # Storage browser
pnpm add @monorepo/react-query    # React Query panel
pnpm add @tanstack/react-query    # Only if you use the React Query panel
```
Skip anything you do not need—the floating menu works fine without them.

## 3. Point Metro at the workspace (Expo example)
```ts
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '..');

const config = getDefaultConfig(projectRoot);
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, 'node_modules'),
  path.join(workspaceRoot, 'node_modules'),
];

module.exports = config;
```

## 4. Wrap your providers once
```tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppHostProvider } from '@monorepo/devtools-floating-menu';

const queryClient = new QueryClient();

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppHostProvider>{children}</AppHostProvider>
    </QueryClientProvider>
  );
}
```
If you are not using the React Query panel, you can drop `QueryClientProvider` and the TanStack dependency.

## 5. Verify the bubble
```bash
pnpm start
```
Launch your app, confirm the draggable bubble appears, and move on to the [Quick Start](./quick-start.md) to register tools.
