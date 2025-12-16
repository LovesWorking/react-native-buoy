---
title: Installation
id: installation
---

Complete installation guide for React Buoy and its tool packages.

## Requirements

- React Native 0.70+
- React 18+

## Core Package

The core package provides the `FloatingDevTools` component:

```bash
npm install @react-buoy/core
```

## Available Tool Packages

Install any of these packages to add tools to your floating menu:

### Environment Inspector

```bash
npm install @react-buoy/env
```

View and validate environment variables.

### Network Monitor

```bash
npm install @react-buoy/network
```

Monitor API requests and responses.

### Storage Explorer

```bash
npm install @react-buoy/storage
```

Browse AsyncStorage or MMKV data.

### React Query DevTools

```bash
npm install @react-buoy/react-query
```

TanStack Query debugging tools.

## All-in-One Installation

Install all packages at once:

```bash
npm install @react-buoy/core @react-buoy/env @react-buoy/network @react-buoy/storage
```

## TypeScript Support

All packages include TypeScript definitions. No additional `@types` packages needed.

## Next Steps

- [Quick Start](./quick-start) - Basic setup guide
- [FloatingDevTools](./floating-devtools) - Configuration options
