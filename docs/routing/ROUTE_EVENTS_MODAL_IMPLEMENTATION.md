# Route Events Modal Implementation Plan

## Overview

This document outlines the implementation plan for the Route Events modal, which will replicate the exact UX/UI structure from the Storage modal (`packages/storage/src/storage/components/StorageModalWithTabs.tsx`). The goal is to create an identical look, feel, and behavior while adapting the functionality for route event tracking.

## Reference Implementation

**Primary Reference**: `packages/storage/src/storage/components/StorageModalWithTabs.tsx` (lines 1-782)

The Storage modal provides the blueprint for:
- Modal structure with JsModal wrapper
- Tab-based navigation (Storage, Events)
- Action buttons (Play/Pause, Clear, Filter, Close)
- Event tracking and filtering system
- Card-based UI components
- State persistence using AsyncStorage

## Architecture Overview

### Component Hierarchy

```
RouteEventsModalWithTabs (NEW)
├── JsModal (@react-buoy/shared)
│   ├── ModalHeader
│   │   ├── Navigation (Back/Close)
│   │   ├── TabSelector (Routes, Events)
│   │   └── Actions (Filter, Play/Pause, Clear)
│   ├── Content (Tab-based rendering)
│   │   ├── RoutesBrowserMode (Routes Tab)
│   │   ├── RouteEventsList (Events Tab - Default)
│   │   └── RouteFilterView (Filter View)
│   └── Footer (Event navigation for detail view)
```

## Tab Structure

### 1. Routes Tab (Replaces "Storage" Tab)

**Purpose**: Display a sitemap of all application routes

**Component**: `RoutesBrowserMode.tsx`

**UI Structure**:
```
- Filter Cards (show route stats)
  - Total Routes
  - Active Route
  - Static Routes
  - Dynamic Routes

- Action Bar
  - Route count pill
  - Refresh button (re-scan routes)
  - Export button (copy route tree to clipboard)

- Routes List (scrollable)
  - Route cards grouped by:
    - Root routes (/, /settings, etc.)
    - Nested routes (/pokemon/[id], /profile/edit, etc.)
    - Modal routes (if applicable)
```

**Route Card Design** (similar to StorageKeyCard):
```
RouteCard
├── Header (touchable)
│   ├── Icon (NavigationIcon with route-specific color)
│   ├── Route Info
│   │   ├── Path (e.g., "/pokemon/[id]")
│   │   ├── Description (if available)
│   │   └── Badges
│   │       ├── Route Type Badge (Static/Dynamic/Modal)
│   │       └── Params Count Badge
│   └── Eye icon (expand/collapse)
└── Body (expandable)
    ├── Segments visualization (e.g., ["pokemon", "[id]"])
    ├── Available params (for dynamic routes)
    ├── Last visited timestamp
    └── Visit count (if tracked)
```

### 2. Events Tab

**Purpose**: Display route change events in real-time

**Component**: `RouteEventsList.tsx` (similar to Events view in StorageModalWithTabs)

**UI Structure**:

#### Event List View (Default)
```
- Empty State (when no events)
  - Icon: Navigation icon
  - Title: "No route events yet" or "Event listener is paused"
  - Subtitle: "Navigation events will appear here" or "Press play to start monitoring"

- Event Conversations List
  - Grouped by route path
  - Shows last event per route
  - Cards display:
    - Route path (e.g., "/pokemon/charizard")
    - Last navigation type (PUSH, POP, REPLACE, etc.)
    - Navigation count badge
    - Timestamp (relative time)
    - Params preview
```

#### Event Detail View (On conversation tap)
```
RouteEventDetailContent
├── View Toggle Cards
│   ├── Current State Card
│   │   - Show current route state
│   │   - Pathname, segments, params
│   │   - Navigation action badge
│   └── Diff View Card
│       - Compare two navigation events
│       - Show parameter changes
│       - Show segment changes
│
├── Content (based on selected view)
│   ├── Current State View
│   │   └── Route state card with DataViewer
│   └── Diff View
│       ├── Diff viewer tabs (Split View, Tree View)
│       ├── Compare picker (PREV vs CUR)
│       └── Diff visualization
│
└── Footer (external - rendered by modal)
    └── Navigation controls (Previous/Next event)
```

### 3. Filters View

**Purpose**: Manage route filtering patterns (same as Storage)

**Component**: `RouteFilterViewV2.tsx`

