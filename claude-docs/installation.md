---
id: installation
title: Installation
---

You can integrate DevTools Floating Menu into your React Native project either by using individual packages or by adopting the full monorepo structure for maximum development velocity.

## Package Installation

### NPM

```bash
npm i @monorepo/devtools-floating-menu @monorepo/env-tools
```

### PNPM

```bash
pnpm add @monorepo/devtools-floating-menu @monorepo/env-tools
```

### Yarn

```bash
yarn add @monorepo/devtools-floating-menu @monorepo/env-tools
```

### Bun

```bash
bun add @monorepo/devtools-floating-menu @monorepo/env-tools
```

DevTools Floating Menu is compatible with React Native 0.72+ and works with both Expo SDK 50+ and bare React Native projects.

> Note: For Expo projects, you'll need to prebuild if using native tools: `expo prebuild`

## Monorepo Setup

For the full development experience with hot reload and package creation tools:

### Clone the Monorepo

```bash
git clone https://github.com/your-org/rn-monorepo-clean.git
cd rn-monorepo-clean
```

### Install Dependencies

```bash
pnpm install
```

### Build Packages

```bash
pnpm build
```

### Start Development

```bash
# iOS
pnpm ios

# Android
pnpm android

# Or just start Metro
pnpm start
```

## Integrating into Existing Projects

### Step 1: Install Core Packages

```bash
pnpm add @monorepo/devtools-floating-menu @monorepo/shared
```

### Step 2: Wrap Your App

```tsx
// App.tsx
import { AppHostProvider } from '@monorepo/devtools-floating-menu'

export default function App() {
  return (
    <AppHostProvider>
      {/* Your existing app */}
    </AppHostProvider>
  )
}
```

### Step 3: Add the Floating Menu

```tsx
// App.tsx
import { FloatingMenu, AppOverlay } from '@monorepo/devtools-floating-menu'

export default function App() {
  return (
    <AppHostProvider>
      {/* Your existing app */}
      {__DEV__ && (
        <>
          <FloatingMenu />
          <AppOverlay />
        </>
      )}
    </AppHostProvider>
  )
}
```

## Requirements

### Runtime Requirements

- React Native 0.72 or higher
- React 18.0 or higher
- TypeScript 5.0 or higher (for TypeScript projects)

### Development Requirements

- Node.js 18 or higher
- pnpm 8.0 or higher (for monorepo)
- Xcode 14+ (for iOS development)
- Android Studio 2022.3+ (for Android development)

### Platform Support

```
iOS >= 13.0
Android >= 6.0 (API 23)
Expo SDK >= 50
React Native Web (experimental)
```

## Recommendations

### ESLint Configuration

Add the DevTools ESLint plugin for better development experience:

```bash
pnpm add -D @monorepo/eslint-plugin-devtools
```

```js
// .eslintrc.js
module.exports = {
  plugins: ['@monorepo/devtools'],
  rules: {
    '@monorepo/devtools/no-devtools-in-production': 'error',
  },
}
```

### TypeScript Configuration

For the best TypeScript experience:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@monorepo/*": ["./packages/*/src"]
    }
  }
}
```

### Metro Configuration

Enable source watching for hot reload:

```js
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const config = getDefaultConfig(__dirname)

// Watch all packages
config.watchFolders = [
  path.resolve(__dirname, 'packages'),
]

// Ensure source files are watched
config.resolver.sourceExts = ['tsx', 'ts', 'jsx', 'js', 'json']

module.exports = config
```

## Verification

After installation, verify everything is working:

```bash
# Check package builds
pnpm build

# Run type checking
pnpm typecheck

# Start the example app
pnpm start
```

You should see the floating menu button in the bottom-right corner of your app when running in development mode.

## Next Steps

- Continue to [Quick Start](./quick-start.md) to learn the core concepts
- Explore [Built-in Tools](./guides/built-in-tools.md)
- Learn about [Creating Custom Tools](./guides/creating-tools.md)