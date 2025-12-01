# Render Event Viewer - Planning Document

## Overview

This document outlines a plan to add event stepping and diff visualization tools to the Highlight Updates dev tool, inspired by the storage dev tools' event detail viewer.

## Current State

### What We Have Now

**Highlight Updates Modal:**
- List of tracked components with render counts
- Detail view showing: identifiers, measurements, timing, stats
- "Why Did This Render?" section with cause badges (PROPS, STATE, PARENT, etc.)
- Two-level causation: Component cause → Native cause

**What's Missing:**
- **No render history** - we only track the last render cause, not all renders
- **No event stepping** - can't navigate through render events like storage does
- **No diff view** - can't compare props/state between renders

### Storage Dev Tools Reference

The storage tool has a rich event detail viewer:
```
┌─────────────────────────────────────────────────┐
│  ┌──────────────┐  ┌──────────────┐            │
│  │ CURRENT VALUE│  │  DIFF VIEW   │            │
│  └──────────────┘  └──────────────┘            │
├─────────────────────────────────────────────────┤
│  DIFF VIEW MODE:                                │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  SPLIT VIEW  │  │  TREE VIEW   │            │
│  └──────────────┘  └──────────────┘            │
├─────────────────────────────────────────────────┤
│  COMPARE BAR:                                   │
│  ┌─ PREV ─────────────┐  ┌─ CUR ──────────────┐│
│  │ < #1/5 10:23:45.123│  │ #2/5 10:23:46.456 >││
│  │   (2s ago)         │  │   (1s ago)         ││
│  │   [SET]            │  │   [SET]            ││
│  └────────────────────┘  └────────────────────┘│
├─────────────────────────────────────────────────┤
│  TREE DIFF VIEWER:                              │
│   + 1  + count: 5 => 6                         │
│     2    name: "test"                          │
│   ≈ 3  ~ nested: { 2 keys }                    │
├─────────────────────────────────────────────────┤
│  ◄ Previous    Event 2 of 5    Next ►          │
└─────────────────────────────────────────────────┘
```

---

## Proposed Feature: Render Event Viewer

### UI Mockup

```
┌─────────────────────────────────────────────────┐
│ ◄  RENDER HISTORY: IncrementButton              │
│    View (RCTView) · 6 renders                   │
├─────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐            │
│  │ CURRENT STATE│  │  DIFF VIEW   │  ← Toggle  │
│  └──────────────┘  └──────────────┘            │
├─────────────────────────────────────────────────┤

  CURRENT STATE VIEW:
  ┌───────────────────────────────────────────────┐
  │ COMPONENT: IncrementButton                    │
  │ CAUSE: PARENT → PROPS                         │
  │                                               │
  │ PROPS (at render #4):                         │
  │ ┌─────────────────────────────────────────┐  │
  │ │ onPress: [function]                     │  │
  │ │ disabled: false                         │  │
  │ │ style: { backgroundColor: "#fff", ...}  │  │
  │ └─────────────────────────────────────────┘  │
  │                                               │
  │ 💡 The parent re-rendered, which caused      │
  │    new props to be passed (onPress, style).  │
  │    Consider: useCallback() for onPress       │
  └───────────────────────────────────────────────┘

  DIFF VIEW:
  ┌───────────────────────────────────────────────┐
  │ DIFF MODE:                                    │
  │ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
  │ │PROPS DIFF│ │STATE DIFF│ │FULL FIBER│      │
  │ └──────────┘ └──────────┘ └──────────┘      │
  ├───────────────────────────────────────────────┤
  │ COMPARE:                                      │
  │ ┌─ PREV (#3) ────────┐ ┌─ CUR (#4) ────────┐│
  │ │ < 10:23:45.123     │ │ 10:23:46.456 >    ││
  │ │   MOUNT            │ │   PARENT          ││
  │ └────────────────────┘ └────────────────────┘│
  ├───────────────────────────────────────────────┤
  │ PROPS DIFF:                                   │
  │   1    onPress: [function] => [function]     │ ← Reference changed!
  │ + 2  + disabled: false                       │
  │ ≈ 3  ~ style: { 3 keys }                     │
  │        └─ backgroundColor: "#eee" => "#fff"  │
  └───────────────────────────────────────────────┘

├─────────────────────────────────────────────────┤
│  ◄ Previous    Render 4 of 6    Next ►         │
│    10:23:46.456 · PARENT → PROPS               │
└─────────────────────────────────────────────────┘
```

---

## Data Model Changes

### Current TrackedRender (what we have)
```typescript
interface TrackedRender {
  id: string;
  nativeTag: number;
  viewType: string;
  displayName: string;
  testID?: string;
  nativeID?: string;
  componentName?: string;
  renderCount: number;
  firstRenderTime: number;
  lastRenderTime: number;
  measurements?: { x, y, width, height };
  color: string;
  lastRenderCause?: RenderCause;  // Only stores LAST cause
}
```

