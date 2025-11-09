# @react-buoy/route-events

A comprehensive route tracking and visualization toolkit for Expo Router applications. Monitor route changes, inspect navigation state, explore your route sitemap, and visualize the navigation stack.

## Features

- **Route Event Tracking**: Automatically track all route changes with detailed event information
- **Route Sitemap**: Browse all available routes in your app with search and navigation
- **Navigation Stack Viewer**: Inspect the current navigation stack in real-time
- **Event Timeline**: View a chronological timeline of all route changes
- **Filtering & Search**: Filter events by pathname patterns and search through routes
- **Persistent State**: Remembers your monitoring preferences and filters
- **Full Modal UI**: Beautiful, production-ready modal interface for all features

## Installation

This package is part of the React Buoy monorepo and is automatically available to other packages and the example app.

For external projects:

```bash
npm install @react-buoy/route-events
# or
pnpm add @react-buoy/route-events
# or
yarn add @react-buoy/route-events
```

## Quick Start

### Simplest Setup - Just 1 Line!

**Import the preset and add it to your tools array. Done!**

```typescript
import { routeEventsToolPreset } from '@react-buoy/route-events';
import { FloatingDevTools } from '@react-buoy/core';

const installedApps = [
  routeEventsToolPreset, // That's it! One line.
  // ...your other tools
];

function App() {
  return (
    <FloatingDevTools
      apps={installedApps}
      environment="local"
      userRole="admin"
    />
  );
}
```

**Done!** The preset automatically:
- ✅ Starts tracking routes when opened
- ✅ Uses the built-in route observer singleton
- ✅ Provides all three tabs (Routes, Events, Stack)
- ✅ No configuration, no props, no hooks to call

## Requirements

`@react-buoy/route-events` relies on the same core libraries as Expo Router itself:

- `expo-router` ≥ 2.0.0 (the Routes tab reads `store.routeNode` directly)
- `@react-navigation/native` ≥ 7.x (Stack tab + Expo Router routing hooks)
- `@react-native-async-storage/async-storage` (state persistence)
- `react` / `react-native`

These packages are declared as `peerDependencies`, so your app decides the exact versions. When a dependency is missing or not initialized, the devtool logs a clear `[RouteEvents] ...` console message (in dev builds) and gracefully disables the affected feature instead of crashing. See `packages/route-events/docs/ROUTES_SITEMAP_ACCESS_GUIDE.md` for the full data-flow and troubleshooting guide.

### Alternative: Manual Setup

If you're not using FloatingDevTools or want more control:

```typescript
import { RouteEventsModalWithTabs } from '@react-buoy/route-events';

function App() {
  const [showRoutes, setShowRoutes] = useState(false);

  return (
    <>
      <Button onPress={() => setShowRoutes(true)}>
        Open Route Inspector
      </Button>

      <RouteEventsModalWithTabs
        visible={showRoutes}
        onClose={() => setShowRoutes(false)}
      />
    </>
  );
}
```

## API Reference

### Core Components

#### `RouteEventsModalWithTabs`

The main modal interface with three tabs: Routes, Events, and Stack.

**Props:**

```typescript
interface RouteEventsModalWithTabsProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback when modal is closed */
  onClose: () => void;
  /** Optional back button handler */
  onBack?: () => void;
  /** Whether to use shared modal dimensions */
  enableSharedModalDimensions?: boolean;
  /** 
   * Optional route observer instance. 
   * If not provided, uses the default singleton (recommended).
   * Route tracking starts automatically when the modal is opened.
   */
  routeObserver?: RouteObserver;
}
```

**Example:**

```typescript
<RouteEventsModalWithTabs
  visible={isVisible}
  onClose={handleClose}
/>
```

**Advanced Example (with custom observer):**

Only needed if you want to use a custom route observer instance:

```typescript
import { RouteEventsModalWithTabs, routeObserver } from '@react-buoy/route-events';

<RouteEventsModalWithTabs
  visible={isVisible}
  onClose={handleClose}
  routeObserver={routeObserver} // Optional - uses default if not provided
/>
```

#### `RoutesSitemap`

Standalone component for browsing all routes in your application.

**Props:**

```typescript
interface RoutesSitemapProps {
  style?: StyleProp<ViewStyle>;
}
```

**Example:**

```typescript
import { RoutesSitemap } from '@react-buoy/route-events';

function RoutesScreen() {
  return <RoutesSitemap />;
}
```

#### `NavigationStack`

Standalone component for visualizing the current navigation stack.

**Props:**

```typescript
interface NavigationStackProps {
  style?: StyleProp<ViewStyle>;
}
```

**Example:**

```typescript
import { NavigationStack } from '@react-buoy/route-events';

function DebugScreen() {
  return <NavigationStack />;
}
```

### Hooks

#### `useRouteObserver`

Hook to track route changes and emit events to the global observer.

