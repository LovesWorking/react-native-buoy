# AGENTS.md

## Project Overview

This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Critical Rules

### Development Server Management

**NEVER kill, restart, or start the development server (Expo/Metro) unless explicitly asked by the user.**

- Do NOT use `pkill`, `kill`, `lsof -ti`, or similar commands to stop dev servers
- Do NOT run `npx expo start` or `npm start` unless specifically requested
- The user manages their own dev server - assume it's already running
- If you need to verify something is working, ask the user to test it instead of restarting the server

#### DevTools Integration

- **React Native DevTools**: Use MCP `open_devtools` command to launch debugging tools
- **Network Inspection**: Monitor API calls and network requests in DevTools
- **Element Inspector**: Debug component hierarchy and styles
- **Performance Profiler**: Identify performance bottlenecks
- **Logging**: Use `console.log` for debugging (remove before production), `console.warn` for deprecation notices, `console.error` for actual errors, and implement error boundaries for production error handling

### Testing & Quality Assurance

#### Automated Testing with MCP Tools

- **Component Testing**: Add `testID` props to components for automation
- **Visual Testing**: Use MCP `automation_take_screenshot` to verify UI appearance
- **Interaction Testing**: Use MCP `automation_tap_by_testid` to simulate user interactions
- **View Verification**: Use MCP `automation_find_view_by_testid` to validate component rendering

## Reusable Shared Components

**CRITICAL: Always reuse components from `@react-buoy/shared-ui` instead of creating custom implementations.**

The goal is to maintain consistency across all dev tools by using the same shared components. Never recreate functionality that already exists in the shared package.

### Import Pattern

```typescript
import { ComponentName } from "@react-buoy/shared-ui";
import { DataViewer } from "@react-buoy/shared-ui/dataViewer";
```

### Essential Components to Reuse

#### Data Display Components

**DataViewer** - Interactive JSON/object viewer
- **Path**: `@react-buoy/shared-ui/dataViewer`
- **Use Case**: Display any structured data (objects, arrays, JSON)
- **Features**: Expandable tree, syntax highlighting, type indicators, copy individual values
- **Never**: Use plain `JSON.stringify()` with `<Text>` for displaying objects
- **Example**:
  ```typescript
  import { DataViewer } from "@react-buoy/shared-ui/dataViewer";

  <DataViewer
    data={myObject}
    title="Parameters"
    showTypeFilter={false}
  />
  ```

**DataInspector** - Compact data inspector
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Similar to DataViewer but more compact
- **When to use**: Smaller spaces, inline data inspection

#### Copy Functionality

**InlineCopyButton** - Small copy button with visual feedback (12px)
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Inline copy actions next to values, compact UIs
- **Features**: Shows checkmark on success, error icon on failure
- **Never**: Use manual `copyToClipboard()` with `Alert.alert()` for user feedback
- **Example**:
  ```typescript
  import { InlineCopyButton } from "@react-buoy/shared-ui";

  <InlineCopyButton
    value={routePath}
    buttonStyle={styles.compactButton}
  />
  ```

**ToolbarCopyButton** - Medium copy button for toolbars (14px)
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Header bars, toolbars

**ActionCopyButton** - Large copy button for main actions (18px)
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Primary copy actions, prominent buttons

**CopyButton** - Base copy button (customizable size)
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Custom size requirements
- **Props**: `value`, `size`, `buttonStyle`, `onCopySuccess`, `onCopyError`

#### Badges & Status Indicators

**Badge** - Base badge component
- **Path**: `@react-buoy/shared-ui`
- **Variants**: `StatusBadge`, `CountBadge`, `TypeBadge`, `MethodBadge`
- **Use Case**: Display status, counts, types, HTTP methods

**StatusIndicator** - Colored status dot with label
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Visual status indicators (active, error, success, warning)

**ValueTypeBadge** - Type indicator for values
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Show data types (string, number, boolean, etc.)

#### Layout & Structure

**TabSelector** - Tab navigation component
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Multiple tab views (Routes/Events/Stack)
- **Features**: Active state, smooth transitions

**CollapsibleSection** - Expandable/collapsible section
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Expandable content areas

**CompactRow** - Compact list row with status
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: List items with status indicators, expandable content
- **Features**: Status dot, labels, expandable content, glow effects

**ListItem** - Standard list item
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Simple list items

**SectionHeader** - Section header with title
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Section titles, dividers

**ModalHeader** - Modal header with title and close button
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Modal dialogs