**UI Structure**:
```
DynamicFilterView (@react-buoy/shared)
├── Add Filter Section
│   - Input field for route pattern
│   - Placeholder: "Enter pattern (e.g., /settings)"
│   - Add button
│
├── Active Filters Section
│   - List of ignored route patterns
│   - Toggle chips for each pattern
│   - Examples:
│     - "/_sitemap" (ignore Expo Router internals)
│     - "/api/*" (ignore API routes)
│     - "/[...catchAll]" (ignore catch-all routes)
│
├── Available Routes Section
│   - Show all unique routes from events
│   - Quick-add to filters
│
└── How It Works Section
    - Explanation of pattern matching
    - Examples:
      - "/settings" → filters /settings, /settings/profile
      - "[id]" → filters all dynamic param routes
```

## Button Behaviors

### Action Buttons (in ModalHeader.Actions)

#### 1. Filter Button
- **Icon**: `<Filter />` from lucide-icons
- **Location**: Header actions area
- **State**:
  - Default: Secondary color
  - Active (filters applied): Info color with info background
- **Behavior**:
  - Click: Toggle filter view
  - Shows active filter count badge (if > 0)

#### 2. Play/Pause Button
- **Icon**: `<Play />` or `<Pause />` based on state
- **Location**: Header actions area
- **State**:
  - Playing: Green/success color with success background
  - Paused: Secondary color
- **Behavior**:
  - Click: Toggle route event monitoring
  - Persists state to AsyncStorage: `devToolsStorageKeys.routeEvents.isMonitoring()`
  - Auto-restores monitoring state on modal reopen

#### 3. Clear Button
- **Icon**: `<Trash2 />` from lucide-icons
- **Location**: Header actions area
- **Color**: Error/red color
- **Behavior**:
  - Click: Clear all route events
  - Resets selected conversation
  - No confirmation dialog (instant clear)

#### 4. Close Button
- **Icon**: `<X />` from lucide-icons
- **Location**: ModalHeader navigation area
- **Behavior**:
  - Click: Close modal
  - Calls `onClose()` prop

#### 5. Back Button (Contextual)
- **Icon**: `<ChevronLeft />` from lucide-icons
- **Location**: ModalHeader navigation area
- **Appears when**:
  - Viewing event detail (back to events list)
  - Viewing filters (back to events list)
- **Behavior**:
  - Event detail: Clear selected conversation
  - Filters: Hide filter view

## State Management

### Persisted State (AsyncStorage)

Using `devToolsStorageKeys` from `@react-buoy/shared`:

```typescript
// Active tab persistence
devToolsStorageKeys.routeEvents.activeTab()
// Values: "routes" | "events"

// Monitoring state persistence
devToolsStorageKeys.routeEvents.isMonitoring()
// Values: "true" | "false"

// Filter patterns persistence
devToolsStorageKeys.routeEvents.eventFilters()
// Value: JSON stringified string array

// Detail view preference
devToolsStorageKeys.routeEvents.detailView()
// Values: "current" | "diff"

// Diff viewer mode preference
devToolsStorageKeys.routeEvents.diffViewerMode()
// Values: "split" | "tree"

// Modal dimensions
devToolsStorageKeys.routeEvents.modal()
// or devToolsStorageKeys.modal.root() if shared
```

### Component State

```typescript
// Tab management
const [activeTab, setActiveTab] = useState<"routes" | "events">("events");

// Event tracking
const [events, setEvents] = useState<RouteChangeEvent[]>([]);
const [isListening, setIsListening] = useState(false);

// Event detail view
const [selectedConversationKey, setSelectedConversationKey] = useState<string | null>(null);
const [selectedEventIndex, setSelectedEventIndex] = useState(0);

// Filter management
const [showFilters, setShowFilters] = useState(false);
const [ignoredPatterns, setIgnoredPatterns] = useState<Set<string>>(
  new Set(["/_sitemap", "/api/*", "/__dev"])
);
```

## Data Structures

### RouteChangeEvent (from RouteObserver)

```typescript
export interface RouteChangeEvent {
  pathname: string;
  params: Record<string, string | string[]>;
  segments: string[];
  timestamp: number;
}
```

### RouteConversation (similar to StorageKeyConversation)

```typescript
interface RouteConversation {
  pathname: string;
  lastEvent: RouteChangeEvent;
  events: RouteChangeEvent[];
  totalNavigations: number;
  lastNavigationType: "PUSH" | "POP" | "REPLACE" | "NAVIGATE";
}
```

### RouteInfo (for Routes tab)

```typescript
interface RouteInfo {
  pathname: string;
  segments: string[];
  isDynamic: boolean;
  isModal: boolean;
  hasParams: boolean;
  paramNames: string[];
  description?: string;
  lastVisited?: Date;
  visitCount?: number;
}
```

## Styling & Colors

### Color Scheme (match Storage exactly)