**Note:** You typically don't need to use this hook directly - the `RouteEventsModalWithTabs` component starts tracking automatically. This hook is only needed for advanced use cases like custom analytics.

**Signature:**

```typescript
function useRouteObserver(
  callback?: (event: RouteChangeEvent) => void
): void
```

**Examples:**

```typescript
// Only needed for custom analytics - modal handles tracking automatically!
import { useRouteObserver } from '@react-buoy/route-events';

export default function RootLayout() {
  useRouteObserver((event) => {
    analytics.trackPageView(event.pathname);
  });

  return <Stack />;
}
```

#### `useRouteSitemap`

Access route information from your app's file-based routing structure.

**Signature:**

```typescript
function useRouteSitemap(
  options?: UseRouteSitemapOptions
): UseRouteSitemapResult
```

**Options:**

```typescript
interface UseRouteSitemapOptions {
  /** Whether to include layout routes */
  includeLayouts?: boolean;
  /** Whether to include route groups */
  includeGroups?: boolean;
}
```

**Result:**

```typescript
interface UseRouteSitemapResult {
  /** All routes in the application */
  routes: RouteInfo[];
  /** Routes grouped by directory */
  groups: RouteGroup[];
  /** Statistics about the routes */
  stats: RouteStats;
  /** Get a specific route by path */
  getRoute: (path: string) => RouteInfo | undefined;
  /** Get all parent routes of a path */
  getParents: (path: string) => RouteInfo[];
}
```

**Example:**

```typescript
import { useRouteSitemap } from '@react-buoy/route-events';

function RouteDebugger() {
  const { routes, stats, getRoute } = useRouteSitemap();

  console.log(`Total routes: ${stats.total}`);
  console.log(`Dynamic routes: ${stats.byType.dynamic}`);
  
  const homeRoute = getRoute('/');
  // { path: '/', type: 'index', ... }

  return (
    <View>
      {routes.map(route => (
        <Text key={route.path}>{route.path}</Text>
      ))}
    </View>
  );
}
```

#### `useNavigationStack`

Access and control the current navigation stack.

**Signature:**

```typescript
function useNavigationStack(): UseNavigationStackResult
```

**Result:**

```typescript
interface UseNavigationStackResult {
  /** The current navigation stack */
  stack: StackDisplayItem[];
  /** Whether the data is loading */
  loading: boolean;
  /** Navigate to a specific stack index */
  navigateToIndex: (index: number) => void;
  /** Pop back to a specific index */
  popToIndex: (index: number) => void;
  /** Go back one screen */
  goBack: () => void;
  /** Go to the root of the stack */
  popToTop: () => void;
}
```

**Example:**

```typescript
import { useNavigationStack } from '@react-buoy/route-events';

function NavigationDebugger() {
  const { stack, goBack, popToTop } = useNavigationStack();

  return (
    <View>
      <Text>Stack Depth: {stack.length}</Text>
      <Button onPress={goBack}>Go Back</Button>
      <Button onPress={popToTop}>Go to Root</Button>
      
      {stack.map((item, index) => (
        <Text key={item.key}>
          {index}: {item.displayPath}
        </Text>
      ))}
    </View>
  );
}
```

### Utilities

#### `RouteObserver`

Singleton instance for observing route changes.

**Methods:**

```typescript
class RouteObserver {
  /** Emit a route change event */
  emit(event: RouteChangeEvent): void;
  
  /** Add a listener for route changes */
  addListener(callback: (event: RouteChangeEvent) => void): () => void;
  
  /** Remove a listener */
  removeListener(callback: (event: RouteChangeEvent) => void): void;
}
```

**Example:**

```typescript
import { routeObserver } from '@react-buoy/route-events';

// Add listener
const unsubscribe = routeObserver.addListener((event) => {
  console.log('Route changed:', event.pathname);
});

// Later, remove listener
unsubscribe();
```

#### `RouteParser`

Utility for parsing Expo Router's route structure.

**Methods:**

```typescript
class RouteParser {
  /** Get all routes from the router */
  static getRoutes(options?: {
    includeLayouts?: boolean;
    includeGroups?: boolean;
  }): RouteInfo[];
  
  /** Group routes by directory */
  static groupRoutes(routes: RouteInfo[]): RouteGroup[];
  
  /** Get statistics about routes */
  static getStats(routes: RouteInfo[]): RouteStats;
}
```

### Types

#### `RouteChangeEvent`

```typescript
interface RouteChangeEvent {
  /** Current pathname */
  pathname: string;
  /** Route parameters */
  params: Record<string, string | string[]>;
  /** Route segments */
  segments: string[];
  /** Timestamp of the change */
  timestamp: number;
  /** Previous pathname (if available) */
  previousPathname?: string;
  /** Time since previous navigation in ms */
  timeSincePrevious?: number;
}
```

#### `RouteInfo`

