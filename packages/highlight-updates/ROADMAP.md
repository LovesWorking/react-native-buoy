# Highlight Updates - Implementation Roadmap

Selected improvements to implement, prioritized and detailed.

---

## Selected Features

| # | Feature | Priority | Complexity |
|---|---------|----------|------------|
| 4 | "Why Did This Render?" Information | High | High |
| 6 | Session Comparison/Baseline | High | Medium |
| 8 | Export All Data to File | Medium | Low |
| 11 | Filters Apply to Everything (Overlay + List) | High | Medium |
| 13 | Filter by Render Count Range | Medium | Low |
| 18 | Click Overlay Badge → Jump to Detail | High | Medium |
| 19 | Settings Tab in Filter View | Medium | Low |
| 20 | Freeze Frame Mode | Medium | Medium |
| 22 | Copy All Button for Grouping Investigation | Low | Low |
| 26 | Better Batch Size Explanation | Low | Low |
| 32 | Show Tracking Limit Warning | Low | Low |

---

## Detailed Specifications

### 4. "Why Did This Render?" Information

**Goal**: Show WHY a component rendered, not just that it did.

**Render Causes to Detect**:
- Props changed
- State changed
- Context changed
- Parent re-rendered (propagation)
- Force update called

**Implementation**:

```typescript
// In HighlightUpdatesController.ts - extractComponentInfo()
interface RenderCause {
  type: 'props' | 'state' | 'context' | 'parent' | 'force' | 'unknown';
  details?: string; // e.g., "props.onClick changed"
}

function detectRenderCause(fiber: any): RenderCause {
  // Compare fiber.memoizedProps vs fiber.pendingProps
  // Check fiber.memoizedState vs current state
  // Check if parent fiber also rendered in same commit
}
```

**UI Changes**:
- Add "Render Cause" badge to `RenderListItem`
- Add "Render Causes" section in `RenderDetailView`
- Color code: Props=blue, State=purple, Parent=gray

**Files to Modify**:
- `HighlightUpdatesController.ts`
- `RenderTracker.ts` (add `renderCause` to `TrackedRender`)
- `RenderListItem.tsx`
- `RenderDetailView.tsx`

---

### 6. Session Comparison/Baseline

**Goal**: Compare render performance before/after optimization.

**Features**:
- "Save Baseline" button saves current stats
- Show delta when baseline exists
- Clear baseline option

**Data to Save**:
```typescript
interface Baseline {
  timestamp: number;
  name: string; // user-provided or auto "Baseline 1"
  components: Map<string, {
    renderCount: number;
    rendersPerSecond: number;
  }>;
  totals: {
    totalComponents: number;
    totalRenders: number;
    avgRendersPerSec: number;
  };
}
```

**UI**:
- Header shows: "↓15% fewer renders vs baseline"
- Detail view shows: "Was 50 renders, now 35 (-30%)"
- Baseline management in Settings tab

**Files to Modify**:
- `RenderTracker.ts` (add baseline storage)
- `StatsDisplay.tsx` (show comparison)
- `RenderDetailView.tsx` (show per-component delta)
- `HighlightFilterView.tsx` (baseline management in Settings)

---

### 8. Export All Data to File

**Goal**: Save complete render data to a named file for sharing/analysis.

**Export Format**:
```typescript
interface ExportedSession {
  name: string; // e.g., "redeem-rewards-flow"
  timestamp: string;
  duration: number; // session length in ms
  summary: {
    totalComponents: number;
    totalRenders: number;
    peakRendersPerSec: number;
  };
  components: Array<{
    displayName: string;
    viewType: string;
    testID?: string;
    nativeID?: string;
    componentName?: string;
    renderCount: number;
    firstRenderTime: string;
    lastRenderTime: string;
    rendersPerSecond: number;
    measurements?: { x, y, width, height };
  }>;
  renderEvents: Array<{
    timestamp: string;
    componentId: string;
    renderCause?: string;
  }>;
}
```

**UI**:
- "Export" button in header actions
- Prompt for session name (e.g., "redeem-rewards")
- Save as `{name}-{timestamp}.json`
- Share sheet on mobile

**Files to Modify**:
- `ModalHeaderContent.tsx` (add Export button)
- New `ExportUtils.ts`
- `HighlightUpdatesModal.tsx` (handle export action)

---

### 11. Filters Apply to Everything (Overlay + List)

**Goal**: Filters should affect both the visual overlay AND the render list. Currently filters only affect the list.

**Current Behavior**:
- Filters in `RenderTracker.getFilteredRenders()` only affect modal list
- `HighlightUpdatesController` draws ALL detected renders

