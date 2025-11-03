# Route Events Display Strategy

## Research Summary: How Routing Actually Works

After reviewing the React Navigation and Expo Router documentation, here's how routing works on mobile:

### The "Pringles Can" Model is CORRECT ✅

You're absolutely right! React Navigation uses a **stack-based architecture**:

```
┌─────────────┐
│  Detail [3] │ ← Top of stack (currently visible)
├─────────────┤
│  Profile[2] │ ← Hidden underneath
├─────────────┤
│  Home   [1] │ ← Bottom of stack
└─────────────┘
```

### Navigation State Structure

```typescript
{
  key: 'stack-12345',
  index: 2,  // Currently focused route (0-based)
  routes: [
    { key: 'home-1', name: 'home' },
    { key: 'profile-2', name: 'profile', params: { id: '123' } },
    { key: 'detail-3', name: 'detail', params: { id: '456' } }
  ]
}
```

### Navigation Actions and Their Effects

| Action | Effect on Stack | Example |
|--------|----------------|---------|
| **PUSH** | Add new screen to top | `[Home] → [Home, Profile]` |
| **NAVIGATE** | Smart: Go to if exists, else push | May reuse existing screen |
| **REPLACE** | Replace top screen | `[Home, Profile] → [Home, Detail]` |
| **POP** / **GO_BACK** | Remove top screen | `[Home, Profile] → [Home]` |
| **POP_TO** | Pop until specific screen | `[A,B,C,D] → [A,B]` |
| **POP_TO_TOP** | Pop to first screen | `[Home, Profile, Detail] → [Home]` |
| **RESET** | Replace entire stack | `[A,B,C] → [X,Y]` |

### Navigator Types

Different navigators behave differently:

1. **Stack Navigator** 🥞
   - Screens stack vertically
   - Only top screen is active
   - Back button pops from stack
   - **This is the "Pringles can" model**

2. **Tab Navigator** 📑
   - All tabs exist simultaneously
   - Switching tabs doesn't modify stack
   - Each tab can have its own stack

3. **Drawer Navigator** 🗄️
   - Similar to tabs
   - Drawer items can be accessed without stacking

---

## The Critical Distinction

### Events ≠ Stack State

There are TWO different concepts we need to display:

#### 1. Event History (Chronological Timeline)
**What it is**: A linear record of everything that happened
```
1. PUSH /home
2. PUSH /profile/123
3. PUSH /detail/456
4. POP (back button)
5. REPLACE /settings
6. GO_BACK
```

**Purpose**:
- Debugging navigation flows
- Analytics and user behavior
- Understanding what the user did
- Time-travel debugging

#### 2. Navigation Stack (Current State)
**What it is**: The current state of mounted screens
```
After the above events, stack is:
[Home, Settings]
     ↑ currently visible
```

**Purpose**:
- Understanding current app state
- Seeing what screens are mounted
- Memory debugging (which screens are kept alive)
- Visual representation of navigation hierarchy

---

## Recommended Display Strategy

### Overview

We need to show **THREE distinct views**:

1. **Routes Tab**: Static sitemap (all available routes)
2. **Events Tab**: Chronological event timeline (what happened)
3. **Stack Tab**: Current navigation stack state (what's mounted now)

---

## Tab 1: Routes (Sitemap)

**Purpose**: Show all available routes in the app

**Display Format**:
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

**Data Source**:
- Parse the app directory structure
- Use `expo-router/src/global-state/router-store` → `routeNode`
- Show route types (static, dynamic, modal, group)

**Features**:
- Search/filter routes
- Copy route path
- Navigate to route from devtools
- Show route params required

**Why This Matters**:
- Developers can see what routes exist
- Verify routing configuration
- Quick navigation during debugging
- Documentation for the team

---

## Tab 2: Events (Chronological Timeline)

**Purpose**: Show navigation events as they happen in order

**Display Format**:

### List View (Default)
```
🕐 10:23:45.123  PUSH      /pokemon/charizard
   params: { id: "charizard" }
   [View Details]

🕐 10:23:42.891  NAVIGATE  /home
   params: {}
   [View Details]

🕐 10:23:40.456  PUSH      /profile/123
   params: { id: "123" }
   [View Details]
```

### Detail View (On Click)
```
╔════════════════════════════════════════════════╗
║ Event #45 - PUSH                               ║
╠════════════════════════════════════════════════╣
║ Timestamp: 10:23:45.123                       ║
║ Type: PUSH                                     ║
║ Pathname: /pokemon/charizard                   ║
║ Segments: ["pokemon", "charizard"]            ║
║ Params: { id: "charizard", from: "collection" }║
║                                                ║
║ Stack Before: [/, /collection]                ║
║ Stack After:  [/, /collection, /pokemon/char] ║
║                                                ║
║ [◄ Previous Event] [Next Event ►]            ║
╚════════════════════════════════════════════════╝
```

**Data Structure**:
```typescript
interface RouteEvent {
  id: string;
  timestamp: number;
  type: 'PUSH' | 'POP' | 'REPLACE' | 'NAVIGATE' | 'RESET';
  pathname: string;
  segments: string[];
  params: Record<string, any>;
  stackBefore: RouteStackItem[];
  stackAfter: RouteStackItem[];
  metadata?: {
    triggeredBy: 'link' | 'imperative' | 'back-button' | 'deep-link';
    duration?: number; // ms to complete
  };
}
```

**Features**:
- Filter by event type (PUSH, POP, etc.)
- Search by pathname
- Time range filtering
- Export events as JSON
- Clear events
- Play/Pause recording

**Why Events Are Important**:
1. **Debugging**: See the sequence of navigation that led to a bug
2. **Analytics**: Track user navigation patterns
3. **Performance**: Measure navigation timing
4. **Reproduction**: Replay navigation sequences

**Key Insight**: Events are **append-only**. Even if you go back, the POP event is added to the timeline.

---

## Tab 3: Stack (Current Navigation State)

**Purpose**: Show the CURRENT navigation stack (what's mounted right now)

**Display Format**:

### Visual Stack Representation
```
╔══════════════════════════════════════╗
║  Stack State (3 screens mounted)     ║
╠══════════════════════════════════════╣
║                                      ║
║  ┌────────────────────────────────┐ ║
║  │ 🔵 /pokemon/charizard          │ ║ ← Currently Visible
║  │    params: { id: "charizard" } │ ║
║  │    [Remove] [Focus]            │ ║
║  └────────────────────────────────┘ ║
║           ↑ Top of Stack             ║
║                                      ║
║  ┌────────────────────────────────┐ ║
║  │ ⚪ /collection                 │ ║ ← Hidden (in memory)
║  │    params: {}                  │ ║
║  │    [Remove] [Focus]            │ ║
║  └────────────────────────────────┘ ║
║                                      ║
║  ┌────────────────────────────────┐ ║
║  │ ⚪ / (index)                   │ ║ ← Bottom of Stack
║  │    params: {}                  │ ║
║  │    [Remove] [Focus]            │ ║
║  └────────────────────────────────┘ ║
║           ↓ Bottom of Stack          ║
╚══════════════════════════════════════╝

[🔙 Go Back] [🏠 Pop to Top] [🔄 Reset Stack]
```

### Compact List View
```
Stack (3 screens):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 /pokemon/charizard  { id: "char" }
   /collection         {}
   /                   {}
```

**Data Structure**:
```typescript
interface RouteStackItem {
  key: string;           // Unique route key
  name: string;          // Route name
  pathname: string;      // Full path
  params: Record<string, any>;
  isFocused: boolean;    // Is currently visible
  index: number;         // Position in stack (0 = bottom)
}

interface NavigationStack {
  key: string;           // Navigator key
  index: number;         // Currently focused index
  routes: RouteStackItem[];
  type: 'stack' | 'tab' | 'drawer';
}
```

**Features**:
- See all screens currently in memory
- Identify which screen is visible
- Navigate to any screen in the stack
- Pop to specific screen
- Clear entire stack
- Show memory footprint (future)

**Why Stack View Is Critical**:
1. **Memory Debugging**: See what's kept alive
2. **State Understanding**: Know what screens exist
3. **Visual Representation**: "Where am I in the app?"
4. **Performance**: Identify if too many screens are stacked

---

## How They Work Together

### Example Scenario

**User Actions:**
```
1. App opens → /
2. Tap "Profile" → /profile
3. Tap "Settings" → /settings
4. Tap back button
5. Tap "Posts" → /posts
```

### Events Tab Would Show:
```
Event #5: PUSH /posts
Event #4: POP (back from /settings)
Event #3: PUSH /settings
Event #2: PUSH /profile
Event #1: NAVIGATE / (initial)
```

### Stack Tab Would Show:
```
Current Stack:
[/, /profile, /posts]
      ↑ focused
```

**Notice**: The stack doesn't have `/settings` anymore (it was popped), but the Events tab still shows it was visited.

---

## Implementation Plan

### Phase 1: Events Tab (Current Implementation) ✅

We already have this working! Just need to enhance it:

```typescript
interface RouteChangeEvent {
  pathname: string;
  params: Record<string, string | string[]>;
  segments: string[];
  timestamp: number;
}
```

**Enhancements Needed:**
1. Add event type (PUSH, POP, REPLACE, etc.)
2. Capture stack state before/after
3. Add metadata (triggeredBy, duration)

### Phase 2: Stack Tab (NEW) 🆕

**Data Source:**
```typescript
// From router-store
import { store } from 'expo-router/src/global-state/router-store';

const state = store.state; // NavigationState
const currentStack = state.routes;
const focusedIndex = state.index;
```

**Implementation:**
1. Subscribe to `store.subscribe()` (same as events)
2. On each change, capture `store.state.routes`
3. Display as a visual stack
4. Mark focused route with indicator

### Phase 3: Routes Tab (Sitemap) 📍

**Data Source:**
```typescript
// From router-store
const routeNode = store.routeNode;
// Parse this tree structure to build sitemap
```

**Implementation:**
1. Parse `routeNode` tree
2. Build hierarchical route list
3. Detect dynamic segments
4. Show route groups (tabs, drawers)

---

## Comparison: Events vs Stack

| Aspect | Events Tab | Stack Tab |
|--------|-----------|-----------|
| **What it shows** | What happened | What exists now |
| **Data type** | Append-only log | Current state snapshot |
| **Time** | Historical | Real-time |
| **Size** | Grows over time | Fixed (current stack only) |
| **Purpose** | Debugging, analytics | State visualization |
| **Analogy** | Git commit log | Current branch state |

---

## Recommended UI Flow

### Default View
- Open to **Events Tab** (most useful for tracking)
- Show event list with most recent at top
- Real-time updates as user navigates

### Stack Tab
- Click "Stack" tab to see current state
- Visual representation with clear focus indicator
- Buttons to manipulate stack (Go Back, Reset)

### Routes Tab
- Click "Routes" to see all available routes
- Useful for discovering what's possible
- Search and filter capabilities

---

## Technical Implementation Details

### Data Capture

```typescript
class RouteEventsTracker {
  private events: RouteEvent[] = [];
  private currentStack: RouteStackItem[] = [];

  start() {
    store.subscribe(() => {
      const route = store.getRouteInfo();
      const state = store.state;

      // Capture event
      const event: RouteEvent = {
        id: generateId(),
        timestamp: Date.now(),
        type: inferActionType(state, this.currentStack),
        pathname: route.pathname,
        segments: route.segments,
        params: route.params,
        stackBefore: [...this.currentStack],
        stackAfter: this.extractStack(state),
      };

      this.events.push(event);
      this.currentStack = event.stackAfter;
    });
  }

  private extractStack(state: NavigationState): RouteStackItem[] {
    return state.routes.map((route, index) => ({
      key: route.key,
      name: route.name,
      pathname: this.getPathname(route),
      params: route.params,
      isFocused: index === state.index,
      index,
    }));
  }

  private inferActionType(
    state: NavigationState,
    previousStack: RouteStackItem[]
  ): RouteEventType {
    const newStackSize = state.routes.length;
    const oldStackSize = previousStack.length;

    if (newStackSize > oldStackSize) return 'PUSH';
    if (newStackSize < oldStackSize) return 'POP';

    // Check if top route changed
    const topRoute = state.routes[state.routes.length - 1];
    const previousTopRoute = previousStack[previousStack.length - 1];

    if (topRoute?.key !== previousTopRoute?.key) return 'REPLACE';

    return 'NAVIGATE';
  }
}
```

---

## User Experience Guidelines

### Clarity Principles

1. **Make Stack State Obvious**
   - Use visual metaphors (stacking cards)
   - Clear focus indicators
   - Show what's hidden vs visible

2. **Events Should Tell a Story**
   - Chronological order (newest first)
   - Color code by action type
   - Show cause and effect

3. **Routes Should Be Discoverable**
   - Group by layout
   - Highlight dynamic routes
   - Show route hierarchy

### Visual Design

**Color Coding:**
- 🟢 PUSH / NAVIGATE: Green (additive actions)
- 🔴 POP / GO_BACK: Red (destructive actions)
- 🟡 REPLACE: Yellow (mutation)
- 🔵 RESET: Blue (system action)

**Typography:**
- Route paths: Monospace font
- Event times: Relative + absolute
- Parameters: Syntax highlighting

---

## Key Takeaways

1. **Routing IS a stack** - The Pringles can metaphor is correct
2. **Events ≠ Stack** - They show different things (history vs state)
3. **Both are essential** - Events for debugging, Stack for state
4. **Three tabs needed**: Routes (sitemap), Events (timeline), Stack (current state)

## Next Steps

1. ✅ Keep Events tab as-is (chronological)
2. 🆕 Add Stack tab (visual representation of current stack)
3. 🆕 Add Routes tab (app sitemap)
4. ✨ Enhance Events with action types and stack diff
5. ✨ Add interactive controls to Stack tab (Go Back, Reset, etc.)
