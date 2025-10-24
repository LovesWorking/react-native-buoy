# Route DevTools Implementation Status & Roadmap

**Last Updated**: January 2025
**Package**: `@react-buoy/route-events`
**Status**: Phase 1 Complete, Phase 2 In Progress

---

## Table of Contents

1. [Overview](#overview)
2. [Completed Work (Phase 1)](#completed-work-phase-1)
3. [Current Task: Stack Tab (Phase 2)](#current-task-stack-tab-phase-2)
4. [Future Enhancements (Phase 3)](#future-enhancements-phase-3)
5. [Technical Architecture](#technical-architecture)
6. [Implementation Checklist](#implementation-checklist)

---

## Overview

### The Three-Pillar Architecture

Our Route DevTools follows the strategy outlined in `ROUTE_EVENTS_DISPLAY_STRATEGY.md`:

```
┌─────────────────────────────────────────────┐
│  Route DevTools Modal (3 Tabs)              │
├─────────────────────────────────────────────┤
│                                             │
│  📍 Routes    │  📋 Events   │  🥞 Stack   │
│  (What's      │  (What       │  (What's    │
│   possible)   │   happened)  │   now)      │
│                                             │
│  Sitemap      │  Timeline    │  Current    │
│  of all       │  of route    │  navigation │
│  available    │  changes     │  state      │
│  routes       │              │             │
└─────────────────────────────────────────────┘
```

### Purpose of Each Tab

| Tab | Purpose | Analogy | Status |
|-----|---------|---------|--------|
| **Routes** | Discover all available routes in the app | Phone book | ✅ **COMPLETE** |
| **Events** | Track navigation timeline chronologically | Git log | ✅ **COMPLETE** |
| **Stack** | Visualize current navigation state | Current file in editor | ❌ **TODO** |

---

## Completed Work (Phase 1)

### ✅ Tab 1: Routes (Sitemap)

**Files Created/Modified:**
- `packages/route-events/src/RouteParser.ts` (421 lines)
- `packages/route-events/src/useRouteSitemap.ts` (228 lines)
- `packages/route-events/src/components/RoutesSitemap.tsx` (685 lines)

**Features Implemented:**

#### Core Parsing Engine
- [x] Parse Expo Router's `RouteNode` tree structure
- [x] Extract all routes from file-based routing
- [x] Classify route types:
  - Static routes (`/home`)
  - Dynamic routes (`/pokemon/[id]`)
  - Catch-all routes (`/posts/[...slug]`)
  - Index routes (`/`)
  - Layouts (`_layout.tsx`)
  - Route groups (`(tabs)`)
  - Not-found routes

#### Route Organization
- [x] Organize routes into logical groups:
  - Root Routes
  - Dynamic Routes
  - Layouts
  - Route Groups
- [x] Build hierarchical tree structure
- [x] Extract dynamic parameters from routes
- [x] Flatten nested routes for display

#### UI Components
- [x] Route statistics header (total, static, dynamic, layouts)
- [x] Search/filter functionality
- [x] Expandable route groups with chevron indicators
- [x] Individual route items with:
  - Route path display
  - Type badge (color-coded)
  - Parameter display for dynamic routes
  - Copy to clipboard button
  - Navigate button (with warnings for dynamic routes)
- [x] Empty states for loading and no results
- [x] Clean, emoji-free design

#### React Hooks
- [x] `useRouteSitemap()` - Main hook with search, sort, filter
- [x] `useRoute()` - Get specific route by path
- [x] `useParentRoutes()` - Get parent routes for breadcrumb

#### Route Parser Utilities
- [x] `parseRouteTree()` - Convert RouteNode to RouteInfo array
- [x] `organizeRoutes()` - Group routes by type
- [x] `filterRoutes()` - Search/filter implementation
- [x] `sortRoutes()` - Sort by path, type, or name
- [x] `getRouteStats()` - Calculate statistics
- [x] `findRouteByPath()` - Lookup helper
- [x] `getParentRoutes()` - Hierarchy helper

**Data Source:**
- Dynamic require from `expo-router/build/global-state/router-store`
- Accesses `store.routeNode` for route tree
- Uses `navigationRef.isReady()` to ensure router is initialized

**Key Technical Decisions:**
- ✅ Used dynamic `require()` instead of static imports to avoid Metro bundler issues
- ✅ Defined RouteNode type inline to avoid import issues
- ✅ Used `expo-router/build/` path instead of `/src/` for runtime compatibility
- ✅ Removed all emojis for clean, professional UX
- ✅ Color-coded type tags for visual distinction

---

### ✅ Tab 2: Events (Timeline)

**Files Created/Modified:**
- `packages/route-events/src/RouteObserver.ts` (existing)
- `packages/route-events/src/useRouteObserver.ts` (existing)
- `packages/route-events/src/components/RouteEventsModalWithTabs.tsx` (existing)
- `packages/route-events/src/components/RouteEventDetailContent.tsx` (existing)
- `packages/route-events/src/components/RouteFilterViewV2.tsx` (existing)

**Features Implemented:**

#### Event Tracking
- [x] Subscribe to route changes via `RouteObserver`
- [x] Capture event data:
  - `pathname`
  - `params`
  - `segments`
  - `timestamp`
- [x] Store events in memory (max 500)
- [x] Play/pause event monitoring
- [x] Clear events functionality

#### Event Organization
- [x] Group events by pathname ("conversations")
- [x] Show total navigation count per route
- [x] Display last event timestamp
- [x] Sort by most recent activity

#### Event Filtering
- [x] Ignore patterns (configurable filters)
- [x] Filter view with:
  - Add custom patterns
  - Toggle existing patterns
  - View all available pathnames
- [x] Persist filters in AsyncStorage

#### Event Detail View
- [x] View individual events within a conversation
- [x] Navigate between events (Previous/Next)
- [x] Display full event data
- [x] Relative timestamps ("2 seconds ago")

#### State Persistence
- [x] Persist active tab (Routes/Events)
- [x] Persist monitoring state (play/pause)
- [x] Persist event filters
- [x] Use AsyncStorage for all persistence

**Key Features:**
- Real-time updates as user navigates
- Conversation-based grouping reduces noise
- Filter out system routes (/_sitemap, /api, /__dev)
- Chronological order (newest first)

---

## Current Task: Stack Tab (Phase 2)

### 🔨 What We're Building Now

The **Stack Tab** will visualize the current navigation stack - showing what screens are currently mounted in memory and which one is visible.

### Why This Matters

Understanding the **difference between Events and Stack**:

| Events Tab | Stack Tab |
|-----------|-----------|
| **Timeline** of what happened | **Snapshot** of current state |
| Append-only log | Real-time representation |
| Historical record | Current memory state |
| "What did the user do?" | "What screens exist now?" |
| Git commit log | Current branch state |

**Example Scenario:**
```
User Actions:
1. Opens app → /
2. Taps "Profile" → /profile
3. Taps "Settings" → /settings
4. Taps back button
5. Taps "Posts" → /posts

Events Tab shows:
- Event #5: PUSH /posts
- Event #4: POP
- Event #3: PUSH /settings
- Event #2: PUSH /profile
- Event #1: NAVIGATE /

Stack Tab shows:
[/, /profile, /posts]  ← Only 3 screens in memory
      ↑ focused
```

Notice: `/settings` was visited (in Events) but no longer exists in the Stack.

---

### 📋 Stack Tab Requirements

#### Visual Design

```
╔══════════════════════════════════════╗
║  Navigation Stack (3 screens)        ║
╠══════════════════════════════════════╣
║                                      ║
║  ┌────────────────────────────────┐ ║
║  │ /posts                         │ ║ ← Top (Visible)
║  │ params: { category: "tech" }   │ ║
║  │                                │ ║
║  │ FOCUSED                        │ ║
║  │ [Pop] [Focus]                  │ ║
║  └────────────────────────────────┘ ║
║           ↑ Currently Visible        ║
║                                      ║
║  ┌────────────────────────────────┐ ║
║  │ /profile                       │ ║ ← Hidden (in memory)
║  │ params: { id: "123" }          │ ║
║  │                                │ ║
║  │ IN MEMORY                      │ ║
║  │ [Pop] [Focus]                  │ ║
║  └────────────────────────────────┘ ║
║                                      ║
║  ┌────────────────────────────────┐ ║
║  │ / (index)                      │ ║ ← Bottom
║  │ params: {}                     │ ║
║  │                                │ ║
║  │ IN MEMORY                      │ ║
║  │ [Pop] [Focus]                  │ ║
║  └────────────────────────────────┘ ║
║           ↓ Base of Stack            ║
║                                      ║
║  [← Back] [🏠 Pop to Top] [🔄 Reset]║
╚══════════════════════════════════════╝
```

#### Data Structure

Based on React Navigation's NavigationState:

```typescript
interface NavigationStackState {
  key: string;           // Navigator key
  index: number;         // Currently focused index (0-based)
  routes: RouteStackItem[];
  type: string;          // Navigator type
}

interface RouteStackItem {
  key: string;           // Unique route instance key
  name: string;          // Route name
  path?: string;         // Full pathname
  params?: Record<string, any>;
}

interface StackDisplayItem extends RouteStackItem {
  pathname: string;      // Computed from route info
  isFocused: boolean;    // Is currently visible
  index: number;         // Position in stack (0 = bottom)
  canPop: boolean;       // Can this be popped
}
```

#### Features to Implement

**Display Features:**
- [ ] Show all screens currently in the stack
- [ ] Visual stacking (cards or list with clear hierarchy)
- [ ] Highlight focused/visible screen
- [ ] Show screen position (index in stack)
- [ ] Display route params for each screen
- [ ] Indicate which screens are "in memory but hidden"
- [ ] Empty state when no navigation stack exists

**Interactive Controls:**
- [ ] **Navigate to Screen**: Click a screen to focus it
- [ ] **Pop Screen**: Remove a screen from the stack
- [ ] **Go Back**: Pop top screen (same as device back button)
- [ ] **Pop to Top**: Clear all screens except the first one
- [ ] **Reset Stack**: Replace entire stack with new route

**Real-time Updates:**
- [ ] Subscribe to `store.state` changes
- [ ] Update stack display on every navigation
- [ ] Animate stack changes (optional)
- [ ] Show transition states (loading, error)

**Additional Info:**
- [ ] Show stack depth (number of screens)
- [ ] Show focused route name
- [ ] Indicate if stack is at root (can't go back)
- [ ] Show route keys for debugging

---

### 🛠 Implementation Plan for Stack Tab

#### Step 1: Create Stack State Hook

**File:** `packages/route-events/src/useNavigationStack.ts`

```typescript
/**
 * Hook to access current navigation stack state
 * Data source: expo-router/build/global-state/router-store
 */

import { useState, useEffect, useMemo } from 'react';

// Type definitions
interface RouteStackItem {
  key: string;
  name: string;
  path?: string;
  params?: Record<string, any>;
}

interface NavigationStackState {
  key: string;
  index: number;
  routes: RouteStackItem[];
  type: string;
}

interface StackDisplayItem {
  key: string;
  name: string;
  pathname: string;
  params: Record<string, any>;
  isFocused: boolean;
  index: number;
  canPop: boolean;
}

export interface UseNavigationStackResult {
  // Stack data
  stack: StackDisplayItem[];
  focusedRoute: StackDisplayItem | null;
  stackDepth: number;
  isAtRoot: boolean;

  // Stack info
  isLoaded: boolean;
  error: Error | null;

  // Actions
  refresh: () => void;
  navigateToIndex: (index: number) => void;
  popToIndex: (index: number) => void;
  goBack: () => void;
  popToTop: () => void;
}

/**
 * Access the current navigation stack from Expo Router
 */
export function useNavigationStack(): UseNavigationStackResult {
  const [stackState, setStackState] = useState<NavigationStackState | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Get router store using dynamic require
  const getRouterStore = () => {
    try {
      const routerStore = require('expo-router/build/global-state/router-store');
      return routerStore?.store || null;
    } catch (err) {
      console.warn('Could not access expo-router store:', err);
      return null;
    }
  };

  // Subscribe to navigation state changes
  useEffect(() => {
    const store = getRouterStore();
    if (!store) {
      setError(new Error('Router store not available'));
      return;
    }

    // Get initial state
    const updateState = () => {
      try {
        const state = store.state;
        if (state) {
          setStackState(state);
          setIsLoaded(true);
          setError(null);
        }
      } catch (err) {
        setError(err as Error);
      }
    };

    // Initial load
    updateState();

    // Subscribe to changes
    const unsubscribe = store.subscribe(() => {
      updateState();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Transform stack state into display items
  const stack = useMemo<StackDisplayItem[]>(() => {
    if (!stackState) return [];

    return stackState.routes.map((route, index) => ({
      key: route.key,
      name: route.name,
      pathname: route.path || `/${route.name}`,
      params: route.params || {},
      isFocused: index === stackState.index,
      index,
      canPop: index > 0, // Can't pop the first screen
    }));
  }, [stackState]);

  // Get focused route
  const focusedRoute = useMemo(() => {
    return stack.find(item => item.isFocused) || null;
  }, [stack]);

  // Helper properties
  const stackDepth = stack.length;
  const isAtRoot = stackDepth <= 1;

  // Manual refresh
  const refresh = () => {
    const store = getRouterStore();
    if (store?.state) {
      setStackState(store.state);
    }
  };

  // Navigation actions
  const navigateToIndex = (index: number) => {
    const store = getRouterStore();
    if (!store || index >= stack.length) return;

    const targetRoute = stack[index];
    if (targetRoute) {
      // Use router to navigate
      const router = require('expo-router');
      router.router.navigate(targetRoute.pathname);
    }
  };

  const popToIndex = (index: number) => {
    const store = getRouterStore();
    if (!store || index >= stack.length) return;

    // Calculate how many screens to pop
    const currentIndex = stackState?.index || 0;
    const popCount = currentIndex - index;

    if (popCount > 0) {
      const router = require('expo-router');

      // Pop multiple times
      for (let i = 0; i < popCount; i++) {
        router.router.back();
      }
    }
  };

  const goBack = () => {
    if (isAtRoot) return;

    const router = require('expo-router');
    router.router.back();
  };

  const popToTop = () => {
    if (isAtRoot) return;

    popToIndex(0);
  };

  return {
    stack,
    focusedRoute,
    stackDepth,
    isAtRoot,
    isLoaded,
    error,
    refresh,
    navigateToIndex,
    popToIndex,
    goBack,
    popToTop,
  };
}
```

**Why this approach:**
- Subscribes to `store.state` for real-time updates
- Transforms raw navigation state into display-friendly data
- Provides helper methods for common stack operations
- Handles loading and error states
- Uses dynamic require to avoid Metro bundler issues

---

#### Step 2: Create Stack Visualization Component

**File:** `packages/route-events/src/components/NavigationStack.tsx`

```typescript
/**
 * NavigationStack - Visual representation of current navigation stack
 */

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { macOSColors, ChevronUp } from '@react-buoy/shared-ui';
import { useNavigationStack } from '../useNavigationStack';

interface NavigationStackProps {
  style?: any;
}

export function NavigationStack({ style }: NavigationStackProps) {
  const {
    stack,
    focusedRoute,
    stackDepth,
    isAtRoot,
    isLoaded,
    error,
    navigateToIndex,
    goBack,
    popToTop,
  } = useNavigationStack();

  if (!isLoaded) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading navigation stack...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading stack</Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
        </View>
      </View>
    );
  }

  if (stack.length === 0) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No navigation stack</Text>
          <Text style={styles.emptySubtext}>Navigate to a route to see the stack</Text>
        </View>
      </View>
    );
  }

  const handleNavigate = (index: number) => {
    Alert.alert(
      'Navigate to Route',
      'This will navigate to the selected route in the stack.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Navigate', onPress: () => navigateToIndex(index) },
      ]
    );
  };

  const handleGoBack = () => {
    if (isAtRoot) {
      Alert.alert('Cannot Go Back', 'Already at the root of the stack');
      return;
    }
    goBack();
  };

  const handlePopToTop = () => {
    if (isAtRoot) {
      Alert.alert('Already at Top', 'Stack only has one screen');
      return;
    }

    Alert.alert(
      'Pop to Top',
      'This will remove all screens except the root screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pop to Top', style: 'destructive', onPress: popToTop },
      ]
    );
  };

  return (
    <View style={[styles.container, style]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Navigation Stack</Text>
        <View style={styles.headerStats}>
          <Text style={styles.statText}>{stackDepth} screen{stackDepth !== 1 ? 's' : ''}</Text>
          {focusedRoute && (
            <Text style={styles.focusedText}>Focused: {focusedRoute.name}</Text>
          )}
        </View>
      </View>

      {/* Stack visualization */}
      <ScrollView style={styles.stackScroll} contentContainerStyle={styles.stackContent}>
        {/* Render in reverse order (top of stack first) */}
        {[...stack].reverse().map((item, reverseIndex) => {
          const actualIndex = stack.length - 1 - reverseIndex;
          const isTop = actualIndex === stack.length - 1;
          const isBottom = actualIndex === 0;

          return (
            <View key={item.key} style={styles.stackItemWrapper}>
              {/* Stack position indicator */}
              {isTop && (
                <View style={styles.stackLabel}>
                  <ChevronUp size={12} color={macOSColors.text.muted} />
                  <Text style={styles.stackLabelText}>Top of Stack</Text>
                </View>
              )}

              {/* Stack item card */}
              <TouchableOpacity
                style={[
                  styles.stackItem,
                  item.isFocused && styles.stackItemFocused,
                ]}
                onPress={() => handleNavigate(actualIndex)}
                activeOpacity={0.7}
              >
                <View style={styles.stackItemHeader}>
                  <Text style={styles.stackItemPath} numberOfLines={1}>
                    {item.pathname}
                  </Text>
                  {item.isFocused && (
                    <View style={styles.focusedBadge}>
                      <Text style={styles.focusedBadgeText}>VISIBLE</Text>
                    </View>
                  )}
                  {!item.isFocused && (
                    <View style={styles.memoryBadge}>
                      <Text style={styles.memoryBadgeText}>IN MEMORY</Text>
                    </View>
                  )}
                </View>

                {/* Params display */}
                {Object.keys(item.params).length > 0 && (
                  <View style={styles.paramsContainer}>
                    <Text style={styles.paramsLabel}>Params:</Text>
                    <Text style={styles.paramsText} numberOfLines={2}>
                      {JSON.stringify(item.params, null, 2)}
                    </Text>
                  </View>
                )}

                {/* Position info */}
                <View style={styles.stackItemFooter}>
                  <Text style={styles.positionText}>
                    Position: {actualIndex} {isBottom && '(Root)'}
                  </Text>
                  <Text style={styles.keyText}>Key: {item.key.substring(0, 8)}...</Text>
                </View>
              </TouchableOpacity>

              {/* Stack position indicator */}
              {isBottom && (
                <View style={styles.stackLabel}>
                  <Text style={styles.stackLabelText}>Bottom of Stack</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* Action buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, isAtRoot && styles.actionButtonDisabled]}
          onPress={handleGoBack}
          disabled={isAtRoot}
        >
          <Text style={[styles.actionButtonText, isAtRoot && styles.actionButtonTextDisabled]}>
            ← Back
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, isAtRoot && styles.actionButtonDisabled]}
          onPress={handlePopToTop}
          disabled={isAtRoot}
        >
          <Text style={[styles.actionButtonText, isAtRoot && styles.actionButtonTextDisabled]}>
            Pop to Top
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: macOSColors.background.base,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  loadingText: {
    color: macOSColors.text.secondary,
    fontSize: 14,
    fontFamily: 'monospace',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  errorText: {
    color: macOSColors.semantic.error,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: 8,
  },

  errorDetail: {
    color: macOSColors.text.secondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },

  emptyText: {
    color: macOSColors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: 8,
  },

  emptySubtext: {
    color: macOSColors.text.secondary,
    fontSize: 14,
    fontFamily: 'monospace',
  },

  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
  },

  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: macOSColors.text.primary,
    fontFamily: 'monospace',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  statText: {
    fontSize: 12,
    color: macOSColors.text.secondary,
    fontFamily: 'monospace',
  },

  focusedText: {
    fontSize: 12,
    color: macOSColors.semantic.success,
    fontFamily: 'monospace',
  },

  stackScroll: {
    flex: 1,
  },

  stackContent: {
    padding: 16,
    gap: 8,
  },

  stackItemWrapper: {
    marginBottom: 8,
  },

  stackLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },

  stackLabelText: {
    fontSize: 10,
    color: macOSColors.text.muted,
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },

  stackItem: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: macOSColors.border.default,
  },

  stackItemFocused: {
    borderColor: macOSColors.semantic.success,
    backgroundColor: macOSColors.semantic.successBackground,
  },

  stackItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  stackItemPath: {
    fontSize: 14,
    fontWeight: '600',
    color: macOSColors.text.primary,
    fontFamily: 'monospace',
    flex: 1,
    marginRight: 8,
  },

  focusedBadge: {
    backgroundColor: macOSColors.semantic.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  focusedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: macOSColors.background.base,
    fontFamily: 'monospace',
  },

  memoryBadge: {
    backgroundColor: macOSColors.background.input,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },

  memoryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: macOSColors.text.secondary,
    fontFamily: 'monospace',
  },

  paramsContainer: {
    marginBottom: 8,
  },

  paramsLabel: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },

  paramsText: {
    fontSize: 11,
    color: macOSColors.text.primary,
    fontFamily: 'monospace',
    backgroundColor: macOSColors.background.input,
    padding: 8,
    borderRadius: 4,
  },

  stackItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  positionText: {
    fontSize: 11,
    color: macOSColors.text.muted,
    fontFamily: 'monospace',
  },

  keyText: {
    fontSize: 11,
    color: macOSColors.text.muted,
    fontFamily: 'monospace',
  },

  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
  },

  actionButton: {
    flex: 1,
    backgroundColor: macOSColors.background.input,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  actionButtonDisabled: {
    opacity: 0.5,
  },

  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: macOSColors.text.primary,
    fontFamily: 'monospace',
  },

  actionButtonTextDisabled: {
    color: macOSColors.text.muted,
  },
});
```

**Key features:**
- Visual stack representation with cards
- Clear indication of focused vs in-memory screens
- Display route params
- Show stack position and keys
- Interactive - tap to navigate
- Action buttons for stack manipulation
- Loading, error, and empty states

---

#### Step 3: Integrate Stack Tab into Modal

**File:** `packages/route-events/src/components/RouteEventsModalWithTabs.tsx`

**Changes needed:**

1. Add "Stack" to tab list
2. Import NavigationStack component
3. Update renderContent() to show NavigationStack for stack tab
4. Update TabType to include 'stack'

```typescript
type TabType = "routes" | "events" | "stack";

// In TabSelector
tabs={[
  {
    key: "routes",
    label: "Routes",
  },
  {
    key: "events",
    label: `Events${
      events.length > 0 && activeTab !== "events"
        ? ` (${events.length})`
        : ""
    }`,
  },
  {
    key: "stack",
    label: "Stack",
  },
]}

// In renderContent()
const renderContent = () => {
  if (activeTab === "routes") {
    return <RoutesSitemap style={styles.contentWrapper} />;
  }

  if (activeTab === "stack") {
    return <NavigationStack style={styles.contentWrapper} />;
  }

  // ... existing Events tab logic
};
```

---

#### Step 4: Export New Functionality

**File:** `packages/route-events/src/index.tsx`

```typescript
// Export navigation stack utilities
export { useNavigationStack } from './useNavigationStack';
export type {
  UseNavigationStackResult,
} from './useNavigationStack';

// Export navigation stack component
export { NavigationStack } from './components/NavigationStack';
```

---

#### Step 5: Testing

**Manual Testing Checklist:**

- [ ] Stack tab appears in modal
- [ ] Stack shows current screens
- [ ] Focused screen is highlighted
- [ ] Stack updates on navigation
- [ ] Tap screen to navigate works
- [ ] Back button works (when not at root)
- [ ] Back button disabled at root
- [ ] Pop to Top works (when stack > 1)
- [ ] Pop to Top disabled at root
- [ ] Params display correctly
- [ ] Stack position labels show
- [ ] Empty state shows when no stack
- [ ] Error state shows if store unavailable

---

## Future Enhancements (Phase 3)

### 🚀 Phase 3A: Enhanced Event Tracking

**Goal**: Add richer event data with action type inference

#### Features to Add:

- [ ] **Action Type Detection**
  - Infer PUSH, POP, REPLACE, NAVIGATE by comparing stack before/after
  - Color code events by type:
    - Green: PUSH, NAVIGATE (additive)
    - Red: POP, GO_BACK (destructive)
    - Yellow: REPLACE (mutation)
    - Blue: RESET (system)

- [ ] **Stack Diff Display**
  - Show "before" and "after" stack for each event
  - Highlight what changed (added/removed screens)
  - Visual diff representation

- [ ] **Event Metadata**
  - `triggeredBy`: Detect if from Link, imperative API, back button, or deep link
  - `duration`: Measure navigation completion time
  - `success`: Track if navigation succeeded or failed

#### Implementation:

**File:** `packages/route-events/src/RouteObserver.ts` (enhance)

```typescript
interface RouteChangeEvent {
  // Existing fields
  pathname: string;
  params: Record<string, string | string[]>;
  segments: string[];
  timestamp: number;

  // New fields
  type: 'PUSH' | 'POP' | 'REPLACE' | 'NAVIGATE' | 'RESET';
  stackBefore: RouteStackItem[];
  stackAfter: RouteStackItem[];
  metadata: {
    triggeredBy: 'link' | 'imperative' | 'back-button' | 'deep-link';
    duration?: number;
  };
}
```

**Detection logic:**
- Compare `stackBefore.length` vs `stackAfter.length`
- If increased → PUSH
- If decreased → POP
- If same but top changed → REPLACE
- Special cases: RESET (entire stack replaced), NAVIGATE (smart navigation)

---

### 🚀 Phase 3B: Performance Monitoring

**Goal**: Track navigation performance and identify slow transitions

#### Features to Add:

- [ ] **Navigation Timing**
  - Measure time from intent (button press) to completion
  - Track using `routingQueue` (intent) + `store.subscribe` (completion)
  - Store metrics for each navigation

- [ ] **Performance Dashboard**
  - Average navigation time
  - Slowest routes (>1000ms)
  - Performance chart/graph
  - Export performance data

- [ ] **Alerts**
  - Console warnings for slow navigations
  - Visual indicators in Events tab
  - Performance regression detection

#### Implementation:

**File:** `packages/route-events/src/PerformanceMonitor.ts` (new)

Based on `IMPLEMENTATION_PLAN.md:349-460`

**Integration:**
- Start monitor in RouteObserver
- Display metrics in new "Performance" tab or overlay
- Add "slow" badge to events in Events tab

---

### 🚀 Phase 3C: Deep Link Tracking

**Goal**: Track and visualize deep link behavior

#### Features to Add:

- [ ] **Deep Link Events**
  - Track initial URL (app launch)
  - Track incoming deep links (app in background/foreground)
  - Capture deep link → route mapping

- [ ] **Deep Link History**
  - Separate view/tab for deep link events
  - Show URL → Route resolution
  - Display deep link params
  - Source indicator (initial, background, foreground)

- [ ] **Testing Tools**
  - Simulate deep links from DevTools
  - Test URL schemes
  - Verify route resolution

#### Implementation:

**File:** `packages/route-events/src/DeepLinkTracker.ts` (new)

Based on `IMPLEMENTATION_PLAN.md:462-539`

---

### 🚀 Phase 3D: Analytics & Insights

**Goal**: Provide actionable insights about user navigation

#### Features to Add:

- [ ] **Analytics Dashboard**
  - Most visited routes
  - Average time per route
  - User flow visualization (Sankey diagram)
  - Exit points (where users leave)

- [ ] **Session Recording**
  - Record entire navigation session
  - Export as JSON
  - Replay navigation sequence
  - Share with team for debugging

- [ ] **Route Guards (Advanced)**
  - Block navigation based on conditions
  - Prompt user before navigating away
  - Redirect logic
  - Auth-based routing

#### Implementation:

**Files:**
- `RouteAnalytics.ts` - Analytics computation
- `AnalyticsDashboard.tsx` - UI component
- `SessionRecorder.ts` - Session capture and replay

---

### 🚀 Phase 3E: Visual Enhancements

**Goal**: Make DevTools more intuitive and beautiful

#### Features to Add:

- [ ] **Animations**
  - Smooth transitions between tabs
  - Stack cards slide in/out on navigation
  - Event list animations

- [ ] **Dark/Light Theme**
  - Toggle between themes
  - Match system preference
  - Custom color schemes

- [ ] **Customization**
  - Configurable stack layout (cards vs list)
  - Adjustable text size
  - Custom colors per route type

- [ ] **Accessibility**
  - Screen reader support
  - Keyboard navigation
  - High contrast mode

---

## Technical Architecture

### Current File Structure

```
packages/route-events/
├── src/
│   ├── RouteObserver.ts          ✅ Event tracking core
│   ├── useRouteObserver.ts       ✅ React hook for events
│   ├── RouteParser.ts            ✅ Route tree parser
│   ├── useRouteSitemap.ts        ✅ React hook for routes
│   ├── useNavigationStack.ts     🔨 IN PROGRESS (Stack hook)
│   ├── components/
│   │   ├── RouteEventsModalWithTabs.tsx   ✅ Main modal
│   │   ├── RouteEventDetailContent.tsx    ✅ Event detail view
│   │   ├── RouteFilterViewV2.tsx          ✅ Event filters
│   │   ├── RoutesSitemap.tsx              ✅ Routes tab
│   │   └── NavigationStack.tsx            🔨 IN PROGRESS (Stack tab)
│   └── index.tsx                 ✅ Package exports
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│  Expo Router (expo-router/build/global-state/)         │
├─────────────────────────────────────────────────────────┤
│  - router-store.ts                                      │
│    - store.state (navigation stack)                     │
│    - store.routeNode (route tree)                       │
│    - store.subscribe() (change listener)                │
│    - store.getRouteInfo() (current route)               │
└────────────┬────────────────────────────────────────────┘
             │
             │ subscribes to
             │
    ┌────────┴────────┐
    │                 │
    │                 │
    ▼                 ▼
┌───────────┐    ┌────────────┐
│ Route     │    │ Navigation │
│ Observer  │    │ Stack Hook │
└─────┬─────┘    └─────┬──────┘
      │                │
      │ events         │ stack state
      │                │
      ▼                ▼
┌─────────────────────────────┐
│  RouteEventsModalWithTabs   │
├─────────────────────────────┤
│  📍 Routes  │ 📋 Events  │ 🥞 Stack │
└─────────────────────────────┘
```

---

## Implementation Checklist

### ✅ Phase 1: Core Features (COMPLETE)

#### Routes Tab
- [x] RouteParser class with tree parsing
- [x] Route type detection (static, dynamic, etc.)
- [x] useRouteSitemap hook
- [x] RoutesSitemap UI component
- [x] Search and filter
- [x] Copy to clipboard
- [x] Navigate to routes
- [x] No emojis
- [x] Color-coded type tags
- [x] Package exports

#### Events Tab
- [x] RouteObserver class
- [x] useRouteObserver hook
- [x] Event storage (in memory)
- [x] Conversation grouping
- [x] Event detail view
- [x] Filter functionality
- [x] Play/pause monitoring
- [x] Clear events
- [x] AsyncStorage persistence

#### Modal Integration
- [x] Tab selector (Routes, Events)
- [x] State persistence
- [x] Header with actions
- [x] Footer for event detail
- [x] Back navigation

---

### 🔨 Phase 2: Stack Tab (IN PROGRESS)

#### Step 1: Hook Implementation
- [ ] Create useNavigationStack.ts
- [ ] Subscribe to store.state
- [ ] Transform routes into display items
- [ ] Implement helper methods (goBack, popToTop)
- [ ] Handle loading and error states

#### Step 2: UI Component
- [ ] Create NavigationStack.tsx
- [ ] Visual stack representation
- [ ] Focused screen highlighting
- [ ] Params display
- [ ] Stack position labels
- [ ] Interactive navigation
- [ ] Action buttons (Back, Pop to Top)

#### Step 3: Integration
- [ ] Add "stack" to TabType
- [ ] Update TabSelector with Stack tab
- [ ] Add NavigationStack to renderContent()
- [ ] Test tab switching
- [ ] Verify state persistence

#### Step 4: Testing
- [ ] Test stack display
- [ ] Test focused screen indication
- [ ] Test navigation actions
- [ ] Test button states (enabled/disabled)
- [ ] Test real-time updates
- [ ] Test error handling

#### Step 5: Documentation
- [ ] Add JSDoc comments
- [ ] Update package README
- [ ] Add usage examples
- [ ] Document API

---

### 🚀 Phase 3: Advanced Features (FUTURE)

#### Phase 3A: Enhanced Events
- [ ] Add action type detection (PUSH, POP, etc.)
- [ ] Implement stack diff
- [ ] Add metadata (triggeredBy, duration)
- [ ] Color code by action type
- [ ] Update RouteChangeEvent interface
- [ ] Update event detail view

#### Phase 3B: Performance Monitoring
- [ ] Create PerformanceMonitor class
- [ ] Track navigation timing
- [ ] Subscribe to routingQueue + store
- [ ] Compute metrics (average, slow routes)
- [ ] Create Performance tab/view
- [ ] Add performance badges to events

#### Phase 3C: Deep Link Tracking
- [ ] Create DeepLinkTracker class
- [ ] Track initial URL
- [ ] Listen for deep link events
- [ ] Map URL → Route
- [ ] Create Deep Links view
- [ ] Add deep link testing tools

#### Phase 3D: Analytics
- [ ] Create RouteAnalytics class
- [ ] Compute visit counts
- [ ] Calculate average time on page
- [ ] Build user flow visualization
- [ ] Create Analytics Dashboard
- [ ] Add export functionality

#### Phase 3E: Polish
- [ ] Add animations
- [ ] Implement theming
- [ ] Add customization options
- [ ] Improve accessibility
- [ ] Performance optimization
- [ ] Bundle size reduction

---

## Summary

### What We've Built (Phase 1)
1. **Routes Tab** - Complete sitemap of all app routes
2. **Events Tab** - Timeline of navigation events

### What We're Building Now (Phase 2)
3. **Stack Tab** - Real-time navigation stack visualization

### What We'll Build Next (Phase 3)
4. Enhanced event tracking with action types
5. Performance monitoring
6. Deep link tracking
7. Analytics and insights
8. Visual polish and animations

---

## Next Steps

1. ✅ Review this plan
2. 🔨 Implement useNavigationStack hook
3. 🔨 Create NavigationStack component
4. 🔨 Integrate into modal
5. 🔨 Test thoroughly
6. 🚀 Move to Phase 3 enhancements

**Estimated Time for Phase 2**: 4-6 hours

**Priority**: High - Completes the three-pillar architecture