**DraggableHeader** - Draggable header for floating modals
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Floating dev tools, draggable panels

#### Search & Filtering

**SearchBar** - Search input component
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Search functionality with clear button

**HeaderSearchButton** - Compact search button for headers
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Toggle search mode in headers

**CompactFilterChips** - Filter chip selector
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Multiple filter options (All, Missing, Issues)

**DynamicFilterView** - Dynamic filter configuration
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Advanced filtering with multiple criteria

**FilterComponents** - Filter UI components
- **Path**: `@react-buoy/shared-ui`
- **Components**: `FilterSection`, `FilterBadge`, `AddFilterInput`, `AddFilterButton`, `FilterList`

#### Empty States

**EmptyState** - Base empty state component
- **Path**: `@react-buoy/shared-ui`
- **Variants**: `NoDataEmptyState`, `NoResultsEmptyState`, `NoSearchResultsEmptyState`
- **Use Case**: Empty lists, no data scenarios

#### Utility Components

**TimeDisplay** - Formatted time display
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Display timestamps, durations

**StatsCard** - Statistics card
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Display metrics, counts, statistics

**BackButton** - Navigation back button
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Navigation headers

**DetailView** - Detail view container
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Full-screen detail views

**EventListItem** - Event list item
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Display events in lists (network requests, route changes)

### Design System

#### Colors

**macOSColors** - macOS-inspired color system
- **Path**: `@react-buoy/shared-ui`
- **Categories**: `background`, `text`, `border`, `semantic`
- **Example**:
  ```typescript
  import { macOSColors } from "@react-buoy/shared-ui";

  backgroundColor: macOSColors.background.card
  color: macOSColors.text.primary
  borderColor: macOSColors.border.default
  ```

**gameUIColors** - Game UI color system
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Gaming-style UI elements

**dialColors** - Dial/gauge colors
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Performance indicators, gauges

#### Icons

**Lucide Icons** - Icon library
- **Path**: `@react-buoy/shared-ui`
- **Available**: `Copy`, `CheckCircle2`, `AlertTriangle`, `Search`, `ChevronDown`, `ChevronRight`, `Info`, `Database`, `RefreshCw`, `Trash2`, and many more
- **Example**:
  ```typescript
  import { Copy, CheckCircle2 } from "@react-buoy/shared-ui";

  <Copy size={16} color={macOSColors.text.secondary} />
  ```

### Utilities

#### Clipboard

**copyToClipboard** - Copy utility function
- **Path**: `@react-buoy/shared-ui`
- **Use Case**: Programmatic copy (without visual feedback)
- **Returns**: `Promise<boolean>` - success status
- **Note**: For UI copy buttons, use `InlineCopyButton` instead

#### Formatting

**displayValue**, **parseDisplayValue** - Value formatting
**formatValue**, **parseValue** - Value parsing
**truncateText** - Text truncation
**flattenObject** - Object flattening
**formatPath** - Path formatting

#### Type Helpers

**getValueType** - Get value type
**isPrimitive** - Check if primitive
**isJsonSerializable** - Check JSON serializability
**getConstructorName** - Get constructor name
**isEmpty** - Check if empty
**getValueSize** - Get value size

### Best Practices

1. **Always search shared components first** before creating new ones
2. **Use DataViewer** instead of `JSON.stringify()` for displaying objects
3. **Use InlineCopyButton** instead of manual copy implementations with Alerts
4. **Use macOSColors** for consistent color scheme across all tools
5. **Use TabSelector** for multi-tab interfaces
6. **Use CompactRow** for expandable list items with status
7. **Reuse filter components** instead of creating custom filters
8. **Use empty state variants** for consistent empty experiences

### Example: Before & After

**Before (Bad - Manual Implementation):**
```typescript
// DON'T DO THIS
const handleCopy = async () => {
  const success = await copyToClipboard(data);
  if (!success) {
    Alert.alert("Error", "Failed to copy");
  }
};

<TouchableOpacity onPress={handleCopy}>
  <Copy size={16} />
</TouchableOpacity>

// Displaying object data
<Text>{JSON.stringify(params, null, 2)}</Text>
```

**After (Good - Reusing Shared Components):**
```typescript
// DO THIS
import { InlineCopyButton } from "@react-buoy/shared-ui";
import { DataViewer } from "@react-buoy/shared-ui/dataViewer";

<InlineCopyButton value={data} buttonStyle={styles.button} />

// Displaying object data
<DataViewer data={params} title="Parameters" />
```
