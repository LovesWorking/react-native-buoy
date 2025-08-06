# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the React Native Dev Tools repository.

# React Native Dev Tools Development Rules

You are working on a React Native developer tools package that provides comprehensive debugging capabilities for mobile applications. This is a **mobile-only** library - no web support. Follow these rules strictly.

## Project Overview

This is a multi-tool debugging suite for React Native applications featuring:

- React Query dev tools with cache inspection and management
- Environment variable discovery and validation
- Sentry event monitoring and error tracking
- Storage browsing (AsyncStorage, MMKV, SecureStorage)
- Settings management for dev tool behavior
- All wrapped in a unified floating bubble interface

## Code Quality Requirements (MANDATORY)

**CRITICAL**: All changes must pass these checks before committing:

1. **Always run `npm run type-check`** - Fix all TypeScript errors
2. **Always run `npm run lint`** - Fix all linting issues
3. **Always run `npm run check:jsx`** - Ensure JSX transform is correct
4. **Always run `npm run build`** - Verify build succeeds

## Development Commands

### Build Commands

- `npm run build` - Production build with types
- `npm run build:yalc` - Build and push to yalc for local testing
- `npm run dev` - Watch mode with auto-rebuild and yalc push

### Code Quality

- `npm run type-check` - Check TypeScript types
- `npm run type-check:watch` - TypeScript checking in watch mode
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run check:jsx` - Check JSX transform (React 17+)
- `npm run fix:jsx` - Fix JSX transform issues
- `npm run check` - Run type-check and lint together
- `npm run check:fix` - Run type-check and lint:fix

### Local Development (Yalc)

- `npm run yalc:publish` - Publish to local yalc store
- `npm run yalc:push` - Push updates to linked projects

### TODO: Testing Commands

- Tests not yet implemented
- Will use Jest and React Native Testing Library when added

## Repository Architecture

### Core Components (`src/_components/`)

- `floating-bubble/` - Main floating dev tools bubble
  - `bubble/` - Bubble UI and drag functionality
  - `console/` - Dev tools console and section management
  - `modal/` - Resizable modal system

### Feature Sections (`src/_sections/`)

- `react-query/` - React Query dev tools
  - Query/mutation browser
  - Cache management
  - Network toggle
  - Data editor
- `sentry/` - Sentry event monitoring
  - Event log viewer
  - Error details and insights
  - Performance monitoring
- `env/` - Environment variable tools
  - Auto-discovery of EXPO*PUBLIC*\* vars
  - Validation and type checking
- `storage/` - Storage browser
  - AsyncStorage, MMKV, SecureStorage support
  - Required key validation
  - Clear all functionality
- `settings/` - Dev tools settings
  - Bubble visibility controls
  - Persistence options

### Shared Utilities (`src/_shared/`)

- `logger/` - Console transport and logging
- `clipboard/` - Cross-platform clipboard utilities
- `storage/` - Dev tools internal storage
- `ui/` - Reusable UI components
- `utils/` - Common utilities

## Mobile Platform Considerations

### React Native Specific

- **Mobile-only** - No web platform support
- Supports React Native 0.78.0+
- Requires react-native-reanimated for animations
- Uses react-native-gesture-handler for gestures
- Safe area context for notch/island handling

### Platform Requirements

```json
{
  "react": "^18 || ^19",
  "react-native": ">=0.78.0",
  "react-native-reanimated": "^3.6.0 || ^4.0.0",
  "react-native-gesture-handler": "^2.20.0",
  "@tanstack/react-query": "^5.77.2"
}
```

### iOS Considerations

- Requires pod install after package changes
- Supports iOS 13.0+
- Uses native clipboard APIs via expo-clipboard or @react-native-clipboard/clipboard

### Android Considerations

- Minimum SDK 21 (Android 5.0)
- Requires gradle clean for native changes
- AsyncStorage for persistence

## Development Guidelines

### Component Patterns

- Use functional components with hooks
- Implement proper TypeScript types
- Add `sentry-label` props with "ignore" prefix for internal UI
- Follow existing component structure patterns

### State Management

- React Query for server state
- Local React state for UI state
- AsyncStorage for persistence
- No Redux or MobX

### Styling

- StyleSheet.create for all styles
- No inline styles (ESLint disabled but avoid)
- Dark theme optimized (black/gray backgrounds)
- Use existing color patterns

### Performance

- Memoize expensive computations
- Use React.memo for heavy components
- Virtualized lists for large data sets
- Debounce rapid state updates

### Sentry Integration

- Custom ESLint rule for sentry-label props
- All touchable elements need sentry-label="ignore ..."
- Prevents dev tool interactions from being tracked

## Common Workflows

### Adding a New Section

1. Create folder in `src/_sections/your-section/`
2. Add components, hooks, utils subdirectories
3. Export from section index.ts
4. Add to DevToolsSectionListModal sections array
5. Add routing in DevToolsModalRouter
6. Update SectionType union type

### Modifying Storage Keys

1. Update types in `src/_sections/storage/types.ts`
2. Add validation logic in StorageBrowserMode
3. Update storage utilities if needed
4. Test with all storage types (Async, MMKV, Secure)

### Updating Sentry Event Parsing

1. Edit `src/_sections/sentry/utils/eventParsers.ts`
2. Add new event type extractors
3. Update formatEventMessage for display
4. Test with real Sentry events

### Adding Environment Variable Support

1. Update getEnvValue utility for new sources
2. Add type detection in envTypeDetector
3. Update validation helpers
4. Test on both iOS and Android

## Code Style Rules

### TypeScript

- Strict mode enabled
- Avoid `any` types (warnings allowed during dev)
- Use type imports: `import type { ... }`
- Export types from index files

### React

- React 17+ JSX transform (no React import needed)
- Hooks rules enforced
- Proper dependency arrays
- No class components

### Imports

- Check if library exists before importing
- Use existing utilities and patterns
- No new dependencies without discussion
- Prefer built-in React Native APIs

## TODO: Not Yet Implemented

### Testing

- [ ] Jest configuration
- [ ] React Native Testing Library setup
- [ ] Component unit tests
- [ ] Hook testing utilities
- [ ] Integration tests

### Documentation

- [ ] API documentation
- [ ] Component storybook
- [ ] Video tutorials
- [ ] Migration guides

### CI/CD

- [ ] GitHub Actions workflow
- [ ] Automated testing
- [ ] NPM publishing automation
- [ ] Version bumping scripts

### Additional Features

- [ ] Performance profiling section
- [ ] Network request interceptor
- [ ] Redux DevTools integration (if needed)
- [ ] Custom user-defined sections API

## Important Notes

- **Mobile-only library** - No web support, remove any web-specific code
- **Production usage** - This tool is used in production apps, maintain stability
- **Backwards compatibility** - Support React Native 0.78.0+
- **Performance critical** - Dev tools should not impact app performance
- **Dark theme only** - Optimized for dark backgrounds (#171717, #1F1F1F)

## Quick Command Reference

```bash
# Development
npm run dev                # Watch mode with yalc
npm run build             # Production build

# Code Quality
npm run check             # Type-check + lint
npm run check:fix         # Type-check + lint:fix

# Local Testing
npm run build:yalc        # Build and push to yalc
yalc add react-native-react-query-devtools  # In your app

# Before Commit
npm run type-check && npm run lint && npm run build
```
