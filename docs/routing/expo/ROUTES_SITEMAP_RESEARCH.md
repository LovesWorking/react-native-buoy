# Routes Sitemap Implementation - Research Document

## Overview

This document outlines all research needed to implement **Tab 1: Routes (Sitemap)** for the Route Events DevTools modal. The goal is to display a static sitemap of all available routes in the Expo Router application.

**Reference Documents:**
- `docs/routing/ROUTE_EVENTS_DISPLAY_STRATEGY.md` - Overall strategy and requirements
- `docs/routing/expo/ROUTING_RESEARCH_FINDINGS.md` - Router architecture and interception points
- `docs/routing/expo/EXPO_ROUTER_INTERCEPTION_API.md` - Complete API guide

---

## Requirements Summary

From `ROUTE_EVENTS_DISPLAY_STRATEGY.md`:

### Display Format

```
📍 Root Routes
  ├─ / (index)
  ├─ /profile/[id]
  └─ /settings

📂 (tabs) Layout
  ├─ /home
  ├─ /search
  └─ /profile

🔀 Dynamic Routes
  ├─ /pokemon/[id]
  ├─ /posts/[slug]
  └─ /user/[username]/posts
```

### Features Required
- Search/filter routes
- Copy route path
- Navigate to route from devtools
- Show route params required
- Display route types (static, dynamic, modal, group)

### Data Source
From existing research:
```typescript
// From router-store
import { store } from 'expo-router/src/global-state/router-store';

const routeNode = store.routeNode;
// Parse this tree structure to build sitemap
```

---

## Research Tasks

### 1. Understanding RouteNode Structure

**What we know:**
- `store.routeNode: RouteNode | null` - The route tree generated from file structure
- Located in `packages/expo-router/src/global-state/router-store.tsx`

**What we need to research:**

#### 1.1 RouteNode Type Definition
- [ ] Find the TypeScript definition of `RouteNode`
- [ ] Understand its properties and structure
- [ ] Document the complete type

**Questions:**
- What properties does RouteNode have?
- Is it a tree/nested structure?
- How are children represented?
- How are dynamic segments represented?

**Files to investigate:**
```typescript
// Look for RouteNode definition
packages/expo-router/src/Route.ts
packages/expo-router/src/types.ts
packages/expo-router/node_modules/@expo/metro-config/build/transform-worker/expo-router-imports.d.ts
```

---

#### 1.2 RouteNode Tree Structure
- [ ] Document how the tree is organized
- [ ] Understand parent-child relationships
- [ ] Identify how layouts are represented
- [ ] Identify how groups are represented

**Questions:**
- Is it a single root with children?
- How deep can the tree go?
- Are layouts part of the tree?
- How are route groups `(group)` represented?

**Investigation approach:**
```typescript
// Log the entire routeNode structure
import { store } from 'expo-router/src/global-state/router-store';

useEffect(() => {
  if (store.routeNode) {
    console.log('RouteNode structure:', JSON.stringify(store.routeNode, null, 2));
  }
}, []);
```

---

#### 1.3 Route Metadata
- [ ] Understand what metadata is available per route
- [ ] Check if route type (static/dynamic/modal) is included
- [ ] Check if file path is available

**Questions:**
- Does RouteNode include the file system path?
- Can we detect if a route is dynamic (`[id]`, `[...slug]`)?
- Can we detect if a route is a layout (`_layout.tsx`)?
- Can we detect if a route is a modal?
- Can we detect if a route is in a group `(group)`?

**Expected properties to look for:**
```typescript
interface RouteNode {
  name?: string;
  path?: string;
  dynamic?: boolean;
  children?: RouteNode[];
  layouts?: RouteNode[];
  type?: 'route' | 'layout' | 'group' | 'modal';
  // ... other properties
}
```

---

### 2. Expo Router File Conventions

**What we need to research:**

#### 2.1 File-Based Routing Conventions
- [ ] Document all special file naming conventions
- [ ] Understand how files map to routes

**Conventions to document:**

| File Pattern | Route Type | Example | Description |
|--------------|-----------|---------|-------------|
| `index.tsx` | Index route | `/` | Root or directory index |
| `[param].tsx` | Dynamic route | `/[id]` | Single dynamic segment |
| `[...param].tsx` | Catch-all | `/[...slug]` | Matches multiple segments |
| `_layout.tsx` | Layout | - | Wraps child routes |
| `(group)/` | Route group | `/(tabs)` | Organizes routes without affecting URL |
| `+not-found.tsx` | 404 route | - | Fallback route |
| `+html.tsx` | HTML root | - | Custom HTML wrapper (web) |

