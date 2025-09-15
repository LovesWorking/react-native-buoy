# React Native Monorepo Clean

A clean monorepo setup for React Native/Expo using pnpm workspaces, Lerna, and React Native Builder Bob.

## Structure

```
├── packages/          # All shared packages
│   ├── package-1/    # Example package 1
│   └── package-2/    # Example package 2
├── example/          # Expo app that uses the packages
├── pnpm-workspace.yaml
├── lerna.json
└── package.json
```

## Setup

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
# or
pnpm dev
```

## Testing Hot Reload

1. Start the app with `pnpm start`
2. Open the app in Expo Go
3. Edit any package source file (e.g., `packages/package-2/src/index.tsx`)
4. Rebuild that package:
   ```bash
   cd packages/package-2 && pnpm build
   ```
5. Refresh the app to see changes

## Available Scripts

### Root Level
- `pnpm build` - Build all packages
- `pnpm watch` - Build all packages in watch mode
- `pnpm clean` - Clean all build outputs
- `pnpm start` - Start the example app
- `pnpm ios` - Run example on iOS
- `pnpm android` - Run example on Android

### Per Package
- `pnpm build` - Build the package
- `pnpm clean` - Clean build output

## Adding New Packages

1. Create directory in `packages/`
2. Add package.json with Bob configuration
3. Add source files in `src/`
4. Run `pnpm install` at root
5. Import in example app using `@monorepo/your-package`

## Key Features

✅ **Workspace Protocol** - Packages linked via `workspace:*`
✅ **Automatic Builds** - Bob builds on install
✅ **Hot Reload** - Changes reflect after rebuild
✅ **Lerna Publishing** - Ready for npm publishing
✅ **TypeScript Support** - Full TS support (currently disabled due to React 19 types issue)

## Troubleshooting

### TypeScript Errors
If you see TypeScript errors with React types, you can:
1. Skip TypeScript builds (as configured)
2. Or downgrade React types to match React Native's version

### Metro Issues
The example uses Expo SDK 54 which includes Metro. No need to install separately.

### Package Not Found
After adding a new package:
1. Run `pnpm install` at root
2. Make sure package is built (`pnpm build`)
3. Restart Metro bundler

## Based On

This setup follows patterns from:
- [React Native Builder Bob](https://github.com/callstack/react-native-builder-bob)
- pnpm workspaces
- Lerna for monorepo management