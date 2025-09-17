# @monorepo/react-query

## Description

react-query package for the monorepo.

## Installation

This package is part of the monorepo and is automatically available to other packages and the example app.

## Usage

```typescript
import { ReactQueryComponent } from '@monorepo/react-query';

// Use in your component
<ReactQueryComponent title="Hello World" />
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
react-query/
├── src/
│   └── index.ts        # Main export file
├── lib/                # Built output (git ignored)
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- Uses `@monorepo/shared` for common components and utilities
- React and React Native as peer dependencies
