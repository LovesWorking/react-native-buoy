# Implementation Plan: "Why Did This Render?" Feature

## Overview

Add the ability to detect and display WHY a component rendered (props changed, state changed, hooks changed, parent re-rendered, or first mount).

---

## User Experience

### Settings Toggle (in Filter View → Settings Section)

```
┌─────────────────────────────────────────────────┐
│  ⚙️ SETTINGS                                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Show Render Count                    [Toggle]  │
│  Display render count badge on highlights.      │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Track Render Causes                  [Toggle]  │  ← NEW
│  Detect WHY components render (props, state,    │
│  hooks, parent). Adds ~2-5% performance         │
│  overhead. Requires "Show Render Count" on.     │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Batch Size                              [150]  │
│  ...                                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Render List Item - With Cause Badge

```
┌─────────────────────────────────────────────────┐
│  ProductCard                              15x   │
│  ┌──────┐                                       │
│  │ PROPS│  onClick, style                       │  ← Shows changed keys
│  └──────┘                                       │
│  testID: product-card-123                       │
│  Just now                                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  PriceLabel                               38x   │
│  ┌───────┐                                      │
│  │ PARENT│                                      │  ← Parent re-rendered
│  └───────┘                                      │
│  testID: price-label                            │
│  2s ago                                         │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  UserAvatar                                1x   │
│  ┌───────┐                                      │
│  │ MOUNT │                                      │  ← First mount
│  └───────┘                                      │
│  component: UserAvatar                          │
│  Just now                                       │
└─────────────────────────────────────────────────┘
```

### Render Detail View - With Cause Section

```
┌─────────────────────────────────────────────────┐
│  ← Back           Render Details                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ProductCard                                    │
│  RCTView                                        │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  WHY DID THIS RENDER?                   │   │  ← NEW SECTION
│  │                                         │   │
│  │  ┌──────┐                               │   │
│  │  │ PROPS│  Props changed                │   │
│  │  └──────┘                               │   │
│  │                                         │   │
│  │  Changed Keys:                          │   │
│  │  • onClick                              │   │
│  │  • style                                │   │
│  │  • data                                 │   │
│  │                                         │   │
│  │  💡 Tip: Consider using React.memo()   │   │
│  │     or useCallback for event handlers   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  IDENTIFIERS                                    │
│  ...                                            │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Data Model Changes

### 1. New Types (`RenderTracker.ts`)

```typescript
// Render cause types
export type RenderCauseType =
  | 'mount'      // First render
  | 'props'      // Props changed
  | 'state'      // State changed (class components)
  | 'hooks'      // Hooks changed (useState, useReducer, etc.)
  | 'context'    // Context changed (future)
  | 'parent'     // Parent component re-rendered
  | 'unknown';   // Could not determine

export interface RenderCause {
  type: RenderCauseType;
  changedKeys?: string[];    // For props: ["onClick", "style"]
  hookIndices?: number[];    // For hooks: [0, 2] = first and third hook
  timestamp: number;
}

// Update TrackedRender
export interface TrackedRender {
  // ... existing fields ...

  // NEW: Render cause tracking
  lastRenderCause?: RenderCause;
  renderCauseHistory?: RenderCause[];  // Optional: keep last N causes
}

// Update RenderTrackerSettings
export interface RenderTrackerSettings {
  batchSize: number;
  showRenderCount: boolean;
  performanceLogging: boolean;

  // NEW
  trackRenderCauses: boolean;  // Default: false (opt-in)
}
```

### 2. Previous State Storage (`HighlightUpdatesController.ts`)

```typescript
// Store previous fiber state for comparison
// Key: nativeTag, Value: previous fiber data
interface PreviousFiberState {
  memoizedProps: any;
  memoizedState: any;  // Hooks linked list for function components
  timestamp: number;
}

const previousFiberStates = new Map<number, PreviousFiberState>();

// Cleanup old entries periodically (> 30s old)
const STALE_THRESHOLD = 30000;
```

---

## Implementation Steps

### Phase 1: Core Detection Logic

#### File: `src/highlight-updates/utils/RenderCauseDetector.ts` (NEW)