```typescript
interface RouteInfo {
  /** Full path of the route */
  path: string;
  /** Route type */
  type: RouteType;
  /** Route name/file */
  name: string;
  /** Dynamic parameters */
  params: string[];
  /** Whether it's a layout */
  isLayout: boolean;
  /** Whether it's a route group */
  isGroup: boolean;
  /** Parent path */
  parent?: string;
}
```

#### `RouteType`

```typescript
type RouteType =
  | 'index'      // index routes (/)
  | 'static'     // static routes (/about)
  | 'dynamic'    // dynamic routes (/user/[id])
  | 'catch-all'  // catch-all routes (/docs/[...path])
  | 'layout'     // layout routes (_layout.tsx)
  | 'group';     // route groups ((tabs))
```

## Use Cases

### Analytics Integration

```typescript
import { useRouteObserver } from '@react-buoy/route-events';

export default function RootLayout() {
  useRouteObserver((event) => {
    // Track page views
    analytics.trackPageView({
      path: event.pathname,
      params: event.params,
      previousPath: event.previousPathname,
      timeSpent: event.timeSincePrevious,
    });
  });

  return <Stack />;
}
```

### Performance Monitoring

```typescript
import { useRouteObserver } from '@react-buoy/route-events';

export default function RootLayout() {
  useRouteObserver((event) => {
    if (event.timeSincePrevious && event.timeSincePrevious > 1000) {
      // Log slow navigations
      console.warn('Slow navigation:', {
        from: event.previousPathname,
        to: event.pathname,
        duration: event.timeSincePrevious,
      });
    }
  });

  return <Stack />;
}
```

### Development Tools

```typescript
import { RouteEventsModalWithTabs, routeObserver } from '@react-buoy/route-events';

function DevTools() {
  const [visible, setVisible] = useState(false);
  
  // Only show in development
  if (__DEV__) {
    return (
      <>
        <TouchableOpacity 
          style={styles.devButton}
          onPress={() => setVisible(true)}
        >
          <Text>🧭 Routes</Text>
        </TouchableOpacity>
        
        <RouteEventsModalWithTabs
          visible={visible}
          onClose={() => setVisible(false)}
          routeObserver={routeObserver}
        />
      </>
    );
  }
  
  return null;
}
```

### Route Documentation

```typescript
import { useRouteSitemap } from '@react-buoy/route-events';

function RouteDocumentation() {
  const { routes, groups, stats } = useRouteSitemap({
    includeLayouts: false,
    includeGroups: false,
  });

  return (
    <ScrollView>
      <Text>Total Routes: {stats.total}</Text>
      
      {groups.map(group => (
        <View key={group.name}>
          <Text>{group.name} ({group.routes.length})</Text>
          {group.routes.map(route => (
            <Text key={route.path}>
              {route.path} - {route.type}
            </Text>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}
```

## Features in Detail

### Routes Tab

- Browse all routes in your application
- Search routes by path or name
- View route types (static, dynamic, catch-all)
- Navigate to any route directly
- Handles dynamic route parameters with prompts
- Group and layout route identification

### Events Tab

- Real-time route change monitoring
- Toggle monitoring on/off
- Event timeline with timestamps
- Filter events by pathname patterns
- Search through event history
- View detailed event information
- Compare route changes (diff view)
- Clear event history
- Persistent filter preferences

### Stack Tab

- Real-time navigation stack visualization
- Stack depth indicator
- Navigate to any stack level
- Pop to specific stack index
- Quick navigation controls
- Route parameter display

## Dependencies

- `@react-buoy/shared-ui` - Common UI components and utilities
- `expo-router` - Expo Router integration (peer dependency)
- `@react-navigation/native` - React Navigation integration (peer dependency)
- `@react-native-async-storage/async-storage` - For persistent preferences (peer dependency)
- React and React Native (peer dependencies)

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

## Package Structure

```
route-events/
├── src/
│   ├── components/           # UI components
│   │   ├── RouteEventsModalWithTabs.tsx
│   │   ├── RoutesSitemap.tsx
│   │   ├── NavigationStack.tsx
│   │   ├── RouteEventsTimeline.tsx
│   │   ├── RouteEventItemCompact.tsx
│   │   ├── RouteEventDetailContent.tsx
│   │   ├── RouteEventExpandedContent.tsx
│   │   └── RouteFilterViewV2.tsx
│   ├── RouteObserver.ts     # Event system
│   ├── RouteParser.ts       # Route parsing utilities
│   ├── useRouteObserver.ts  # Route tracking hook
│   ├── useRouteSitemap.ts   # Sitemap access hook
│   ├── useNavigationStack.ts # Stack access hook
│   └── index.tsx            # Main exports
├── lib/                     # Built output (git ignored)
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md
```

## License

MIT

## Contributing

See the main repository [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## Support

For issues and feature requests, please visit the [GitHub repository](https://github.com/LovesWorking/react-native-buoy/issues).
