# Developer Guide

## Local development with yalc (auto-build + auto-link)

Use yalc to iterate on this library and have changes flow into a consuming app automatically.

### Prerequisites

```sh
npm i -g yalc
```

### In this repo (the library)

One-time publish to your local yalc store:

```sh
npm run yalc:publish
```

Start auto-build + auto-push on file changes:

```sh
npm run dev
```

Notes:

- `npm run dev` watches `src/`, builds the package, then runs `yalc push` on every change.
- You can push manually any time:

```sh
npm run build:yalc
```

### In your consuming app

Add the package from the local yalc store and install dependencies:

```sh
# from your app root
yalc add react-native-react-query-devtools
npm install
```

Run your app normally (React Native CLI, Expo, etc.). Each time the library pushes (from `npm run dev`), your app receives the update. If changes don’t appear, reload the app or restart Metro with a cache reset.

Cleanup when finished to return to the registry version:

```sh
yalc remove react-native-react-query-devtools
npm install
```

Recommended:

- Ensure `.yalc/` is in your app’s `.gitignore`.
- If adding/removing native peer deps in your app during iteration, reinstall iOS pods:

```sh
cd ios && pod install
```

---

## Scripts (library)

```sh
npm run dev           # watch + build + yalc push on change
npm run build         # one-time build to dist
npm run build:yalc    # build and yalc push
npm run type-check    # tsc --noEmit
npm run lint          # eslint
```

## Linking notes (Metro)

If your app needs to watch the linked package explicitly, update `metro.config.js`:

```javascript
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Watch the linked package inside node_modules
const linkedPackage = path.resolve(
  __dirname,
  "node_modules/react-native-react-query-devtools"
);
config.watchFolders = [linkedPackage];

module.exports = config;
```

## Dependency policy (for contributors)

- Place React Native host libraries in `peerDependencies` (e.g., `react`, `react-native`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-safe-area-context`, `react-native-svg`, `@shopify/flash-list`, `@tanstack/react-query`).
- Keep optional integrations as optional peers (declare in `peerDependencies` and mark with `peerDependenciesMeta.optional: true`).
- Use `dependencies` only for pure JS runtime packages that are safe to bundle.

## Troubleshooting

- Metro cache issues: restart with reset:

```sh
# in your app
npx react-native start --reset-cache
```

- iOS pods after native peer changes:

```sh
cd ios && pod install
```

- Duplicate React/React Native errors: ensure only one copy of `react` and `react-native` is resolved in your app. Avoid installing them as dependencies of this library (keep as peers).