**Files to read:**
- Expo Router documentation on file-based routing
- Example app structure in `example/app/`

---

#### 2.2 Modal Routes
- [ ] Understand how modals are represented in file structure
- [ ] Check if modals appear in routeNode differently

**Questions:**
- How are modal routes defined?
- Do they have a special prefix or suffix?
- Can modals be dynamic routes?

**Example to investigate:**
```
app/
  _layout.tsx
  index.tsx
  (modals)/
    login.tsx    # Modal route
```

---

#### 2.3 Tab and Drawer Navigators
- [ ] Understand how tab layouts are represented
- [ ] Understand how drawer layouts are represented

**Questions:**
- Are tabs a special route group?
- How do we detect if a layout is a tab navigator vs stack?
- Can we read navigator type from routeNode?

**Example structures:**
```
app/
  (tabs)/
    _layout.tsx   # Tab navigator
    home.tsx      # Tab 1
    profile.tsx   # Tab 2
```

---

### 3. Parsing the RouteNode Tree

**What we need to implement:**

#### 3.1 Tree Traversal Algorithm
- [ ] Write a function to traverse the RouteNode tree
- [ ] Handle nested routes recursively
- [ ] Collect all routes into a flat list

**Pseudocode:**
```typescript
function traverseRouteNode(node: RouteNode, parentPath = ''): RouteInfo[] {
  const routes: RouteInfo[] = [];

  // Process current node
  const currentPath = buildPath(parentPath, node);
  routes.push({
    path: currentPath,
    name: node.name,
    type: detectRouteType(node),
    params: extractDynamicParams(node)
  });

  // Process children recursively
  if (node.children) {
    for (const child of node.children) {
      routes.push(...traverseRouteNode(child, currentPath));
    }
  }

  return routes;
}
```

---

#### 3.2 Route Type Detection
- [ ] Implement logic to detect route type

**Route types to detect:**
```typescript
type RouteType =
  | 'static'        // Regular route: /home
  | 'dynamic'       // Dynamic segment: /profile/[id]
  | 'catch-all'     // Catch-all: /posts/[...slug]
  | 'index'         // Index route: /
  | 'layout'        // Layout component: _layout
  | 'group'         // Route group: (tabs)
  | 'modal'         // Modal route: (modals)/login
  | 'not-found';    // 404 fallback
```

**Detection logic:**
```typescript
function detectRouteType(node: RouteNode): RouteType {
  const name = node.name || '';

  if (name.includes('[...')) return 'catch-all';
  if (name.includes('[')) return 'dynamic';
  if (name === '_layout') return 'layout';
  if (name.startsWith('(') && name.endsWith(')')) return 'group';
  if (name === 'index') return 'index';
  if (name === '+not-found') return 'not-found';

  // TODO: How to detect modals?

  return 'static';
}
```

---

#### 3.3 Dynamic Parameter Extraction
- [ ] Extract parameter names from dynamic routes
- [ ] Handle multiple parameters in a path

**Examples:**
```typescript
extractDynamicParams('/profile/[id]')
// => ['id']

extractDynamicParams('/user/[username]/posts/[postId]')
// => ['username', 'postId']

extractDynamicParams('/posts/[...slug]')
// => ['slug'] (catch-all)
```

**Implementation approach:**
```typescript
function extractDynamicParams(routePath: string): string[] {
  const regex = /\[([^\]]+)\]/g;
  const params: string[] = [];
  let match;

  while ((match = regex.exec(routePath)) !== null) {
    params.push(match[1].replace('...', '')); // Remove spread operator
  }

  return params;
}
```

---

### 4. Hierarchical Organization

**What we need to implement:**

#### 4.1 Route Grouping
- [ ] Group routes by type (root, tabs, dynamic)
- [ ] Build hierarchical structure for display

**Data structure:**
```typescript
interface RouteGroup {
  title: string;
  icon: string;
  routes: RouteInfo[];
}

interface RouteInfo {
  path: string;
  name: string;
  type: RouteType;
  params: string[];
  children?: RouteInfo[];
}
```

**Grouping logic:**
```typescript
function organizeRoutes(routes: RouteInfo[]): RouteGroup[] {
  return [
    {
      title: 'Root Routes',
      icon: '📍',
      routes: routes.filter(r => !r.path.includes('(') && r.type !== 'dynamic')
    },
    {
      title: 'Tab Routes',
      icon: '📂',
      routes: routes.filter(r => r.path.includes('(tabs)'))
    },
    {
      title: 'Dynamic Routes',
      icon: '🔀',
      routes: routes.filter(r => r.type === 'dynamic' || r.type === 'catch-all')
    },
    {
      title: 'Modal Routes',
      icon: '🪟',
      routes: routes.filter(r => r.path.includes('(modals)'))
    }
  ];
}
```