```typescript
/**
 * RenderCauseDetector
 *
 * Detects WHY a component rendered by comparing current fiber state
 * to previously stored state.
 */

import { RenderCause, RenderCauseType } from './RenderTracker';

interface FiberState {
  memoizedProps: any;
  memoizedState: any;
}

// Storage for previous fiber states
const previousStates = new Map<number, FiberState>();
const CLEANUP_INTERVAL = 30000; // 30 seconds
const MAX_STORED_STATES = 500;

/**
 * Detect why a component rendered
 */
export function detectRenderCause(
  nativeTag: number,
  fiber: any,
  batchNativeTags: Set<number>
): RenderCause {
  const now = Date.now();

  if (!fiber) {
    return { type: 'unknown', timestamp: now };
  }

  const prev = previousStates.get(nativeTag);
  const current: FiberState = {
    memoizedProps: fiber.memoizedProps,
    memoizedState: fiber.memoizedState,
  };

  // Store current state for next comparison
  updateStoredState(nativeTag, current);

  // First mount detection
  if (!prev) {
    return { type: 'mount', timestamp: now };
  }

  // Props change detection
  const changedProps = getChangedKeys(prev.memoizedProps, current.memoizedProps);
  if (changedProps && changedProps.length > 0) {
    return {
      type: 'props',
      changedKeys: changedProps.slice(0, 10), // Limit to 10 keys
      timestamp: now
    };
  }

  // Hooks/State change detection
  const hookChanges = detectHookChanges(prev.memoizedState, current.memoizedState);
  if (hookChanges && hookChanges.length > 0) {
    return {
      type: 'hooks',
      hookIndices: hookChanges,
      timestamp: now
    };
  }

  // Parent re-rendered detection
  // Check if parent fiber's nativeTag is also in this batch
  const parentNativeTag = getParentNativeTag(fiber);
  if (parentNativeTag && batchNativeTags.has(parentNativeTag)) {
    return { type: 'parent', timestamp: now };
  }

  return { type: 'unknown', timestamp: now };
}

/**
 * Shallow compare object keys to find changes
 */
function getChangedKeys(prev: any, next: any): string[] | null {
  if (prev === next) return null;
  if (!prev || !next) return null;
  if (typeof prev !== 'object' || typeof next !== 'object') return null;

  const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const changed: string[] = [];

  for (const key of allKeys) {
    // Skip children prop (always changes)
    if (key === 'children') continue;

    if (prev[key] !== next[key]) {
      changed.push(key);
    }
  }

  return changed.length > 0 ? changed : null;
}

/**
 * Detect which hooks changed by walking the linked list
 */
function detectHookChanges(prevState: any, nextState: any): number[] | null {
  if (prevState === nextState) return null;
  if (!prevState || !nextState) return null;

  const changes: number[] = [];
  let prevHook = prevState;
  let nextHook = nextState;
  let index = 0;

  // Walk the hooks linked list
  while (nextHook !== null && index < 50) { // Safety limit
    if (prevHook === null) {
      // New hook added
      changes.push(index);
    } else if (didHookChange(prevHook, nextHook)) {
      changes.push(index);
    }

    nextHook = nextHook?.next;
    prevHook = prevHook?.next;
    index++;
  }

  return changes.length > 0 ? changes : null;
}

/**
 * Check if a single hook changed
 */
function didHookChange(prev: any, next: any): boolean {
  // Check memoizedState (useState, useReducer)
  if (prev.memoizedState !== next.memoizedState) {
    return true;
  }

  // Check baseState (useReducer)
  if (prev.baseState !== next.baseState) {
    return true;
  }

  return false;
}

/**
 * Get the nativeTag of the parent host component
 */
function getParentNativeTag(fiber: any): number | null {
  let parent = fiber?.return;
  let depth = 0;

  while (parent && depth < 50) {
    // Check if this is a host component with a stateNode
    if (parent.stateNode) {
      const tag = getNativeTagFromStateNode(parent.stateNode);
      if (tag != null) return tag;
    }
    parent = parent.return;
    depth++;
  }

  return null;
}

function getNativeTagFromStateNode(stateNode: any): number | null {
  if (stateNode.__nativeTag != null) return stateNode.__nativeTag;
  if (stateNode._nativeTag != null) return stateNode._nativeTag;
  if (stateNode.canonical?.__nativeTag != null) return stateNode.canonical.__nativeTag;
  return null;
}

/**
 * Update stored state with cleanup
 */
function updateStoredState(nativeTag: number, state: FiberState): void {
  // Enforce max limit
  if (previousStates.size >= MAX_STORED_STATES) {
    // Remove oldest 25%
    const entries = Array.from(previousStates.keys());
    for (let i = 0; i < MAX_STORED_STATES / 4; i++) {
      previousStates.delete(entries[i]);
    }
  }

  previousStates.set(nativeTag, state);
}

/**
 * Clear all stored states (call when tracking is disabled)
 */
export function clearRenderCauseState(): void {
  previousStates.clear();
}

/**
 * Get storage stats for debugging
 */
export function getRenderCauseStats(): { storedStates: number } {
  return { storedStates: previousStates.size };
}
```