**New Behavior**:
- Filters are the source of truth
- Overlay only shows highlights for non-filtered components
- List only shows non-filtered components
- This is the DEFAULT behavior (no toggle needed)

**Implementation**:

```typescript
// In HighlightUpdatesController.ts - handleTraceUpdates()

// Before drawing highlights, check if component passes filters
function shouldHighlight(stateNode: unknown): boolean {
  const componentInfo = extractComponentInfo(stateNode);
  return RenderTracker.passesFilters(componentInfo);
}

// In RenderTracker.ts
passesFilters(info: ComponentInfo): boolean {
  // Apply include patterns
  // Apply exclude patterns
  // Return true if should be shown
}
```

**Files to Modify**:
- `RenderTracker.ts` (add `passesFilters()` method)
- `HighlightUpdatesController.ts` (filter before highlighting)

---

### 13. Filter by Render Count Range

**Goal**: Show only components with render count in a specific range.

**UI in Filter View**:
```
RENDER COUNT RANGE
Min: [___5___]  Max: [___50___]
[Clear Range]
```

**Implementation**:

```typescript
// In RenderTracker.ts
interface FilterConfig {
  // ... existing filters
  minRenderCount?: number;
  maxRenderCount?: number;
}

// In getFilteredRenders()
if (this.filters.minRenderCount !== undefined) {
  renders = renders.filter(r => r.renderCount >= this.filters.minRenderCount!);
}
if (this.filters.maxRenderCount !== undefined) {
  renders = renders.filter(r => r.renderCount <= this.filters.maxRenderCount!);
}
```

**Files to Modify**:
- `RenderTracker.ts` (add to FilterConfig)
- `HighlightFilterView.tsx` (add range inputs)

---

### 18. Click Overlay Badge → Jump to Detail

**Goal**: Tap the render count badge on a highlighted component to open its detail view in the modal.

**Behavior**:
1. User taps the count badge (e.g., "15") on screen
2. Modal opens (if not already open)
3. Navigates directly to that component's detail view

**Implementation**:

```typescript
// HighlightUpdatesOverlay.tsx
// Change from pointerEvents="none" to conditionally interactive

<TouchableOpacity
  onPress={() => {
    // Emit event or call callback
    onBadgePress?.(rect.id); // nativeTag
  }}
  style={[styles.badge, { backgroundColor: rect.color }]}
>
  <Text style={styles.badgeText}>{rect.count}</Text>
</TouchableOpacity>
```

**Challenge**: The overlay has `pointerEvents="none"` to not block app interaction.

**Solution**: Only the badge areas are interactive, rest passes through:
```typescript
// Overlay container: pointerEvents="box-none"
// Highlight borders: pointerEvents="none"
// Badge only: pointerEvents="auto" (TouchableOpacity)
```

**Files to Modify**:
- `HighlightUpdatesOverlay.tsx` (make badges tappable)
- `HighlightUpdatesController.ts` (add callback for badge press)
- `preset.tsx` (connect to modal navigation)
- `HighlightUpdatesModal.tsx` (handle deep link to detail)

---

### 19. Settings Tab in Filter View

**Goal**: Add a Settings tab alongside Filters in the navbar.

**Current**:
```
[← Back]  [Filters]
```

**New**:
```
[← Back]  [Filters | Settings]
```