```typescript
// Action colors (from macOSColors)
const actionColors = {
  push: macOSColors.semantic.success,      // Green
  pop: macOSColors.semantic.error,         // Red
  replace: macOSColors.semantic.warning,   // Orange
  navigate: macOSColors.semantic.info,     // Blue
};

// Card styling
const cardStyle = {
  backgroundColor: macOSColors.background.card,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: macOSColors.border.default,
  padding: 12,
  marginHorizontal: 16,
};

// Empty state
const emptyStateStyle = {
  iconSize: 48,
  iconColor: macOSColors.text.muted,
  titleColor: macOSColors.text.primary,
  subtitleColor: macOSColors.text.secondary,
};
```

### Font Styling

```typescript
const fontStyles = {
  monospace: "monospace",
  keyText: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "monospace",
  },
  actionText: {
    fontSize: 11,
    fontWeight: "600",
    fontFamily: "monospace",
    textTransform: "uppercase",
  },
  timestamp: {
    fontSize: 11,
    fontFamily: "monospace",
  },
};
```

## Implementation Phases

### Phase 1: Modal Structure & Tabs
**File**: `packages/route-events/src/components/RouteEventsModalWithTabs.tsx`

**Tasks**:
1. Create base modal structure using JsModal
2. Implement TabSelector with Routes/Events tabs
3. Add ModalHeader with contextual navigation
4. Set up state management (tabs, filters, monitoring)
5. Implement AsyncStorage persistence for all state
6. Add action buttons (Filter, Play/Pause, Clear)

**Reusable Components**:
- `JsModal` from `@react-buoy/shared`
- `ModalHeader` from `@react-buoy/shared`
- `TabSelector` from `@react-buoy/shared`
- `macOSColors` from `@react-buoy/shared`

### Phase 2: Events Tab Implementation
**Files**:
- `packages/route-events/src/components/RouteEventsList.tsx`
- `packages/route-events/src/components/RouteEventDetailContent.tsx`
- `packages/route-events/src/components/RouteEventCard.tsx`

**Tasks**:
1. Implement event conversation grouping logic
2. Create RouteEventCard component (similar to StorageKeyCard)
3. Build event detail view with toggle cards
4. Add diff viewer integration (split & tree views)
5. Implement event navigation footer
6. Add empty state component

**Reusable Components**:
- `DataViewer` from `@react-buoy/shared/dataViewer`
- `formatRelativeTime` from `@react-buoy/shared`
- `macOSColors` from `@react-buoy/shared`
- Lucide icons (Database, ChevronLeft, ChevronRight, etc.)

### Phase 3: Routes Tab Implementation
**Files**:
- `packages/route-events/src/components/RoutesBrowserMode.tsx`
- `packages/route-events/src/components/RouteCard.tsx`
- `packages/route-events/src/components/RouteFilterCards.tsx`
- `packages/route-events/src/utils/routeUtils.ts`

**Tasks**:
1. Implement route discovery/sitemap generation
2. Create RouteCard component
3. Build filter cards for route stats
4. Add route grouping logic (root, nested, modal)
5. Implement refresh/export functionality
6. Add route search/filtering

**Reusable Components**:
- `DataViewer` from `@react-buoy/shared/dataViewer`
- `EmptyState` patterns from Storage
- `macOSColors` and `gameUIColors` from `@react-buoy/shared`

### Phase 4: Filters Implementation
**File**: `packages/route-events/src/components/RouteFilterViewV2.tsx`

**Tasks**:
1. Create filter view wrapper
2. Configure DynamicFilterView for route patterns
3. Implement pattern matching logic
4. Add default filters for Expo Router internals
5. Persist filters to AsyncStorage

**Reusable Components**:
- `DynamicFilterView` from `@react-buoy/shared`
- `Filter` icon from lucide-icons

### Phase 5: Integration & Polish
**Tasks**:
1. Integrate RouteObserver with modal
2. Connect useRouteObserver hook
3. Test event tracking and filtering
4. Verify state persistence
5. Test all button interactions
6. Ensure exact visual match with Storage modal
7. Add animations and transitions (match Storage)

## File Structure

```
packages/route-events/src/
├── components/
│   ├── RouteEventsModalWithTabs.tsx    (Main modal - 780+ lines)
│   ├── RouteEventsList.tsx              (Events list view)
│   ├── RouteEventDetailContent.tsx      (Event detail view - 855+ lines)
│   ├── RouteEventDetailFooter.tsx       (Navigation footer)
│   ├── RouteEventCard.tsx               (Individual event card)
│   ├── RoutesBrowserMode.tsx            (Routes tab wrapper)
│   ├── RouteCard.tsx                    (Route display card)
│   ├── RouteFilterCards.tsx             (Stats filter cards)
│   ├── RouteFilterViewV2.tsx            (Filter management)
│   └── RouteSitemap.tsx                 (Route tree/sitemap component)
├── utils/
│   ├── routeUtils.ts                    (Route discovery & formatting)
│   ├── routePatternMatcher.ts           (Pattern matching for filters)
│   └── routeActionHelpers.ts            (Action translation/formatting)
├── types.ts                              (Type definitions)
├── RouteObserver.ts                      (Already exists)
├── useRouteObserver.ts                   (Already exists)
└── index.tsx                             (Exports)
```