### Proposed: Add Render History
```typescript
interface RenderEvent {
  id: string;                    // Unique event ID
  timestamp: number;             // When this render occurred
  cause: RenderCause;            // Why it rendered

  // Captured state at this render (for diff)
  capturedProps?: Record<string, any>;
  capturedState?: any;

  // Optional: fiber snapshot for advanced debugging
  fiberSnapshot?: {
    memoizedProps: any;
    memoizedState: any;
  };
}

interface TrackedRender {
  // ... existing fields ...

  // NEW: Render event history
  renderHistory: RenderEvent[];  // Array of all render events
  maxHistorySize: number;        // Configurable limit (default: 20)
}
```

### Settings Update
```typescript
interface RenderTrackerSettings {
  // ... existing settings ...

  // NEW: History settings
  enableRenderHistory: boolean;     // Default: false (opt-in for perf)
  maxRenderHistoryPerComponent: number;  // Default: 20
  capturePropsOnRender: boolean;    // Default: false (expensive!)
  captureStateOnRender: boolean;    // Default: false
}
```

---

## What's Useful vs Not Useful

### Useful for Render Events

| Feature | Usefulness | Reason |
|---------|------------|--------|
| **Stepping through renders** | ✅ High | See how component evolved over time |
| **Props diff between renders** | ✅ High | Identify which props caused re-render |
| **State diff between renders** | ✅ High | Track state changes over time |
| **Cause comparison** | ✅ High | "Was this always PARENT or did it change?" |
| **Timestamp navigation** | ✅ Medium | Correlate with other events in app |
| **Tree diff viewer** | ✅ High | Perfect for nested props/state objects |
| **Split view** | ⚠️ Medium | Less useful for complex objects |
| **Full fiber snapshot** | ⚠️ Low | Too technical for most devs |

### Not Directly Applicable

| Feature | Why Not |
|---------|---------|
| **Action badges (SET, REMOVE)** | N/A - renders don't have "actions" |
| **Key navigation** | N/A - we navigate by component, not key |
| **Storage instance selector** | N/A - not applicable |

---

## Reusable Components

### Can Reuse from Storage

1. **TreeDiffViewer** (`@react-buoy/shared-ui/dataViewer`)
   - Perfect for comparing props/state objects
   - Already theme-aware and collapsible

2. **ThemedSplitView** (if needed for raw JSON)
   - Side-by-side comparison

3. **Event navigation footer pattern**
   - `◄ Previous | Event X of Y | Next ►`

4. **Compare bar UI pattern**
   - PREV/CUR selector with timestamps

5. **View toggle cards**
   - CURRENT VALUE | DIFF VIEW toggle

### Need to Build New

1. **RenderEventHistory** - Store/manage render events
2. **RenderHistoryViewer** - Main detail view with history
3. **RenderDiffView** - Diff visualization for props/state
4. **PropsCapturer** - Safely capture props at render time
5. **RenderEventNavigator** - Footer with event stepping

---

## Implementation Phases

### Phase 1: Data Foundation
- [ ] Add `RenderEvent` type
- [ ] Add `renderHistory` array to `TrackedRender`
- [ ] Add history settings to `RenderTrackerSettings`
- [ ] Update `RenderCauseDetector` to capture props/state snapshots
- [ ] Add configurable history limit
- [ ] Add memory management (circular buffer)

### Phase 2: Basic History UI
- [ ] Create `RenderHistoryViewer` component
- [ ] Add timeline/list of render events
- [ ] Show cause badges for each event
- [ ] Add event stepping footer (Previous/Next)
- [ ] Integrate with existing `RenderDetailView`

### Phase 3: Diff Visualization
- [ ] Create `RenderDiffView` component
- [ ] Add view toggle (Current State | Diff View)
- [ ] Integrate `TreeDiffViewer` for props diff
- [ ] Add compare bar for selecting any two events
- [ ] Add diff mode tabs (Props | State | Full)

### Phase 4: Polish & Performance
- [ ] Add settings toggle for history capture
- [ ] Optimize memory usage
- [ ] Add "clear history" action
- [ ] Add export history feature
- [ ] Performance testing with many renders

---

## Performance Considerations

### Memory Impact
- Each render event stores props snapshot (~1-5KB)
- 20 events × 100 components = 2-10MB worst case
- Mitigation: Opt-in, configurable limits, lazy capture

### CPU Impact
- Capturing props requires deep clone
- Mitigation: Only capture when modal is open + setting enabled

### Recommended Defaults
```typescript
{
  enableRenderHistory: false,        // Opt-in
  maxRenderHistoryPerComponent: 10,  // Keep last 10
  capturePropsOnRender: false,       // Don't capture by default
  captureStateOnRender: false,       // Don't capture by default
}
```

---

## Open Questions

1. **Should we capture ALL renders or only when modal is open?**
   - Recommendation: Only when modal open + history enabled

2. **How deep should props capture go?**
   - Recommendation: Shallow clone + JSON.stringify for nested

3. **Should we show function references in diff?**
   - Recommendation: Show `[function: onClick]` with stable ID check

4. **How to handle circular references in props?**
   - Recommendation: Use safe stringify with cycle detection

---

## Success Metrics

After implementing this feature, developers should be able to:

1. ✅ See the full render history of any component
2. ✅ Step through renders chronologically
3. ✅ Compare props/state between any two renders
4. ✅ Identify exactly which prop changed and triggered re-render
5. ✅ Get actionable optimization suggestions
6. ✅ Correlate render events with other app events by timestamp
