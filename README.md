# React Native React Query DevTools

React Query Dev Tools for React Native applications with additional debugging utilities.

## Installation

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
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch the linked package
const linkedPackage = path.resolve(__dirname, 'node_modules/react-native-react-query-devtools');
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