## Key Differences from Storage Modal

### Adaptations Needed:

1. **Data Source**:
   - Storage: AsyncStorage queries from React Query cache
   - Routes: Two sources
     - **Static sitemap** – pulled via `loadRouteNode()` (internally reads `expo-router/build/global-state/router-store` → `store.routeNode` with `/src/` fallback). Missing dependencies log `[RouteEvents]` errors but keep the UI mounted.
     - **Live events** – `RouteObserver` fed by `useRouteObserver()` (same as before).

2. **Tab 1 Content**:
   - Storage: Shows all storage keys with required/optional status
   - Routes: Shows application route sitemap with static/dynamic indicators

3. **Event Types**:
   - Storage: setItem, removeItem, mergeItem, clear, multiSet, multiRemove
   - Routes: PUSH, POP, REPLACE, NAVIGATE (navigation actions)

4. **Color Coding**:
   - Storage: Green (set), Red (remove), Blue (merge)
   - Routes: Green (push), Red (pop), Orange (replace), Blue (navigate)

5. **Value Display**:
   - Storage: Shows stored data values (strings, objects, arrays)
   - Routes: Shows route parameters, segments, and navigation state

### What Stays Identical:

1. Modal structure and dimensions
2. Tab selector styling and behavior
3. Button positions and interactions
4. Card styling and animations
5. Empty state design
6. Filter view structure
7. Diff viewer integration
8. Event navigation footer
9. State persistence patterns
10. Overall layout and spacing

## Success Criteria

The implementation is complete when:

1. ✅ Modal opens/closes with identical animation to Storage
2. ✅ Tabs switch smoothly between Routes and Events
3. ✅ Play/Pause button correctly starts/stops route tracking
4. ✅ Events appear in real-time during navigation
5. ✅ Event cards match Storage event card styling exactly
6. ✅ Clicking event card shows detail view with toggle cards
7. ✅ Diff viewer works for comparing navigation events
8. ✅ Filter button opens filter view
9. ✅ Filters correctly hide matching routes from events list
10. ✅ Clear button removes all events instantly
11. ✅ Routes tab shows complete application sitemap
12. ✅ Route cards are expandable and show route details
13. ✅ All state persists across modal close/open
14. ✅ Back navigation works in all contexts
15. ✅ Visual appearance matches Storage modal pixel-perfect

## Testing Checklist

### Modal Behavior
- [ ] Opens/closes smoothly
- [ ] Persists position and size
- [ ] Supports all modal modes (floating, docked, fullscreen)
- [ ] Back button navigation works correctly

### Events Tab
- [ ] Shows empty state when no events
- [ ] Displays events in real-time
- [ ] Groups events by route correctly
- [ ] Event cards show correct information
- [ ] Clicking card opens detail view
- [ ] Detail view toggle cards work
- [ ] Diff viewer shows correct comparisons
- [ ] Event navigation (prev/next) works
- [ ] Play/pause button functions correctly
- [ ] Clear button removes all events

### Routes Tab
- [ ] Shows complete route sitemap
- [ ] Route cards display correctly
- [ ] Expandable routes show details
- [ ] Static/dynamic badges are correct
- [ ] Refresh button re-scans routes
- [ ] Export button copies route tree

### Filters
- [ ] Filter view opens/closes
- [ ] Can add custom patterns
- [ ] Can toggle existing patterns
- [ ] Patterns correctly filter events
- [ ] Available routes section shows all routes
- [ ] Filter state persists

### State Persistence
- [ ] Active tab persists
- [ ] Monitoring state persists
- [ ] Filter patterns persist
- [ ] Detail view preference persists
- [ ] Diff viewer mode persists
- [ ] Modal dimensions persist

## Notes

- The Storage modal has 782 lines - expect similar complexity
- StorageEventDetailContent has 855 lines - event detail will be similarly complex
- Reuse is key - most UI components already exist in `@react-buoy/shared`
- Focus on exact visual match first, then optimize
- All timestamps should use `formatRelativeTime` for consistency
- All monospace fonts should match Storage exactly
- All colors should come from `macOSColors` or `gameUIColors`
- No new UI patterns - replicate Storage patterns exactly