---

### Phase 2: Integration with HighlightUpdatesController

#### File: `src/highlight-updates/utils/HighlightUpdatesController.ts`

Changes needed:

1. **Import the detector**:
```typescript
import {
  detectRenderCause,
  clearRenderCauseState
} from './RenderCauseDetector';
```

2. **In `handleTraceUpdates()`**:
```typescript
// After filtering nodes, before calling RenderTracker.trackRender()

// Collect all nativeTags in this batch for parent detection
const batchNativeTags = new Set<number>();
for (const { node } of nodesToDraw) {
  const tag = getNativeTag(node);
  if (tag != null) batchNativeTags.add(tag);
}

// Track renders with cause detection
RenderTracker.startBatch();
for (const { rect, stateNode, color, count } of validResults) {
  if (rect) {
    const componentInfo = extractComponentInfo(stateNode);
    const fiber = (stateNode as any)?.canonical?.internalInstanceHandle;

    // Detect render cause if enabled
    let renderCause: RenderCause | undefined;
    if (RenderTracker.getSettings().trackRenderCauses) {
      renderCause = detectRenderCause(rect.id, fiber, batchNativeTags);
    }

    RenderTracker.trackRender({
      nativeTag: rect.id,
      viewType: componentInfo.viewType,
      // ... existing fields ...
      renderCause,  // NEW
    });
  }
}
RenderTracker.endBatch();
```

3. **In `disable()`**:
```typescript
function disable(): void {
  // ... existing code ...

  // Clear render cause storage
  clearRenderCauseState();
}
```

---

### Phase 3: RenderTracker Updates

#### File: `src/highlight-updates/utils/RenderTracker.ts`

1. **Add types** (from Data Model section above)

2. **Update `trackRender()` method**:
```typescript
trackRender(data: {
  // ... existing fields ...
  renderCause?: RenderCause;
}): void {
  // ... existing code ...

  if (existing) {
    // Update render cause
    if (data.renderCause) {
      existing.lastRenderCause = data.renderCause;
    }
  } else {
    const newRender: TrackedRender = {
      // ... existing fields ...
      lastRenderCause: data.renderCause,
    };
  }
}
```

3. **Update default settings**:
```typescript
private settings: RenderTrackerSettings = {
  batchSize: DEFAULT_BATCH_SIZE,
  showRenderCount: true,
  performanceLogging: false,
  trackRenderCauses: false,  // NEW - opt-in
};
```

---

### Phase 4: UI Components

#### 4.1 RenderCauseBadge Component (NEW)

**File**: `src/highlight-updates/components/RenderCauseBadge.tsx`