---

#### 4.2 Visual Tree Representation
- [ ] Implement tree-style indentation
- [ ] Show parent-child relationships visually

**Display format:**
```
📍 Root Routes
  ├─ / (index)
  ├─ /profile
  │  └─ /profile/[id]
  └─ /settings
     ├─ /settings/account
     └─ /settings/privacy
```

**Implementation approach:**
```typescript
function buildTreeString(
  routes: RouteInfo[],
  depth = 0,
  isLast = false
): string {
  let output = '';

  routes.forEach((route, index) => {
    const isLastChild = index === routes.length - 1;
    const prefix = buildTreePrefix(depth, isLast, isLastChild);

    output += `${prefix} ${route.path}`;

    if (route.params.length > 0) {
      output += ` { ${route.params.join(', ')} }`;
    }

    output += '\n';

    if (route.children) {
      output += buildTreeString(route.children, depth + 1, isLastChild);
    }
  });

  return output;
}
```

---

### 5. Implementation Questions

**Critical questions we need to answer:**

#### 5.1 Data Source Questions
- [ ] Does `store.routeNode` update when the app structure changes?
- [ ] Is `routeNode` available immediately or after navigation mounts?
- [ ] Do we need to subscribe to changes in routeNode?

**Investigation:**
```typescript
// Check when routeNode becomes available
useEffect(() => {
  console.log('Initial routeNode:', store.routeNode);

  // Does it change?
  const interval = setInterval(() => {
    console.log('Current routeNode:', store.routeNode);
  }, 1000);

  return () => clearInterval(interval);
}, []);
```

---

#### 5.2 Dynamic Discovery Questions
- [ ] Can we discover all routes without navigating to them?
- [ ] Are lazy-loaded routes included in routeNode?
- [ ] How do we handle routes that haven't been defined yet?

---

#### 5.3 Alternative Data Sources
If `store.routeNode` is insufficient:
- [ ] Can we use `expo-router/routes-manifest`?
- [ ] Can we parse the file system directly?
- [ ] Can we use Metro bundler's module graph?

**Alternative approaches:**
```typescript
// Option 1: Routes manifest
import manifest from 'expo-router/routes-manifest';
console.log('Routes manifest:', manifest);

// Option 2: Require.context (if available)
const routeFiles = require.context('../app', true, /\.(tsx|jsx)$/);
console.log('Route files:', routeFiles.keys());

// Option 3: getSortedRoutes (if exported)
import { getSortedRoutes } from 'expo-router/src/routes';
```

---

### 6. Example App Analysis

**Investigation tasks:**

#### 6.1 Analyze Example App Structure
- [ ] Document the current example app route structure
- [ ] Map files to expected routes
- [ ] Test routeNode against actual structure

**Current example structure:**
```
example/app/
  _layout.tsx
  index.tsx
  pokemon/
    [id].tsx
```

**Expected routes:**
```
/ (index)
/pokemon/[id]
```

**Verification code:**
```typescript
// In example app
import { store } from 'expo-router/src/global-state/router-store';

useEffect(() => {
  const logRouteStructure = () => {
    console.log('=== ROUTE STRUCTURE ANALYSIS ===');
    console.log('routeNode:', store.routeNode);
    console.log('Type:', typeof store.routeNode);
    console.log('Keys:', Object.keys(store.routeNode || {}));
    console.log('JSON:', JSON.stringify(store.routeNode, null, 2));
  };

  // Log after navigation is ready
  if (store.navigationRef.isReady()) {
    logRouteStructure();
  } else {
    const timer = setInterval(() => {
      if (store.navigationRef.isReady()) {
        clearInterval(timer);
        logRouteStructure();
      }
    }, 100);
  }
}, []);
```

---

#### 6.2 Test Route Discovery
- [ ] Create test routes with various patterns
- [ ] Verify they appear in routeNode
- [ ] Document any limitations

**Test cases to create:**
```
example/app/
  ├── _layout.tsx (existing)
  ├── index.tsx (existing)
  ├── test-static.tsx (NEW)
  ├── test-dynamic/[id].tsx (NEW)
  ├── test-catch-all/[...slug].tsx (NEW)
  └── (test-group)/
      └── grouped.tsx (NEW)
```

---

### 7. UI Component Research

**What we need to design:**

#### 7.1 Route List Display
- [ ] Collapsible sections for route groups
- [ ] Icons for route types
- [ ] Color coding for different types

