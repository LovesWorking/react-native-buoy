# Local Development with Yalc

Quick setup guide for developing this package locally with instant updates to consuming apps.

## One-Time Setup

### 1. Install Yalc globally

```bash
npm install -g yalc
```

### 2. Publish this package to Yalc store

```bash
npm run build
yalc publish
```

### 3. Link in your consumer app

```bash
# In your React Native app directory
yalc add react-native-react-query-devtools
npm install
```

## Development Workflow

### Start Development Mode

```bash
# In this devtools package directory
npm run dev
```

This will:

- ✅ Watch for file changes in `src/`
- ✅ Auto-rebuild on save
- ✅ Auto-push to linked apps
- ✅ Instant updates in your consumer app

### Stop Development

- Press `Ctrl+C` to stop the watcher

## Manual Commands

```bash
# Build and push once
npm run build:yalc

# Push without rebuilding
npm run yalc:push

# Re-publish to store
npm run yalc:publish
```

## Clean Up

### Remove from consumer app

```bash
# In your React Native app
yalc remove react-native-react-query-devtools
npm install react-native-react-query-devtools
```

## That's It! 🎉

Make changes → Save → See instant updates in your app!
