# RouteNode Type Definition - Complete Reference

## Source
**File:** `expo-router/build/Route.d.ts`
**Version:** expo-router 5.0.7

---

## Complete Type Definition

```typescript
export type RouteNode = {
    /** The type of RouteNode */
    type: 'route' | 'api' | 'layout' | 'redirect' | 'rewrite';

    /** Load a route into memory. Returns the exports from a route. */
    loadRoute: () => Partial<LoadedRoute>;

    /** Loaded initial route name. */
    initialRouteName?: string;

    /** Nested routes */
    children: RouteNode[];

    /** Is the route a dynamic path */
    dynamic: null | DynamicConvention[];

    /** `index`, `error-boundary`, etc. */
    route: string;

    /** Context Module ID, used for matching children. */
    contextKey: string;

    /** Redirect Context Module ID, used for matching children. */
    destinationContextKey?: string;

    /** Is the redirect permanent. */
    permanent?: boolean;

    /** Added in-memory */
    generated?: boolean;

    /** Internal screens like the directory or the auto 404 should be marked as internal. */
    internal?: boolean;

    /** File paths for async entry modules that should be included in the initial chunk request to ensure the runtime JavaScript matches the statically rendered HTML representation. */
    entryPoints?: string[];

    /** HTTP methods for this route. If undefined, assumed to be ['GET'] */
    methods?: string[];
};
```

---

## Supporting Types

### DynamicConvention

```typescript
export type DynamicConvention = {
    /** Parameter name (e.g., "id" for [id].tsx) */
    name: string;

    /** Is it a catch-all route ([...slug]) */
    deep: boolean;

    /** Is it a not-found route (+not-found) */
    notFound?: boolean;
};
```

### LoadedRoute

```typescript
export type LoadedRoute = {
    ErrorBoundary?: ComponentType<ErrorBoundaryProps>;
    default?: ComponentType<any>;
    unstable_settings?: Record<string, any>;
    getNavOptions?: (args: any) => any;
    generateStaticParams?: (props: {
        params?: Record<string, string | string[]>;
    }) => Record<string, string | string[]>[];
};
```

---

## Key Properties Explained

### `type` Property

Indicates what kind of route this is:

| Type | Description | Example File |
|------|-------------|--------------|
| `'route'` | Regular screen route | `index.tsx`, `profile.tsx` |
| `'api'` | API route (server-side) | `api/users+api.ts` |
| `'layout'` | Layout wrapper | `_layout.tsx` |
| `'redirect'` | Redirect route | N/A (generated) |
| `'rewrite'` | Rewrite route | N/A (generated) |

### `route` Property

The route name/path segment. Examples:
- `"index"` for `index.tsx`
- `"profile"` for `profile.tsx`
- `"[id]"` for dynamic routes
- `"[...slug]"` for catch-all routes
- `"_layout"` for layout files

### `contextKey` Property

The full file path used by Metro bundler to identify this route. Example:
```
"./app/pokemon/[id].tsx"
```

### `dynamic` Property

```typescript
// For static routes
dynamic: null

// For dynamic routes like [id].tsx
dynamic: [{ name: "id", deep: false, notFound: false }]

// For catch-all routes like [...slug].tsx
dynamic: [{ name: "slug", deep: true, notFound: false }]

// For not-found routes like +not-found.tsx
dynamic: [{ name: "not-found", deep: false, notFound: true }]
```

### `children` Property

Array of nested `RouteNode` objects. This forms the tree structure:

```typescript
{
  type: 'layout',
  route: '_layout',
  children: [
    {
      type: 'route',
      route: 'index',
      children: []
    },
    {
      type: 'route',
      route: '[id]',
      dynamic: [{ name: 'id', deep: false }],
      children: []
    }
  ]
}
```

### `internal` Property

When `true`, indicates this is an internal route that shouldn't be shown in sitemaps or route lists. Examples:
- Auto-generated 404 pages
- Directory index pages

### `generated` Property

When `true`, indicates this route was added in-memory (not from a file). Examples:
- Auto-generated layouts
- Synthetic routes

---

## Tree Structure

RouteNode forms a hierarchical tree structure:

```
Root RouteNode
├── type: 'layout'
├── route: '_layout'
└── children: [
    {
      type: 'route',
      route: 'index',
      children: []
    },
    {
      type: 'layout',
      route: '(tabs)',
      children: [
        {
          type: 'route',
          route: 'home',
          children: []
        },
        {
          type: 'route',
          route: 'profile',
          children: []
        }
      ]
    },
    {
      type: 'route',
      route: 'pokemon',
      children: [
        {
          type: 'route',
          route: '[id]',
          dynamic: [{ name: 'id', deep: false }],
          children: []
        }
      ]
    }
  ]
```

---

## How to Access RouteNode

### Method 1: From Router Store (Recommended)

```typescript
import { store } from 'expo-router/src/global-state/router-store';

// Access the route tree
const routeNode = store.routeNode;

// Check if it exists
if (routeNode) {
  console.log('Route type:', routeNode.type);
  console.log('Route name:', routeNode.route);
  console.log('Children count:', routeNode.children.length);
}
```

### Method 2: From Context (In Components)

