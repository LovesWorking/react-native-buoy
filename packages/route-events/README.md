# @react-buoy/route-events

## Description

route-events package for the monorepo.

## Installation

This package is part of the monorepo and is automatically available to other packages and the example app.

## Usage

```typescript
import { RouteEventsComponent } from '@react-buoy/route-events';

// Use in your component
<RouteEventsComponent title="Hello World" />
```

## Development

### Building

```bash
pnpm build
```

### Type Checking

```bash
pnpm typecheck
```

### Clean Build

```bash
pnpm clean
```

## Structure

```
route-events/
├── src/
│   └── index.ts        # Main export file
├── lib/                # Built output (git ignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- Uses `@react-buoy/shared-ui` for common components and utilities
- React and React Native as peer dependencies