```typescript
/**
 * RenderCauseBadge
 *
 * Displays a colored badge indicating why a component rendered.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { macOSColors } from '@react-buoy/shared-ui';
import type { RenderCause, RenderCauseType } from '../utils/RenderTracker';

// Badge configuration for each cause type
const CAUSE_CONFIG: Record<RenderCauseType, {
  label: string;
  color: string;
  tip?: string;
}> = {
  mount: {
    label: 'MOUNT',
    color: macOSColors.semantic.success,
    tip: 'First render of this component',
  },
  props: {
    label: 'PROPS',
    color: macOSColors.semantic.warning,
    tip: 'Props changed. Consider React.memo() or useCallback.',
  },
  state: {
    label: 'STATE',
    color: '#a855f7', // purple
    tip: 'Component state changed',
  },
  hooks: {
    label: 'HOOKS',
    color: '#ec4899', // pink
    tip: 'Hook values changed (useState, useReducer, etc.)',
  },
  context: {
    label: 'CONTEXT',
    color: '#06b6d4', // cyan
    tip: 'React context value changed',
  },
  parent: {
    label: 'PARENT',
    color: macOSColors.text.secondary,
    tip: 'Parent component re-rendered. Consider React.memo().',
  },
  unknown: {
    label: '?',
    color: macOSColors.text.muted,
    tip: 'Could not determine render cause',
  },
};

interface RenderCauseBadgeProps {
  cause: RenderCause;
  compact?: boolean;
  showKeys?: boolean;  // Show changed keys inline
}

export function RenderCauseBadge({
  cause,
  compact = false,
  showKeys = false,
}: RenderCauseBadgeProps) {
  const config = CAUSE_CONFIG[cause.type];

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={[
        styles.badge,
        compact && styles.badgeCompact,
        { backgroundColor: config.color + '20' }
      ]}>
        <Text style={[
          styles.badgeText,
          compact && styles.badgeTextCompact,
          { color: config.color }
        ]}>
          {config.label}
        </Text>
      </View>

      {showKeys && cause.changedKeys && cause.changedKeys.length > 0 && (
        <Text
          style={[styles.keysText, compact && styles.keysTextCompact]}
          numberOfLines={1}
        >
          {cause.changedKeys.join(', ')}
        </Text>
      )}

      {showKeys && cause.hookIndices && cause.hookIndices.length > 0 && (
        <Text
          style={[styles.keysText, compact && styles.keysTextCompact]}
          numberOfLines={1}
        >
          Hook {cause.hookIndices.join(', ')}
        </Text>
      )}
    </View>
  );
}

// Export config for use in detail view
export { CAUSE_CONFIG };

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  containerCompact: {
    gap: 4,
  },
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  badgeCompact: {
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeTextCompact: {
    fontSize: 9,
  },
  keysText: {
    fontSize: 11,
    color: macOSColors.text.secondary,
    fontFamily: 'monospace',
    flex: 1,
  },
  keysTextCompact: {
    fontSize: 10,
  },
});
```

#### 4.2 Update RenderListItem

**File**: `src/highlight-updates/components/RenderListItem.tsx`

Add render cause badge below component name:

```tsx
{render.lastRenderCause && (
  <RenderCauseBadge
    cause={render.lastRenderCause}
    compact
    showKeys
  />
)}
```

#### 4.3 Update RenderDetailView

**File**: `src/highlight-updates/components/RenderDetailView.tsx`

Add new "Why Did This Render?" section:

```tsx
{/* Why Did This Render Section */}
{render.lastRenderCause && (
  <View style={styles.section}>
    <SectionHeader>
      <SectionHeader.Title>WHY DID THIS RENDER?</SectionHeader.Title>
    </SectionHeader>

    <View style={styles.causeContainer}>
      <RenderCauseBadge cause={render.lastRenderCause} />

      {render.lastRenderCause.changedKeys && (
        <View style={styles.changedKeysContainer}>
          <Text style={styles.changedKeysTitle}>Changed Props:</Text>
          {render.lastRenderCause.changedKeys.map((key) => (
            <Text key={key} style={styles.changedKey}>• {key}</Text>
          ))}
        </View>
      )}

      {render.lastRenderCause.hookIndices && (
        <View style={styles.changedKeysContainer}>
          <Text style={styles.changedKeysTitle}>Changed Hooks:</Text>
          {render.lastRenderCause.hookIndices.map((idx) => (
            <Text key={idx} style={styles.changedKey}>• Hook #{idx}</Text>
          ))}
        </View>
      )}

      {/* Optimization tip */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipIcon}>💡</Text>
        <Text style={styles.tipText}>
          {CAUSE_CONFIG[render.lastRenderCause.type].tip}
        </Text>
      </View>
    </View>
  </View>
)}
```