```typescript
import { useRouteNode } from 'expo-router/build/Route';

function MyComponent() {
  const routeNode = useRouteNode();

  if (routeNode) {
    console.log('Current route:', routeNode.route);
  }

  return <View>...</View>;
}
```

---

## Route Type Detection Examples

### Detecting Static Routes

```typescript
function isStaticRoute(node: RouteNode): boolean {
  return node.type === 'route' && node.dynamic === null;
}
```

### Detecting Dynamic Routes

```typescript
function isDynamicRoute(node: RouteNode): boolean {
  return node.dynamic !== null && node.dynamic.length > 0;
}

function getDynamicParams(node: RouteNode): string[] {
  if (!node.dynamic) return [];
  return node.dynamic.map(d => d.name);
}
```

### Detecting Catch-All Routes

```typescript
function isCatchAllRoute(node: RouteNode): boolean {
  return node.dynamic?.some(d => d.deep) ?? false;
}
```

### Detecting Layouts

```typescript
function isLayout(node: RouteNode): boolean {
  return node.type === 'layout';
}
```

### Detecting Internal Routes

```typescript
function shouldShowInSitemap(node: RouteNode): boolean {
  return !node.internal && !node.generated;
}
```

---

## Building Full Paths

### Traversing the Tree

```typescript
function buildFullPath(node: RouteNode, parentPath: string = ''): string {
  // Skip layout wrappers (they don't add to the path)
  if (node.type === 'layout' && node.route === '_layout') {
    return parentPath;
  }

  // Skip route groups (parentheses) - they don't add to the path
  if (node.route.startsWith('(') && node.route.endsWith(')')) {
    return parentPath;
  }

  // Handle index routes
  if (node.route === 'index') {
    return parentPath || '/';
  }

  // Build path segment
  const segment = node.route;

  // Combine with parent path
  if (parentPath === '' || parentPath === '/') {
    return `/${segment}`;
  }

  return `${parentPath}/${segment}`;
}
```

### Recursive Tree Traversal

```typescript
function getAllRoutes(node: RouteNode, parentPath: string = '', routes: RouteInfo[] = []): RouteInfo[] {
  // Build current path
  const currentPath = buildFullPath(node, parentPath);

  // Add current node if it's a route (not just a layout or group)
  if (node.type === 'route' && !node.internal && !node.generated) {
    routes.push({
      path: currentPath,
      type: node.type,
      dynamic: node.dynamic,
      route: node.route,
      contextKey: node.contextKey,
    });
  }

  // Recursively process children
  for (const child of node.children) {
    getAllRoutes(child, currentPath, routes);
  }

  return routes;
}
```

---

## Example Usage

```typescript
import { store } from 'expo-router/src/global-state/router-store';
import type { RouteNode } from 'expo-router/build/Route';

function logRouteTree() {
  const rootNode = store.routeNode;

  if (!rootNode) {
    console.log('No route tree available');
    return;
  }

  console.log('Root node:', rootNode.route);
  console.log('Type:', rootNode.type);
  console.log('Children count:', rootNode.children.length);

  // Traverse and log all routes
  function traverse(node: RouteNode, depth: number = 0) {
    const indent = '  '.repeat(depth);
    const dynamicInfo = node.dynamic
      ? ` (dynamic: ${node.dynamic.map(d => d.name).join(', ')})`
      : '';

    console.log(`${indent}- ${node.route}${dynamicInfo}`);

    for (const child of node.children) {
      traverse(child, depth + 1);
    }
  }

  traverse(rootNode);
}
```

---

## Important Notes

1. **RouteNode is available after navigation mounts**
   ```typescript
   // Wait for navigation to be ready
   if (store.navigationRef?.current?.isReady()) {
     const routeNode = store.routeNode;
   }
   ```

2. **RouteNode structure is static** (doesn't change during app runtime unless hot reloaded)

3. **Layout routes don't add to URL path** but are important for component hierarchy

4. **Route groups `(group)` don't add to URL path** - they're organizational only

5. **Internal and generated routes should be filtered** when displaying to users

6. **API routes** (`+api.ts` files) won't be navigable in the app but appear in the tree

---

## Next Steps for Sitemap Implementation

Based on this structure, the Routes Sitemap implementation should:

1. **Access `store.routeNode`** to get the root of the tree

2. **Recursively traverse** `children` arrays to build complete route list

3. **Filter routes** based on:
   - Exclude `internal === true`
   - Exclude `generated === true`
   - Exclude `type === 'api'` (unless showing API routes specifically)
   - Include `type === 'route'` and `type === 'layout'`

4. **Build full paths** by concatenating route segments, skipping:
   - Layout wrappers (`_layout`)
   - Route groups (`(tabs)`, `(auth)`, etc.)

5. **Detect route types** using:
   - `dynamic` property for dynamic/catch-all routes
   - `type` property for layout/route distinction
   - `route` property patterns (contains `[`, `+not-found`, etc.)

6. **Extract params** from `dynamic` array for dynamic routes

7. **Group routes** for display:
   - Root routes (no parent structure)
   - Dynamic routes (has `dynamic` property)
   - Grouped routes (under route groups)
   - Nested routes (multiple levels deep)

---

## References

- **Type Source:** `expo-router/build/Route.d.ts`
- **Route Generation:** `expo-router/build/getRoutes.d.ts`
- **Store Access:** `expo-router/src/global-state/router-store`
