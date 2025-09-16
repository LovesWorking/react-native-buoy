# React Native Monorepo

A production-ready React Native monorepo with automated package creation, hot reload, and a shared component library.

## 🚀 Features

- **Automated Package Creation** - Create new packages with one command
- **Shared Component Library** - Common UI, hooks, and utilities
- **Hot Reload** - Changes reflect instantly without rebuilding
- **TypeScript** - Full type safety across all packages
- **pnpm Workspaces** - Efficient dependency management
- **React Native Builder Bob** - Professional package building
- **Lerna-lite** - Streamlined package orchestration

## 📁 Structure

```
├── packages/              # All packages
│   ├── shared/           # Shared UI, hooks, utilities
│   ├── package-1/        # Counter demo package
│   ├── package-2/        # Toggle demo package
│   ├── ui-kit/           # UI library example
│   └── [your-packages]/  # Your custom packages
├── example/              # Expo test app
├── scripts/              # Automation scripts
│   └── create-package.js # Package creation script
├── docs/                 # Documentation
│   ├── CREATE_PACKAGE_GUIDE.md
│   ├── MONOREPO_COMPLETE_GUIDE.md
│   └── SHARED_PACKAGE_PLAN.md
├── pnpm-workspace.yaml
├── lerna.json
└── package.json
```

## 🏁 Quick Start

1. Install dependencies:
```bash
pnpm install
```

2. Build all packages:
```bash
pnpm build
```

3. Start the example app:
```bash
pnpm start
```

## ✨ Create New Packages

Use the automated package creation script:

```bash
# Standard React Native package
pnpm create:package my-feature

# UI component library
pnpm create:package design-system ui

# Custom hooks package
pnpm create:package auth-hooks hook

# Utility functions package
pnpm create:package validators util
```

Each package is automatically configured with:
- TypeScript setup
- Bob build configuration
- Shared package dependency
- Hot reload support
- Proper exports and documentation

[📖 Full Package Creation Guide →](./CREATE_PACKAGE_GUIDE.md)

## 🔥 Hot Reload

Hot reload works automatically! Edit any file in any package and see changes instantly:

1. Edit source files (e.g., `packages/shared/src/ui/Button.tsx`)
2. Metro detects changes via source watching
3. App updates immediately - no rebuild needed!

This works because Metro watches the "source" field in package.json exports.

## 📦 Shared Package

The `@monorepo/shared` package provides:

### UI Components
- `Button` - Customizable button with variants (primary, secondary, danger)
- `Card` - Container with padding and shadow

### Hooks
- `useCounter` - Counter state with increment/decrement/reset
- `useToggle` - Boolean state with toggle functions

### Utilities
- `formatNumber` - Number formatting with commas
- `formatCurrency` - Currency formatting
- `debounce` - Debounce function
- `throttle` - Throttle function

```typescript
import { Button, Card, useCounter, formatNumber } from '@monorepo/shared';
```

## 📜 Available Scripts

### Root Commands
| Command | Description |
|---------|-------------|
| `pnpm create:package <name> [type]` | Create a new package |
| `pnpm build` | Build all packages |
| `pnpm fresh` | Clean install and build |
| `pnpm clean` | Remove all build artifacts |
| `pnpm start` | Start the example app |
| `pnpm ios` | Run on iOS simulator |
| `pnpm android` | Run on Android emulator |
| `pnpm typecheck` | Type check all packages |
| `pnpm lint` | Lint all packages |
| `pnpm test` | Run full test suite |

### Package-Specific Commands
```bash
# Build specific package
pnpm --filter @monorepo/package-name build

# Add dependency to package
pnpm --filter @monorepo/package-name add axios

# Clean specific package
pnpm --filter @monorepo/package-name clean
```

## 📚 Documentation

- [**Complete Monorepo Guide**](./MONOREPO_COMPLETE_GUIDE.md) - Full reference and architecture
- [**Package Creation Guide**](./CREATE_PACKAGE_GUIDE.md) - Detailed package creation instructions
- [**Shared Package Plan**](./SHARED_PACKAGE_PLAN.md) - Shared package architecture

## 🚨 Troubleshooting

### Module Not Found
```bash
pnpm install
pnpm --filter @monorepo/package-name build
```

### TypeScript Errors
```bash
pnpm typecheck
pnpm build
```

### Hot Reload Not Working
```bash
pnpm start --reset-cache
```

### Build Failures
```bash
pnpm fresh
```

## 🎯 Example Packages

### package-1 (Counter Demo)
- Uses `Button`, `Card` from shared
- Implements `useCounter` hook
- Demonstrates number formatting

### package-2 (Toggle Demo)
- Uses `Card`, `Button` from shared
- Implements `useToggle` hook
- Demonstrates debounce utility

### ui-kit (Component Library)
- Custom UI components
- Re-exports shared components
- TypeScript interfaces

## 🛠️ Technology Stack

- **React Native 0.81** - Mobile framework
- **Expo SDK 54** - Development platform
- **TypeScript 5.8** - Type safety
- **pnpm 10.10** - Package manager
- **React Native Builder Bob** - Package builder
- **Lerna-lite 4.7** - Monorepo tools
- **React 19** - UI library

## 🤝 Contributing

1. Create new package: `pnpm create:package <name>`
2. Implement your feature
3. Test in example app
4. Build: `pnpm build`
5. Type check: `pnpm typecheck`
6. Submit PR

## 📄 License

MIT

---

Built with ❤️ for the React Native community