#### 4.4 Update HighlightFilterView (Settings Section)

**File**: `src/highlight-updates/components/HighlightFilterView.tsx`

Add new toggle in Settings section (after Show Render Count):

```tsx
{/* Track Render Causes Toggle - NEW */}
<View style={[styles.settingItem, styles.settingItemSpaced]}>
  <View style={styles.settingHeader}>
    <Text style={styles.settingLabel}>Track Render Causes</Text>
    <Switch
      value={settings.trackRenderCauses}
      onValueChange={(value) => onSettingsChange({ trackRenderCauses: value })}
      trackColor={{
        false: macOSColors.background.input,
        true: macOSColors.semantic.warning + "80",
      }}
      thumbColor={settings.trackRenderCauses ? macOSColors.semantic.warning : macOSColors.text.muted}
      disabled={!settings.showRenderCount}  // Requires render count
    />
  </View>
  <Text style={styles.settingDescription}>
    Detect WHY components render (props, state, hooks, parent).
    {!settings.showRenderCount && (
      <Text style={{ color: macOSColors.semantic.warning }}>
        {'\n'}⚠️ Requires "Show Render Count" to be enabled.
      </Text>
    )}
  </Text>
  <Text style={[styles.settingDescription, { marginTop: 4, fontStyle: 'italic' }]}>
    Adds ~2-5% performance overhead. Stores previous component state in memory.
  </Text>
</View>
```

---

## File Summary

| File | Action | Description |
|------|--------|-------------|
| `RenderCauseDetector.ts` | **NEW** | Core detection logic |
| `RenderTracker.ts` | MODIFY | Add types, update trackRender() |
| `HighlightUpdatesController.ts` | MODIFY | Integrate detector, pass to tracker |
| `RenderCauseBadge.tsx` | **NEW** | Badge component for cause display |
| `RenderListItem.tsx` | MODIFY | Add cause badge |
| `RenderDetailView.tsx` | MODIFY | Add "Why Did This Render?" section |
| `HighlightFilterView.tsx` | MODIFY | Add settings toggle |
| `index.tsx` | MODIFY | Export new types |

---

## Testing Plan

1. **Enable tracking without cause detection** → Should work as before
2. **Enable cause detection** → Badge should appear on list items
3. **First mount** → Should show "MOUNT" badge
4. **Props change** → Should show "PROPS" with changed keys
5. **Parent re-render** → Should show "PARENT" badge
6. **Disable tracking** → Should clear stored state (no memory leak)
7. **Performance test** → Compare with/without cause detection

---

## Known Limitations

1. **Host components only**: We receive stateNodes for host components (RCTView, RCTText), not the React component that caused the render. The detection is still useful but not as precise as React DevTools.

2. **Hook indices, not names**: We can detect "Hook #0 changed" but not "useState changed" - same as React DevTools limitation.

3. **Context detection is hard**: Would require walking fiber.dependencies which is complex. Marked as "future" for now.

4. **Parent detection relies on batch**: If parent and child are in different batches (rare), parent won't be detected.

5. **Memory overhead**: Stores previous props/state for each tracked component. Limited to 500 entries with cleanup.

---

## Performance Considerations

- **Opt-in by default**: Setting is disabled by default
- **Gated behind showRenderCount**: If user disabled render counting, cause detection is also disabled
- **Shallow comparison only**: We use `!==` comparison, not deep equality
- **Limited storage**: Max 500 previous states with automatic cleanup
- **Skip children prop**: Always changes, not useful to report

---

## Questions for Review

1. **Should we show cause history?** (last 5 causes vs just the most recent)
2. **Should cause badges appear on the overlay?** (next to render count)
3. **Do we want to add a "Copy Debug Info" button** that exports cause data?
4. **Should we integrate with the future "Export" feature** to include causes?

---

## Approval Checklist

- [ ] Data model looks good
- [ ] UI placement is correct
- [ ] Settings toggle behavior is clear
- [ ] Performance concerns addressed
- [ ] Ready to implement