**Component structure:**
```typescript
<RoutesSitemap>
  <RouteGroup title="Root Routes" icon="📍">
    <RouteItem path="/" type="index" />
    <RouteItem path="/profile/[id]" type="dynamic" params={['id']} />
  </RouteGroup>

  <RouteGroup title="Dynamic Routes" icon="🔀">
    <RouteItem path="/pokemon/[id]" type="dynamic" params={['id']} />
  </RouteGroup>
</RoutesSitemap>
```

---

#### 7.2 Interactive Features
- [ ] Click to copy route path
- [ ] Click to navigate to route
- [ ] Search/filter functionality
- [ ] Show required params for dynamic routes

**Features needed:**
```typescript
interface RouteItemProps {
  path: string;
  type: RouteType;
  params?: string[];
  onCopy?: (path: string) => void;
  onNavigate?: (path: string) => void;
}
```

---

#### 7.3 Search Implementation
- [ ] Filter routes by path
- [ ] Filter routes by type
- [ ] Highlight matching text

**Search logic:**
```typescript
function filterRoutes(routes: RouteInfo[], query: string): RouteInfo[] {
  if (!query) return routes;

  const lowerQuery = query.toLowerCase();

  return routes.filter(route => {
    return (
      route.path.toLowerCase().includes(lowerQuery) ||
      route.type.toLowerCase().includes(lowerQuery) ||
      route.params.some(p => p.toLowerCase().includes(lowerQuery))
    );
  });
}
```

---

### 8. Implementation Plan

**Phased approach:**

#### Phase 1: Research & Discovery
1. Log and analyze `store.routeNode` structure
2. Document RouteNode TypeScript definition
3. Map example app routes to routeNode
4. Verify all route types are detectable

**Deliverable:** Complete understanding of routeNode structure

---

#### Phase 2: Core Parsing Logic
1. Implement tree traversal function
2. Implement route type detection
3. Implement dynamic parameter extraction
4. Build flat list of all routes

**Deliverable:** Function that extracts all routes from routeNode

---

#### Phase 3: Organization & Grouping
1. Implement route grouping logic
2. Build hierarchical structure
3. Sort routes appropriately
4. Add metadata (params, type)

**Deliverable:** Organized route groups ready for display

---

#### Phase 4: UI Implementation
1. Create RoutesSitemap component
2. Create RouteGroup component
3. Create RouteItem component
4. Add collapsible sections
5. Add icons and styling

**Deliverable:** Working UI displaying all routes

---

#### Phase 5: Interactive Features
1. Implement copy-to-clipboard
2. Implement navigate-to-route
3. Implement search/filter
4. Add keyboard shortcuts (optional)

**Deliverable:** Fully interactive Routes tab

---

## Success Criteria

The Routes Sitemap implementation will be considered complete when:

- [x] All routes in the app are displayed
- [x] Routes are correctly grouped by type
- [x] Dynamic parameters are identified and shown
- [x] Layout and group routes are properly represented
- [x] Users can copy route paths
- [x] Users can navigate to routes from the sitemap
- [x] Search/filter works correctly
- [x] UI matches the design in ROUTE_EVENTS_DISPLAY_STRATEGY.md

---

## Open Questions

**Questions to answer during research:**

1. Does `store.routeNode` include all routes or only mounted routes?
2. How do we handle routes added via expo-router plugins?
3. Can we detect route middleware/guards from routeNode?
4. How do we handle API routes (if supported)?
5. Should we show hidden routes (starting with `_` or `+`)?
6. How do we handle web-specific routes?
7. Should we show route order/priority?
8. Can we show which routes have getServerSideProps/getStaticProps?

---

## Next Steps

1. **Start with Phase 1: Research & Discovery**
   - Add logging code to example app
   - Run app and analyze routeNode structure
   - Document findings in this file

2. **Create proof-of-concept**
   - Write simple traversal function
   - Test with example app routes
   - Verify all routes are found

3. **Iterate based on findings**
   - Update this document with discoveries
   - Adjust implementation plan as needed

---

## Reference Code Locations

**Files to investigate:**

```
packages/expo-router/src/
  ├── Route.ts                          # RouteNode definition?
  ├── types.ts                          # Type definitions
  ├── global-state/
  │   └── router-store.tsx             # store.routeNode
  ├── getRoutes.ts                     # Route generation logic
  ├── routes.ts                        # Route utilities
  └── fork/
      └── getPathFromState.ts          # Path building logic
```

**Key imports to explore:**
```typescript
import { store } from 'expo-router/src/global-state/router-store';
import type { RouteNode } from 'expo-router/src/Route';
```

---

## Notes

- This is a living document - update as we learn more
- Add code examples and findings directly to this file
- Link to any new files created during research
- Document all assumptions and limitations discovered