**Settings Tab Contents**:
- Show Render Count (toggle) - existing
- Batch Size (slider) - existing
- Highlight Duration (new)
- Color Palette (future)
- Baseline Management (from #6)
- Export/Import (from #8)

**Implementation**:

```typescript
// ModalHeaderContent.tsx - FilterViewHeader
const tabs = [
  { key: "filters", label: "Filters" },
  { key: "settings", label: "Settings" },
];

// HighlightFilterView.tsx - split into two views
{activeTab === "filters" ? (
  <FiltersContent ... />
) : (
  <SettingsContent ... />
)}
```

**Files to Modify**:
- `ModalHeaderContent.tsx` (update FilterViewHeader)
- `HighlightFilterView.tsx` (split content, add Settings view)
- `HighlightUpdatesModal.tsx` (update activeTab type)

---

### 20. Freeze Frame Mode

**Goal**: Pause highlight cleanup to analyze complex screens.

**Behavior**:
- "Freeze" button in header
- When frozen:
  - Highlights don't fade away
  - New renders still captured but don't clear old ones
  - Visual indicator that freeze is active
- "Unfreeze" resumes normal 1000ms cleanup

**Implementation**:

```typescript
// HighlightUpdatesController.ts
let isFrozen = false;

function freeze(): void {
  isFrozen = true;
  notifyFreezeListeners();
}

function unfreeze(): void {
  isFrozen = false;
  // Clear all current highlights
  if (highlightCallback) highlightCallback([]);
  notifyFreezeListeners();
}

// HighlightUpdatesOverlay.tsx
// Skip cleanup interval when frozen
useEffect(() => {
  if (isFrozen) return; // Don't set up cleanup

  cleanupTimerRef.current = setInterval(() => {
    // existing cleanup logic
  }, 50);

  return () => { ... };
}, [isFrozen]);
```

**UI**:
- Snowflake icon button in header (❄️)
- Blue background when frozen
- Badge showing "FROZEN" or frozen duration

**Files to Modify**:
- `HighlightUpdatesController.ts` (add freeze/unfreeze)
- `HighlightUpdatesOverlay.tsx` (respect frozen state)
- `ModalHeaderContent.tsx` (add freeze button)

---

### 22. Copy All Button for Grouping Investigation

**Goal**: Add "Copy All" button to export current render list as text for analysis and grouping design.

**Output Format**:
```
=== Render Data Export ===
Timestamp: 2024-01-15 14:32:15
Total Components: 45
Total Renders: 234

COMPONENTS BY RENDER COUNT (descending):
────────────────────────────────────────
1. ProductCard (RCTView) - 45 renders
   testID: product-card-123
   component: ProductCard

2. PriceLabel (RCTText) - 38 renders
   testID: price-label
   component: PriceLabel

3. View (RCTView) - 25 renders
   nativeID: container

... (all components)

BY VIEW TYPE:
────────────────────────────────────────
RCTView: 23 components, 156 total renders
RCTText: 15 components, 67 total renders
RCTImage: 7 components, 11 total renders

BY COMPONENT NAME:
────────────────────────────────────────
ProductCard: 5 instances, 89 total renders
Button: 8 instances, 34 total renders
(unknown): 12 instances, 45 total renders
```

**UI**:
- "Copy All" button in header (clipboard icon)
- Toast confirmation "Copied to clipboard"

**Files to Modify**:
- `ModalHeaderContent.tsx` (add Copy button)
- New `CopyUtils.ts` (format render data as text)
- `HighlightUpdatesModal.tsx` (handle copy action)

---

### 26. Better Batch Size Explanation

**Goal**: Help users understand what batch size means and its impact.

**Current UI**:
```
Batch Size: [150]
Maximum components to highlight per render update.
```

**New UI**:
```
Batch Size: [150]

Maximum components to highlight per render update.
Higher values capture more re-renders but may impact performance.

COVERAGE GUIDE:
  50  ████░░░░░░  Simple screens
  100 ██████░░░░  Typical screens
  150 ████████░░  Complex screens (recommended)
  250 ██████████  Full coverage

⚠️ Values above 200 may cause frame drops on older devices.
```

**Files to Modify**:
- `HighlightFilterView.tsx` (update batch size section)

---

### 32. Show Tracking Limit Warning

**Goal**: Warn users when approaching the 200 component limit.

**Current**: Silently drops oldest components when limit reached.

**New Behavior**:
- Show in StatsDisplay: "180/200 components"
- Warning color when >180
- Tooltip explaining what happens when limit reached
- Option to increase limit (with performance warning)

**Implementation**:

```typescript
// StatsDisplay.tsx
const isNearLimit = stats.totalComponents > 180;
const isAtLimit = stats.totalComponents >= 200;

<View style={[styles.headerChip, isNearLimit && styles.warningChip]}>
  <Text style={styles.headerChipValue}>
    {stats.totalComponents}/200
  </Text>
  <Text style={styles.headerChipLabel}>components</Text>
</View>
```

**Files to Modify**:
- `StatsDisplay.tsx` (show limit indicator)
- `RenderTracker.ts` (make MAX_TRACKED_COMPONENTS configurable)
- `HighlightFilterView.tsx` (setting to adjust limit)

---

## Implementation Order

### Phase 1: Quick Wins (1-2 days)
1. **#26** - Better batch size explanation
2. **#32** - Show tracking limit warning
3. **#22** - Copy all button
4. **#13** - Filter by render count range

### Phase 2: Core Improvements (3-5 days)
5. **#19** - Settings tab in filter view
6. **#11** - Filters apply to everything
7. **#8** - Export all data to file
8. **#20** - Freeze frame mode

### Phase 3: Advanced Features (5-7 days)
9. **#18** - Click overlay badge → jump to detail
10. **#6** - Session comparison/baseline
11. **#4** - "Why did this render?" information

---

## Notes

- All new settings should persist via `safeSetItem`/`safeGetItem`
- Follow existing code patterns (isolated components, memoization)
- Add appropriate `nativeID` props for devtools self-filtering
- Update IMPROVEMENTS.md to mark items as completed
