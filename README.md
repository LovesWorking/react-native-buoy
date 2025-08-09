# React Native React Query DevTools

React Query Dev Tools for React Native applications with additional debugging utilities.

## Installation

### Prerequisites

Make sure your React Native app has the Reanimated babel plugin configured in `babel.config.js`:

```javascript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin' // Must be listed last
  ]
};
```

### Step 1: Build and link this package

```bash
# In this package directory
npm install
npm run build
npm link
```

### Step 2: Link to your app

```bash
# In your app directory
npm install react-native-react-query-devtools --save
npm link react-native-react-query-devtools
```

If the first command fails (package not published), add to package.json manually:

```json
{
  "dependencies": {
    "react-native-react-query-devtools": "*"
  }
}
```

### Step 3: Configure Metro (in your app)

Create or update `metro.config.js`:

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Watch the linked package
const linkedPackage = path.resolve(
  __dirname,
  "node_modules/react-native-react-query-devtools"
);
config.watchFolders = [linkedPackage];

module.exports = config;
```

## Development

```bash
# Watch mode (rebuilds on file changes ~100ms)
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Linting
npm run lint
```

## For Developers: Local development with yalc (auto-build + auto-link)

Use yalc to iterate on this package and have changes propagate to a consuming app automatically.

### Prerequisites

```sh
npm i -g yalc
```

### In this repo (the library)

First time only, publish the package to your local yalc store:

```sh
# one-time publish to yalc store
npm run yalc:publish
```

Then start auto-build + auto-push on file changes:

```sh
# watches src/, builds, and runs `yalc push` on every change
npm run dev
```

Notes:

- `npm run dev` uses nodemon to trigger `npm run build:yalc` which runs `npm run build && yalc push`.
- You can also manually push updates at any time with:

```sh
npm run build:yalc
```

### In your consuming app

Add this package from the local yalc store and install:

```sh
# from your app's root
yalc add react-native-react-query-devtools
npm install
```

Run your app as usual (Metro/CLI/Expo). Each time the library pushes (via `npm run dev`), your app will receive the updated build. If you don’t see changes, reload the app or restart Metro with a cache reset.

When finished, remove the yalc link and return to registry/npm version:

```sh
yalc remove react-native-react-query-devtools
npm install
```

Recommended:

- Ensure `.yalc/` is listed in your app’s `.gitignore`.
- If you add a new native peer dependency in your app while iterating, run iOS pods:

```sh
cd ios && pod install
```

## Usage

```tsx
import { RnBetterDevToolsBubble } from "react-native-react-query-devtools";

function App() {
  return (
    <>
      {/* Your app content */}
      <RnBetterDevToolsBubble />
    </>
  );
}
```

## Features

- **React Query Dev Tools**: Query/mutation inspection, cache management
- **Environment Variables**: Auto-discovery and validation
- **Sentry Integration**: Error and event monitoring
- **Storage Browser**: AsyncStorage, MMKV, SecureStorage inspection
- **Settings Management**: Persistent dev tools configuration

## How It Works

This package uses:

- **tsup** for fast TypeScript builds (~100ms rebuilds)
- **npm link** for local development
- React Native imports TypeScript source directly via `"react-native": "./src/index.ts"`

Changes are reflected instantly in your app when running `npm run dev`.
