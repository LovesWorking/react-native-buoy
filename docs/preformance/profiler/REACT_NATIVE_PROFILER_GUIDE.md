# React Native DevTools Profiler - Complete Implementation Guide

> A comprehensive reference for implementing performance profiling in React Native applications. This guide documents all APIs, types, and patterns used by React Native's DevTools profiler for measuring performance.

---

## Table of Contents

### Quick Navigation

- [1. Overview](#1-overview)
- [2. Core Concepts](#2-core-concepts)
- [3. React Profiler Component API](#3-react-profiler-component-api)
  - [3.1 Basic Usage](#31-basic-usage)
  - [3.2 onRender Callback](#32-onrender-callback)
  - [3.3 onCommit Callback](#33-oncommit-callback)
  - [3.4 onPostCommit Callback](#34-onpostcommit-callback)
- [4. Performance API](#4-performance-api)
  - [4.1 Performance Marks](#41-performance-marks)
  - [4.2 Performance Measures](#42-performance-measures)
  - [4.3 Getting Entries](#43-getting-entries)
- [5. PerformanceObserver API](#5-performanceobserver-api)
- [6. Performance Logger Utility](#6-performance-logger-utility)
- [7. Systrace Integration](#7-systrace-integration)
- [8. React Native Startup Timing](#8-react-native-startup-timing)
- [9. Memory Profiling](#9-memory-profiling)
- [10. Event Timing](#10-event-timing)
- [11. Internal Profiler Timer Functions](#11-internal-profiler-timer-functions)
- [12. DevTools Profiler Setup](#12-devtools-profiler-setup)
- [13. Building Your Own Profiler](#13-building-your-own-profiler)
  - [13.1 Simple Recording Session](#131-simple-recording-session)
  - [13.2 Complete Implementation Example](#132-complete-implementation-example)
- [14. What To Do and What NOT To Do](#14-what-to-do-and-what-not-to-do)
- [15. Type Definitions Reference](#15-type-definitions-reference)
- [16. File Path Reference](#16-file-path-reference)

---

## 1. Overview

React Native's performance profiling system operates at multiple levels:

1. **React Fiber Profiling**: Tracks render times, commit durations, and effect execution
2. **Performance API**: W3C-compliant marks and measures for custom timing
3. **PerformanceObserver**: Reactive API for receiving performance entries
4. **Systrace**: Native platform tracing integration
5. **Memory Profiling**: Hermes/JSC heap information
6. **Startup Timing**: React Native-specific app initialization metrics

### How Recording Works

When you start profiling:

1. React's profiler mode flag is enabled on fiber nodes (`mode & 2`)
2. Timer functions track `actualDuration`, `treeBaseDuration`, and `actualStartTime` for each fiber
3. The `onCommitFiberRoot` hook reports completed renders to DevTools
4. Performance entries are buffered and can be retrieved at any time

**Source**: `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js:3440-3483`

---

## 2. Core Concepts

### Fiber Profiling Properties

Each React fiber node contains profiling data:

```typescript
interface FiberProfilingData {
  actualDuration: number; // Time spent rendering this component and descendants
  actualStartTime: number; // When React started rendering this component
  selfBaseDuration: number; // Time spent on this component (excluding children)
  treeBaseDuration: number; // Accumulated time of entire subtree
}
```

**Source**: `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js:15340-15376`

### Profiler State Node

Profiler components maintain additional state:

```typescript
interface ProfilerStateNode {
  effectDuration: number; // Time spent in mutation effects
  passiveEffectDuration: number; // Time spent in passive effects (useEffect)
}
```

**Source**: `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js:15516-15528`

---

## 3. React Profiler Component API

### 3.1 Basic Usage

```tsx
import React, { Profiler } from "react";

function MyApp() {
  return (
    <Profiler id="MyApp" onRender={onRenderCallback}>
      <YourComponents />
    </Profiler>
  );
}
```

**Important**: The `id` prop MUST be a string. React will log an error if it's not:

```
Profiler must specify an "id" of type `string` as a prop.
```

**Source**: `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js:15521-15529`

### 3.2 onRender Callback

Called every time the profiled tree commits an update.

```typescript
type ProfilerOnRenderCallback = (
  id: string, // Profiler "id" prop
  phase: "mount" | "update" | "nested-update",
  actualDuration: number, // Time spent rendering committed update
  baseDuration: number, // Estimated time to render entire subtree without memoization
  startTime: number, // When React began rendering this update
  commitTime: number // When React committed this update
) => void;

// Example implementation
function onRenderCallback(
  id: string,
  phase: string,
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log(`[${id}] ${phase}`);
  console.log(`  Render time: ${actualDuration.toFixed(2)}ms`);
  console.log(`  Base time: ${baseDuration.toFixed(2)}ms`);
  console.log(
    `  Start: ${startTime.toFixed(2)}ms, Commit: ${commitTime.toFixed(2)}ms`
  );
}
```

**Source**: `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js:10863-10886`

### 3.3 onCommit Callback

Called after the commit phase (DOM mutations applied).

```typescript
type ProfilerOnCommitCallback = (
  id: string,
  phase: "mount" | "update" | "nested-update",
  effectDuration: number, // Time spent in mutation effects
  commitStartTime: number // When commit phase started
) => void;

// Example
<Profiler
  id="MyComponent"
  onRender={onRenderCallback}
  onCommit={(id, phase, effectDuration, commitStartTime) => {
    console.log(`Effect duration: ${effectDuration.toFixed(2)}ms`);
  }}
>
  <MyComponent />
</Profiler>;
```

**Source**: `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js:10884-10886`

### 3.4 onPostCommit Callback

Called after all passive effects (useEffect) have run.

```typescript
type ProfilerOnPostCommitCallback = (
  id: string,
  phase: "mount" | "update" | "nested-update",
  passiveEffectDuration: number, // Time spent in passive effects
  commitStartTime: number
) => void;

// Example
<Profiler
  id="MyComponent"
  onRender={onRenderCallback}
  onPostCommit={(id, phase, passiveEffectDuration, commitStartTime) => {
    console.log(`Passive effects took: ${passiveEffectDuration.toFixed(2)}ms`);
  }}
>
  <MyComponent />
</Profiler>;
```

**Source**: `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js:10887-10905`

---

## 4. Performance API

React Native implements the W3C Performance API for custom timing measurements.

### 4.1 Performance Marks

Create named timestamps in the performance timeline.

```typescript
// Type definitions
interface PerformanceMarkOptions {
  startTime?: DOMHighResTimeStamp;
  detail?: any; // Custom data (will be structuredClone'd)
}

class PerformanceMark extends PerformanceEntry {
  readonly detail: any;
}
```

**Usage**:

```typescript
// Simple mark at current time
performance.mark("rewardRedemptionStart");

// Mark with custom start time
performance.mark("customMark", { startTime: 1234.56 });

// Mark with detail
performance.mark("apiCall", { detail: { endpoint: "/rewards" } });

// Clear marks
performance.clearMarks("rewardRedemptionStart"); // Clear specific
performance.clearMarks(); // Clear all
```

**Source**: `packages/react-native/src/private/webapis/performance/Performance.js:161-229`

### 4.2 Performance Measures

Measure duration between marks or timestamps.

```typescript
type PerformanceMeasureOptions =
  | {
      detail?: any;
      start?: DOMHighResTimeStamp | string;
      duration?: DOMHighResTimeStamp;
    }
  | {
      detail?: any;
      start?: DOMHighResTimeStamp | string;
      end?: DOMHighResTimeStamp | string;
    }
  | {
      detail?: any;
      duration?: DOMHighResTimeStamp;
      end?: DOMHighResTimeStamp | string;
    };
```

**Usage**:

```typescript
// Measure from mark to now
performance.mark("start");
// ... do work ...
const measure = performance.measure("workDuration", "start");
console.log(`Work took: ${measure.duration}ms`);

// Measure between two marks
performance.mark("start");
// ... do work ...
performance.mark("end");
performance.measure("totalWork", "start", "end");

// Measure with options object
performance.measure("operation", {
  start: "startMark",
  end: "endMark",
  detail: { operationType: "rewardRedemption" },
});

// Measure with explicit times
performance.measure("fixedMeasure", {
  start: 100,
  duration: 50,
  detail: { source: "manual" },
});

// Clear measures
performance.clearMeasures("workDuration");
performance.clearMeasures(); // Clear all
```

**Source**: `packages/react-native/src/private/webapis/performance/Performance.js:231-415`

### 4.3 Getting Entries

Retrieve performance entries from the timeline.

```typescript
// Get all entries
const allEntries = performance.getEntries();

// Get entries by type ('mark' | 'measure')
const marks = performance.getEntriesByType("mark");
const measures = performance.getEntriesByType("measure");

// Get entries by name
const specificMarks = performance.getEntriesByName("rewardRedemptionStart");
const specificMeasures = performance.getEntriesByName(
  "rewardRedemptionStart",
  "measure"
);
```

**Note**: Only 'mark' and 'measure' types are available from timeline. Other types ('event', 'longtask', 'resource') require PerformanceObserver.

**Source**: `packages/react-native/src/private/webapis/performance/Performance.js:428-462`

---

## 5. PerformanceObserver API

Reactively observe performance entries as they're recorded.

```typescript
// Type definitions
interface PerformanceObserverInit {
  entryTypes?: Array<PerformanceEntryType>; // Multiple types mode
  type?: PerformanceEntryType; // Single type mode
  buffered?: boolean; // Include buffered entries
  durationThreshold?: DOMHighResTimeStamp; // Minimum duration filter
}

type PerformanceEntryType =
  | "mark"
  | "measure"
  | "event"
  | "longtask"
  | "resource";

type PerformanceObserverCallback = (
  list: PerformanceObserverEntryList,
  observer: PerformanceObserver,
  options?: { droppedEntriesCount: number }
) => void;

class PerformanceObserverEntryList {
  getEntries(): PerformanceEntryList;
  getEntriesByType(type: PerformanceEntryType): PerformanceEntryList;
  getEntriesByName(
    name: string,
    type?: PerformanceEntryType
  ): PerformanceEntryList;
}
```

**Usage**:

```typescript
// Create observer
const observer = new PerformanceObserver((list, observer, options) => {
  const entries = list.getEntries();

  entries.forEach((entry) => {
    console.log(`[${entry.entryType}] ${entry.name}: ${entry.duration}ms`);

    // For event timing entries
    if (entry.entryType === "event") {
      const eventEntry = entry as PerformanceEventTiming;
      console.log(
        `  Processing: ${eventEntry.processingStart} - ${eventEntry.processingEnd}`
      );
      console.log(`  Interaction ID: ${eventEntry.interactionId}`);
    }
  });

  if (options?.droppedEntriesCount) {
    console.warn(
      `Dropped ${options.droppedEntriesCount} entries due to buffer overflow`
    );
  }
});

// Observe multiple types
observer.observe({ entryTypes: ["mark", "measure"] });

// Observe single type with options
observer.observe({
  type: "event",
  buffered: true, // Include entries from before observation started
  durationThreshold: 16, // Only events > 16ms
});

// Get pending entries without waiting for callback
const pendingEntries = observer.takeRecords();

// Stop observing
observer.disconnect();

// Check supported types
console.log(PerformanceObserver.supportedEntryTypes);
// ['mark', 'measure', 'event', 'longtask', 'resource']
```

**Important Constraints**:

- Cannot use both `entryTypes` AND `type` in same observe() call
- Cannot switch between single-type and multiple-type mode on same observer
- `durationThreshold` only works with single-type mode

**Source**: `packages/react-native/src/private/webapis/performance/PerformanceObserver.js:99-242`

---

## 6. Performance Logger Utility

A simpler, production-friendly utility for measuring timespans.

```typescript
// Type definitions
interface Timespan {
  startTime: number;
  endTime?: number;
  totalTime?: number;
  startExtras?: Extras;
  endExtras?: Extras;
}

type ExtraValue = number | string | boolean;
type Extras = { [key: string]: ExtraValue };

interface IPerformanceLogger {
  // Timespan methods
  startTimespan(key: string, timestamp?: number, extras?: Extras): void;
  stopTimespan(key: string, timestamp?: number, extras?: Extras): void;
  addTimespan(
    key: string,
    startTime: number,
    endTime: number,
    startExtras?: Extras,
    endExtras?: Extras
  ): void;
  hasTimespan(key: string): boolean;
  getTimespans(): { [key: string]: ?Timespan };

  // Point methods
  markPoint(key: string, timestamp?: number, extras?: Extras): void;
  getPoints(): { [key: string]: ?number };
  getPointExtras(): { [key: string]: ?Extras };

  // Extra metadata
  setExtra(key: string, value: ExtraValue): void;
  removeExtra(key: string): ?ExtraValue;
  getExtras(): { [key: string]: ?ExtraValue };

  // Lifecycle
  currentTimestamp(): number;
  append(logger: IPerformanceLogger): void;
  clear(): void;
  clearCompleted(): void;
  close(): void;
  isClosed(): boolean;
  logEverything(): void;
}
```

**Usage**:

```typescript
import createPerformanceLogger from "react-native/Libraries/Utilities/createPerformanceLogger";

const logger = createPerformanceLogger();

// Measure a timespan
logger.startTimespan("rewardRedemption", undefined, { userId: "user123" });
// ... perform redemption ...
logger.stopTimespan("rewardRedemption", undefined, { success: true });

// Get results
const timespans = logger.getTimespans();
const redemptionTime = timespans["rewardRedemption"]?.totalTime;
console.log(`Redemption took: ${redemptionTime}ms`);

// Mark specific points
logger.markPoint("apiCallStarted");
logger.markPoint("responseReceived");

// Add metadata
logger.setExtra("bundleSize", 1234567);
logger.setExtra("platform", "ios");

// Add pre-calculated timespan
logger.addTimespan("networkLatency", 100, 250);

// Get all data
console.log("Timespans:", logger.getTimespans());
console.log("Points:", logger.getPoints());
console.log("Extras:", logger.getExtras());

// Merge another logger's data
const otherLogger = createPerformanceLogger();
otherLogger.startTimespan("otherOperation");
otherLogger.stopTimespan("otherOperation");
logger.append(otherLogger);

// Clear data
logger.clearCompleted(); // Remove only completed timespans
logger.clear(); // Remove everything

// Prevent further modifications
logger.close();
```

**Source**: `packages/react-native/Libraries/Utilities/createPerformanceLogger.js:23-329`

---

## 7. Systrace Integration

Low-level native tracing for platform profiling tools.

```typescript
// Type definitions
type EventName = string | (() => string);
type EventArgs = { [string]: string } | null;

// Functions
function isEnabled(): boolean;
function beginEvent(eventName: EventName, args?: EventArgs): void;
function endEvent(args?: EventArgs): void;
function beginAsyncEvent(eventName: EventName, args?: EventArgs): number; // Returns cookie
function endAsyncEvent(
  eventName: EventName,
  cookie: number,
  args?: EventArgs
): void;
function counterEvent(eventName: EventName, value: number): void;
```

**Usage**:

```typescript
import * as Systrace from "react-native/Libraries/Performance/Systrace";

// Check if profiling is active
if (Systrace.isEnabled()) {
  // Synchronous event (must end in same stack frame)
  Systrace.beginEvent("rewardRedemption", { rewardId: "123" });
  try {
    redeemReward();
  } finally {
    Systrace.endEvent();
  }

  // Async event (can span stack frames)
  const cookie = Systrace.beginAsyncEvent("networkRequest", {
    url: "/api/rewards",
  });
  fetch("/api/rewards")
    .then((response) => {
      Systrace.endAsyncEvent("networkRequest", cookie, { status: "success" });
    })
    .catch((error) => {
      Systrace.endAsyncEvent("networkRequest", cookie, { status: "error" });
    });

  // Counter event (for tracking values over time)
  Systrace.counterEvent("activeRequests", activeRequestCount);
}
```

**Important**: Only call Systrace methods when `isEnabled()` returns true to avoid overhead.

**Source**: `packages/react-native/Libraries/Performance/Systrace.js:33-139`

---

## 8. React Native Startup Timing

Access React Native-specific startup metrics.

```typescript
interface ReactNativeStartupTiming {
  readonly startTime: number | null; // App startup start
  readonly endTime: number | null; // Startup completion
  readonly initializeRuntimeStart: number | null; // RN infra initialization
  readonly executeJavaScriptBundleEntryPointStart: number | null; // JS bundle execution start
}

// Access via Performance API
const startupTiming = performance.rnStartupTiming;

console.log("App startup:", startupTiming.startTime);
console.log("Runtime init:", startupTiming.initializeRuntimeStart);
console.log(
  "JS bundle exec:",
  startupTiming.executeJavaScriptBundleEntryPointStart
);
console.log("Startup complete:", startupTiming.endTime);

// Calculate phases
if (startupTiming.startTime != null && startupTiming.endTime != null) {
  const totalStartup = startupTiming.endTime - startupTiming.startTime;
  console.log(`Total startup: ${totalStartup}ms`);
}

if (
  startupTiming.initializeRuntimeStart != null &&
  startupTiming.executeJavaScriptBundleEntryPointStart != null
) {
  const runtimeInit =
    startupTiming.executeJavaScriptBundleEntryPointStart -
    startupTiming.initializeRuntimeStart;
  console.log(`Runtime initialization: ${runtimeInit}ms`);
}
```

**Source**: `packages/react-native/src/private/webapis/performance/ReactNativeStartupTiming.js:24-74`

---

## 9. Memory Profiling

Access JavaScript heap information (Hermes engine).

```typescript
interface MemoryInfo {
  readonly jsHeapSizeLimit: number | null; // Max heap size available
  readonly totalJSHeapSize: number | null; // Total allocated heap
  readonly usedJSHeapSize: number | null; // Currently used heap
}

// Access via Performance API
const memory = performance.memory;

console.log("Heap limit:", memory.jsHeapSizeLimit);
console.log("Total heap:", memory.totalJSHeapSize);
console.log("Used heap:", memory.usedJSHeapSize);

if (memory.totalJSHeapSize != null && memory.usedJSHeapSize != null) {
  const usagePercent = (
    (memory.usedJSHeapSize / memory.totalJSHeapSize) *
    100
  ).toFixed(2);
  console.log(`Memory usage: ${usagePercent}%`);
}
```

**Note**: Memory info is only available with Hermes engine. JSC/V8 return null values.

**Source**: `packages/react-native/src/private/webapis/performance/MemoryInfo.js:22-57`

---

## 10. Event Timing

Track user interaction timing.

```typescript
interface PerformanceEventTiming extends PerformanceEntry {
  readonly processingStart: DOMHighResTimeStamp; // When event handler started
  readonly processingEnd: DOMHighResTimeStamp; // When event handler ended
  readonly interactionId: number; // Unique interaction identifier
}

// EventCounts - frequency of events
interface EventCounts {
  readonly size: number;
  get(key: string): number | undefined;
  has(key: string): boolean;
  entries(): Iterator<[string, number]>;
  keys(): Iterator<string>;
  values(): Iterator<number>;
  forEach(callback: (value: number, key: string, map: Map) => void): void;
}
```

**Usage**:

```typescript
// Observe event timing
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();

  entries.forEach((entry) => {
    const eventTiming = entry as PerformanceEventTiming;

    const inputDelay = eventTiming.processingStart - eventTiming.startTime;
    const processingTime =
      eventTiming.processingEnd - eventTiming.processingStart;
    const totalDuration = eventTiming.duration;

    console.log(`Event: ${eventTiming.name}`);
    console.log(`  Input delay: ${inputDelay.toFixed(2)}ms`);
    console.log(`  Processing: ${processingTime.toFixed(2)}ms`);
    console.log(`  Total: ${totalDuration.toFixed(2)}ms`);
    console.log(`  Interaction ID: ${eventTiming.interactionId}`);
  });
});

observer.observe({ type: "event", buffered: true, durationThreshold: 16 });

// Get event counts
const eventCounts = performance.eventCounts;
console.log("Total event types:", eventCounts.size);

eventCounts.forEach((count, eventType) => {
  console.log(`${eventType}: ${count} events`);
});
```

**Source**: `packages/react-native/src/private/webapis/performance/EventTiming.js:38-161`

---

## 11. Internal Profiler Timer Functions

These are the internal functions React uses to measure render performance.

```typescript
// Start profiling a fiber
function startProfilerTimer(fiber: Fiber): void {
  profilerStartTime = now();
  if (fiber.actualStartTime < 0) {
    fiber.actualStartTime = profilerStartTime;
  }
}

// Stop timer and record duration
function stopProfilerTimerIfRunningAndRecordDuration(fiber: Fiber): void {
  if (profilerStartTime >= 0) {
    const elapsedTime = now() - profilerStartTime;
    fiber.actualDuration += elapsedTime;
    fiber.selfBaseDuration = elapsedTime;
    profilerStartTime = -1;
  }
}

// Record effect execution duration
function recordEffectDuration(): void {
  if (profilerStartTime >= 0) {
    const endTime = now();
    const elapsedTime = endTime - profilerStartTime;
    profilerStartTime = -1;
    profilerEffectDuration += elapsedTime;
    componentEffectDuration += elapsedTime;
    componentEffectEndTime = endTime;
  }
}

// Transfer children's actual duration to parent
function transferActualDuration(fiber: Fiber): void {
  let child = fiber.child;
  while (child) {
    fiber.actualDuration += child.actualDuration;
    child = child.sibling;
  }
}
```

**Source**: `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js:3440-3483`

---

## 12. DevTools Profiler Setup

How React DevTools initializes profiling.

```typescript
// Configuration for reload-and-profile feature
interface ReloadAndProfileConfig {
  shouldReloadAndProfile: boolean;
  recordChangeDescriptions: boolean;
}

// Initial profiling settings
interface ProfilingSettings {
  recordChangeDescriptions: boolean;
  recordTimeline: boolean; // Always false in React Native
}

// DevTools hook initialization
function initialize(
  hookSettings: Object | null,
  shouldStartProfilingNow: boolean,
  initialProfilingSettings: ProfilingSettings
): void;

// DevTools connection callbacks
interface ConnectOptions {
  isReloadAndProfileSupported: boolean;
  isProfiling: boolean;
  onReloadAndProfile: (recordChangeDescriptions: boolean) => void;
  onReloadAndProfileFlagsReset: () => void;
  onSettingsUpdated: (settings: Object) => void;
  // ... other options
}
```

**How it works**:

1. `setUpReactDevTools.js` runs in DEV mode
2. Reads profiling config from native module
3. Initializes DevTools hook with settings
4. Connects to DevTools frontend (Fusebox or WebSocket)
5. DevTools can then control profiling via `onReloadAndProfile`

**Source**: `packages/react-native/Libraries/Core/setUpReactDevTools.js:59-258`

---

## 13. Building Your Own Profiler

### 13.1 Simple Recording Session

Here's how to implement a simple "record → perform action → stop → save" flow:

```typescript
import { Profiler, useCallback, useRef, useState } from "react";
import createPerformanceLogger from "react-native/Libraries/Utilities/createPerformanceLogger";

// Type definitions for your profiling report
interface RenderEntry {
  id: string;
  phase: string;
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
  timestamp: number;
}

interface ProfileReport {
  id: string;
  name: string;
  timestamp: number;
  totalDuration: number;
  renders: RenderEntry[];
  renderCount: number;
  averageRenderTime: number;
  maxRenderTime: number;
  memory: {
    start: number | null;
    end: number | null;
    delta: number | null;
  };
  marks: Array<{ name: string; startTime: number }>;
  measures: Array<{ name: string; duration: number; startTime: number }>;
}

function useProfiler() {
  const [isRecording, setIsRecording] = useState(false);
  const rendersRef = useRef<RenderEntry[]>([]);
  const startTimeRef = useRef<number>(0);
  const startMemoryRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string>("");

  const startRecording = useCallback((sessionName: string) => {
    // Generate unique session ID
    sessionIdRef.current = `${sessionName}_${Date.now()}`;

    // Clear previous data
    rendersRef.current = [];

    // Record start time
    startTimeRef.current = performance.now();

    // Record start memory (Hermes only)
    startMemoryRef.current = performance.memory?.usedJSHeapSize ?? null;

    // Clear previous marks/measures
    performance.clearMarks();
    performance.clearMeasures();

    // Mark session start
    performance.mark(`${sessionIdRef.current}_start`);

    setIsRecording(true);

    console.log(`[Profiler] Started recording: ${sessionName}`);
  }, []);

  const stopRecording = useCallback((): ProfileReport => {
    setIsRecording(false);

    // Mark session end
    performance.mark(`${sessionIdRef.current}_end`);

    // Measure total session duration
    performance.measure(
      `${sessionIdRef.current}_total`,
      `${sessionIdRef.current}_start`,
      `${sessionIdRef.current}_end`
    );

    const endTime = performance.now();
    const totalDuration = endTime - startTimeRef.current;
    const endMemory = performance.memory?.usedJSHeapSize ?? null;

    // Calculate statistics
    const renders = rendersRef.current;
    const renderCount = renders.length;
    const totalRenderTime = renders.reduce(
      (sum, r) => sum + r.actualDuration,
      0
    );
    const averageRenderTime =
      renderCount > 0 ? totalRenderTime / renderCount : 0;
    const maxRenderTime =
      renderCount > 0 ? Math.max(...renders.map((r) => r.actualDuration)) : 0;

    // Get all marks and measures
    const marks = performance.getEntriesByType("mark").map((m) => ({
      name: m.name,
      startTime: m.startTime,
    }));

    const measures = performance.getEntriesByType("measure").map((m) => ({
      name: m.name,
      duration: m.duration,
      startTime: m.startTime,
    }));

    const report: ProfileReport = {
      id: sessionIdRef.current,
      name: sessionIdRef.current.split("_")[0],
      timestamp: Date.now(),
      totalDuration,
      renders,
      renderCount,
      averageRenderTime,
      maxRenderTime,
      memory: {
        start: startMemoryRef.current,
        end: endMemory,
        delta:
          startMemoryRef.current != null && endMemory != null
            ? endMemory - startMemoryRef.current
            : null,
      },
      marks,
      measures,
    };

    console.log(`[Profiler] Stopped recording: ${report.name}`);
    console.log(`  Total duration: ${totalDuration.toFixed(2)}ms`);
    console.log(`  Render count: ${renderCount}`);
    console.log(`  Avg render: ${averageRenderTime.toFixed(2)}ms`);

    return report;
  }, []);

  const onRender = useCallback(
    (
      id: string,
      phase: string,
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number
    ) => {
      if (!isRecording) return;

      rendersRef.current.push({
        id,
        phase,
        actualDuration,
        baseDuration,
        startTime,
        commitTime,
        timestamp: Date.now(),
      });
    },
    [isRecording]
  );

  return {
    isRecording,
    startRecording,
    stopRecording,
    onRender,
  };
}

// Usage in your app
function ProfiledApp() {
  const { isRecording, startRecording, stopRecording, onRender } =
    useProfiler();
  const [reports, setReports] = useState<ProfileReport[]>([]);

  const handleStartProfiling = () => {
    startRecording("RewardRedemption");
  };

  const handleStopProfiling = () => {
    const report = stopRecording();
    setReports((prev) => [...prev, report]);
    // Save report to storage/server
    saveReport(report);
  };

  const compareReports = (report1: ProfileReport, report2: ProfileReport) => {
    const improvement =
      ((report1.totalDuration - report2.totalDuration) /
        report1.totalDuration) *
      100;

    console.log(`Performance comparison:`);
    console.log(`  Before: ${report1.totalDuration.toFixed(2)}ms`);
    console.log(`  After: ${report2.totalDuration.toFixed(2)}ms`);
    console.log(`  Improvement: ${improvement.toFixed(2)}%`);

    return {
      durationDelta: report2.totalDuration - report1.totalDuration,
      renderCountDelta: report2.renderCount - report1.renderCount,
      avgRenderDelta: report2.averageRenderTime - report1.averageRenderTime,
      improvementPercent: improvement,
    };
  };

  return (
    <Profiler id="App" onRender={onRender}>
      <View>
        <Button
          title={isRecording ? "Stop Recording" : "Start Recording"}
          onPress={isRecording ? handleStopProfiling : handleStartProfiling}
        />
        <YourRewardsComponent />
      </View>
    </Profiler>
  );
}
```

### 13.2 Complete Implementation Example

A full-featured profiler with PerformanceObserver integration:

```typescript
import { Profiler } from "react";
import createPerformanceLogger from "react-native/Libraries/Utilities/createPerformanceLogger";

// Complete profiler class
class PerformanceProfiler {
  private isRecording = false;
  private sessionId = "";
  private logger = createPerformanceLogger();
  private renders: RenderEntry[] = [];
  private observer: PerformanceObserver | null = null;
  private longTasks: PerformanceEntry[] = [];
  private events: PerformanceEventTiming[] = [];

  startSession(name: string): void {
    if (this.isRecording) {
      console.warn("[Profiler] Already recording");
      return;
    }

    this.isRecording = true;
    this.sessionId = `${name}_${Date.now()}`;
    this.renders = [];
    this.longTasks = [];
    this.events = [];
    this.logger.clear();

    // Start main timespan
    this.logger.startTimespan("session", undefined, { name });

    // Record initial memory
    const memory = performance.memory;
    if (memory.usedJSHeapSize != null) {
      this.logger.setExtra("startMemory", memory.usedJSHeapSize);
    }

    // Set up PerformanceObserver for long tasks and events
    this.observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === "longtask") {
          this.longTasks.push(entry);
        } else if (entry.entryType === "event") {
          this.events.push(entry as PerformanceEventTiming);
        }
      });
    });

    try {
      this.observer.observe({ entryTypes: ["longtask", "event"] });
    } catch (e) {
      // Some entry types may not be supported
      console.warn("[Profiler] Some entry types not supported:", e);
    }

    // Mark session start
    performance.mark(`${this.sessionId}_start`);

    console.log(`[Profiler] Session started: ${this.sessionId}`);
  }

  recordRender(
    id: string,
    phase: string,
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ): void {
    if (!this.isRecording) return;

    this.renders.push({
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      timestamp: Date.now(),
    });

    // Log slow renders
    if (actualDuration > 16) {
      this.logger.markPoint(`slowRender_${id}`, performance.now(), {
        duration: actualDuration.toString(),
        phase,
      });
    }
  }

  // Add custom marks during the session
  mark(name: string): void {
    if (!this.isRecording) return;
    performance.mark(`${this.sessionId}_${name}`);
    this.logger.markPoint(name);
  }

  // Start a custom measure
  startMeasure(name: string): void {
    if (!this.isRecording) return;
    this.logger.startTimespan(name);
    performance.mark(`${this.sessionId}_${name}_start`);
  }

  // End a custom measure
  endMeasure(name: string): void {
    if (!this.isRecording) return;
    this.logger.stopTimespan(name);
    performance.mark(`${this.sessionId}_${name}_end`);
    performance.measure(
      `${this.sessionId}_${name}`,
      `${this.sessionId}_${name}_start`,
      `${this.sessionId}_${name}_end`
    );
  }

  stopSession(): ProfileReport {
    if (!this.isRecording) {
      throw new Error("[Profiler] No active session");
    }

    this.isRecording = false;

    // Mark session end
    performance.mark(`${this.sessionId}_end`);
    performance.measure(
      `${this.sessionId}_total`,
      `${this.sessionId}_start`,
      `${this.sessionId}_end`
    );

    // Stop timespan
    this.logger.stopTimespan("session");

    // Record end memory
    const memory = performance.memory;
    if (memory.usedJSHeapSize != null) {
      this.logger.setExtra("endMemory", memory.usedJSHeapSize);
    }

    // Disconnect observer
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    // Build report
    const timespans = this.logger.getTimespans();
    const sessionTimespan = timespans["session"];
    const totalDuration = sessionTimespan?.totalTime ?? 0;

    const renderCount = this.renders.length;
    const totalRenderTime = this.renders.reduce(
      (sum, r) => sum + r.actualDuration,
      0
    );
    const averageRenderTime =
      renderCount > 0 ? totalRenderTime / renderCount : 0;
    const maxRenderTime =
      renderCount > 0
        ? Math.max(...this.renders.map((r) => r.actualDuration))
        : 0;

    const extras = this.logger.getExtras();
    const startMemory =
      typeof extras["startMemory"] === "number" ? extras["startMemory"] : null;
    const endMemory =
      typeof extras["endMemory"] === "number" ? extras["endMemory"] : null;

    const report: ProfileReport = {
      id: this.sessionId,
      name: this.sessionId.split("_")[0],
      timestamp: Date.now(),
      totalDuration,
      renders: [...this.renders],
      renderCount,
      averageRenderTime,
      maxRenderTime,
      memory: {
        start: startMemory,
        end: endMemory,
        delta:
          startMemory != null && endMemory != null
            ? endMemory - startMemory
            : null,
      },
      marks: performance
        .getEntriesByType("mark")
        .filter((m) => m.name.startsWith(this.sessionId))
        .map((m) => ({
          name: m.name.replace(`${this.sessionId}_`, ""),
          startTime: m.startTime,
        })),
      measures: performance
        .getEntriesByType("measure")
        .filter((m) => m.name.startsWith(this.sessionId))
        .map((m) => ({
          name: m.name.replace(`${this.sessionId}_`, ""),
          duration: m.duration,
          startTime: m.startTime,
        })),
      longTasks: this.longTasks.map((t) => ({
        startTime: t.startTime,
        duration: t.duration,
      })),
      events: this.events.map((e) => ({
        name: e.name,
        duration: e.duration,
        processingStart: e.processingStart,
        processingEnd: e.processingEnd,
        interactionId: e.interactionId,
      })),
      customTimespans: Object.entries(timespans)
        .filter(([key]) => key !== "session")
        .reduce((acc, [key, value]) => {
          if (value?.totalTime != null) {
            acc[key] = value.totalTime;
          }
          return acc;
        }, {} as Record<string, number>),
    };

    // Close logger
    this.logger.close();
    this.logger = createPerformanceLogger();

    console.log(`[Profiler] Session stopped: ${report.name}`);
    this.logReport(report);

    return report;
  }

  private logReport(report: ProfileReport): void {
    console.log("=== Performance Report ===");
    console.log(`Session: ${report.name}`);
    console.log(`Total Duration: ${report.totalDuration.toFixed(2)}ms`);
    console.log(`Renders: ${report.renderCount}`);
    console.log(`Avg Render: ${report.averageRenderTime.toFixed(2)}ms`);
    console.log(`Max Render: ${report.maxRenderTime.toFixed(2)}ms`);

    if (report.longTasks.length > 0) {
      console.log(`Long Tasks: ${report.longTasks.length}`);
      console.log(
        `  Total time: ${report.longTasks
          .reduce((s, t) => s + t.duration, 0)
          .toFixed(2)}ms`
      );
    }

    if (report.memory.delta != null) {
      const deltaMB = (report.memory.delta / 1024 / 1024).toFixed(2);
      console.log(`Memory Delta: ${deltaMB}MB`);
    }

    console.log("=========================");
  }

  static compareReports(
    before: ProfileReport,
    after: ProfileReport
  ): ComparisonResult {
    const durationImprovement =
      ((before.totalDuration - after.totalDuration) / before.totalDuration) *
      100;

    const renderImprovement =
      ((before.averageRenderTime - after.averageRenderTime) /
        before.averageRenderTime) *
      100;

    const result = {
      durationDelta: after.totalDuration - before.totalDuration,
      durationImprovement,
      renderCountDelta: after.renderCount - before.renderCount,
      avgRenderDelta: after.averageRenderTime - before.averageRenderTime,
      avgRenderImprovement: renderImprovement,
      maxRenderDelta: after.maxRenderTime - before.maxRenderTime,
      memoryDelta: (after.memory.delta ?? 0) - (before.memory.delta ?? 0),
      isImproved: durationImprovement > 0,
    };

    console.log("=== Comparison Results ===");
    console.log(
      `Duration: ${result.durationImprovement.toFixed(2)}% ${
        result.isImproved ? "faster" : "slower"
      }`
    );
    console.log(`  Before: ${before.totalDuration.toFixed(2)}ms`);
    console.log(`  After: ${after.totalDuration.toFixed(2)}ms`);
    console.log(
      `Avg Render: ${result.avgRenderImprovement.toFixed(2)}% improvement`
    );
    console.log(`  Before: ${before.averageRenderTime.toFixed(2)}ms`);
    console.log(`  After: ${after.averageRenderTime.toFixed(2)}ms`);
    console.log("==========================");

    return result;
  }
}

// Usage
const profiler = new PerformanceProfiler();

// In your component
function RewardsScreen() {
  const handleRedeemStart = () => {
    profiler.startSession("RewardRedemption");
    profiler.startMeasure("apiCall");
  };

  const handleApiComplete = () => {
    profiler.endMeasure("apiCall");
    profiler.mark("processingStart");
  };

  const handleRedeemComplete = () => {
    profiler.mark("complete");
    const report = profiler.stopSession();

    // Save for comparison
    AsyncStorage.setItem(`report_${report.id}`, JSON.stringify(report));
  };

  return (
    <Profiler id="Rewards" onRender={profiler.recordRender.bind(profiler)}>
      <RewardsContent
        onRedeemStart={handleRedeemStart}
        onApiComplete={handleApiComplete}
        onRedeemComplete={handleRedeemComplete}
      />
    </Profiler>
  );
}
```

---

## 14. What To Do and What NOT To Do

### DO: Use React.Profiler in Development

```tsx
// GOOD: Wrap performance-critical sections
<Profiler id="RewardsList" onRender={logRenderPerformance}>
  <RewardsList rewards={rewards} />
</Profiler>

// GOOD: Nest profilers for granular data
<Profiler id="RewardsScreen" onRender={logScreen}>
  <Header />
  <Profiler id="RewardsList" onRender={logList}>
    <RewardsList />
  </Profiler>
  <Profiler id="RewardsActions" onRender={logActions}>
    <RewardsActions />
  </Profiler>
</Profiler>
```

### DON'T: Leave Profiler in Production Without Purpose

```tsx
// BAD: Profiler with empty callback in production
<Profiler id="App" onRender={() => {}}>
  <App />
</Profiler>;

// BETTER: Conditionally include profiler
{
  __DEV__ ? (
    <Profiler id="App" onRender={logRender}>
      <App />
    </Profiler>
  ) : (
    <App />
  );
}
```

### DO: Use performance.mark/measure for Custom Timing

```typescript
// GOOD: Measure specific operations
performance.mark("fetchRewardsStart");
const rewards = await fetchRewards();
performance.mark("fetchRewardsEnd");
performance.measure("fetchRewards", "fetchRewardsStart", "fetchRewardsEnd");
```

### DON'T: Create Too Many Performance Entries

```typescript
// BAD: Creating entries in a loop
items.forEach((item, index) => {
  performance.mark(`processItem_${index}`);
  processItem(item);
  performance.mark(`processItem_${index}_end`);
  performance.measure(
    `processItem_${index}`,
    `processItem_${index}`,
    `processItem_${index}_end`
  );
});

// BETTER: Measure the whole operation
performance.mark("processAllItems");
items.forEach(processItem);
performance.mark("processAllItemsEnd");
performance.measure("processAllItems", "processAllItems", "processAllItemsEnd");
```

### DO: Check Systrace.isEnabled() Before Tracing

```typescript
// GOOD: Only trace when profiling is active
if (Systrace.isEnabled()) {
  const expensiveDebugInfo = computeDebugInfo();
  Systrace.beginEvent("operation", expensiveDebugInfo);
}
```

### DON'T: Always Call Systrace Methods

```typescript
// BAD: Overhead even when not profiling
Systrace.beginEvent("operation");
doOperation();
Systrace.endEvent();
```

### DO: Clean Up Performance Entries

```typescript
// GOOD: Clear entries after collecting report
const report = collectPerformanceReport();
performance.clearMarks();
performance.clearMeasures();
```

### DON'T: Let Performance Entries Accumulate

```typescript
// BAD: Never clearing entries leads to memory growth
function logPerformance() {
  performance.mark("action");
  // Entries keep accumulating...
}
```

### DO: Disconnect PerformanceObservers

```typescript
// GOOD: Clean up observers
const observer = new PerformanceObserver(callback);
observer.observe({ type: "event" });

// When done:
observer.disconnect();
```

### DON'T: Create Observers Without Cleanup

```typescript
// BAD: Observer never disconnected
function setupProfiling() {
  const observer = new PerformanceObserver(callback);
  observer.observe({ entryTypes: ["mark", "measure"] });
  // Observer lives forever...
}
```

### DO: Use Meaningful Profiler IDs

```typescript
// GOOD: Descriptive IDs
<Profiler id="RewardRedemptionFlow" onRender={...}>
<Profiler id="RewardCard_123" onRender={...}>
<Profiler id="RewardsListVirtualized" onRender={...}>
```

### DON'T: Use Generic Profiler IDs

```typescript
// BAD: Non-descriptive IDs
<Profiler id="component1" onRender={...}>
<Profiler id="wrapper" onRender={...}>
```

### DO: Store Reports with Consistent Schema

```typescript
// GOOD: Consistent, versioned schema
interface ProfileReport {
  version: "1.0";
  id: string;
  name: string;
  timestamp: number;
  device: {
    platform: string;
    osVersion: string;
    appVersion: string;
  };
  metrics: {
    totalDuration: number;
    renderCount: number;
    // ...
  };
}
```

### DON'T: Compare Reports Without Context

```typescript
// BAD: Raw comparison without device/version info
compareReports(oldReport, newReport); // Which devices? Which app versions?

// BETTER: Include context
if (
  oldReport.device.platform === newReport.device.platform &&
  oldReport.device.osVersion === newReport.device.osVersion
) {
  compareReports(oldReport, newReport);
}
```

### DO: Use PerformanceLogger for Production

```typescript
// GOOD: Lightweight production logging
import createPerformanceLogger from "react-native/Libraries/Utilities/createPerformanceLogger";

const logger = createPerformanceLogger();
logger.startTimespan("criticalOperation");
await criticalOperation();
logger.stopTimespan("criticalOperation");
// Send to analytics
```

### DON'T: Use React Profiler for All Production Metrics

```typescript
// BAD: Profiler has overhead, not suitable for all production use
<Profiler id="Everything" onRender={sendToAnalytics}>
  <EntireApp />
</Profiler>
```

---

## 15. Type Definitions Reference

```typescript
// Performance Entry Types
type DOMHighResTimeStamp = number;
type PerformanceEntryType =
  | "mark"
  | "measure"
  | "event"
  | "longtask"
  | "resource";

interface PerformanceEntryJSON {
  name: string;
  entryType: PerformanceEntryType;
  startTime: DOMHighResTimeStamp;
  duration: DOMHighResTimeStamp;
}

interface PerformanceEntryInit {
  readonly name: string;
  readonly startTime: DOMHighResTimeStamp;
  readonly duration: DOMHighResTimeStamp;
}

// Profiler Callback Types
type ProfilerOnRenderCallback = (
  id: string,
  phase: "mount" | "update" | "nested-update",
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) => void;

type ProfilerOnCommitCallback = (
  id: string,
  phase: "mount" | "update" | "nested-update",
  effectDuration: number,
  commitStartTime: number
) => void;

type ProfilerOnPostCommitCallback = (
  id: string,
  phase: "mount" | "update" | "nested-update",
  passiveEffectDuration: number,
  commitStartTime: number
) => void;

// Performance Observer Types
interface PerformanceObserverInit {
  entryTypes?: Array<PerformanceEntryType>;
  type?: PerformanceEntryType;
  buffered?: boolean;
  durationThreshold?: DOMHighResTimeStamp;
}

type PerformanceObserverCallback = (
  list: PerformanceObserverEntryList,
  observer: PerformanceObserver,
  options?: { droppedEntriesCount: number }
) => void;

// Performance Logger Types
interface Timespan {
  startTime: number;
  endTime?: number;
  totalTime?: number;
  startExtras?: Extras;
  endExtras?: Extras;
}

type ExtraValue = number | string | boolean;
type Extras = { [key: string]: ExtraValue };

// Event Timing Types
interface PerformanceEventTimingInit extends PerformanceEntryInit {
  readonly processingStart?: DOMHighResTimeStamp;
  readonly processingEnd?: DOMHighResTimeStamp;
  readonly interactionId?: number;
}

// Memory Info Types
interface MemoryInfo {
  readonly jsHeapSizeLimit: number | null;
  readonly totalJSHeapSize: number | null;
  readonly usedJSHeapSize: number | null;
}

// Startup Timing Types
interface ReactNativeStartupTiming {
  readonly startTime: number | null;
  readonly endTime: number | null;
  readonly initializeRuntimeStart: number | null;
  readonly executeJavaScriptBundleEntryPointStart: number | null;
}

// Native Performance Module Types
interface RawPerformanceEntry {
  name: string;
  entryType: RawPerformanceEntryType;
  startTime: number;
  duration: number;
  processingStart?: number;
  processingEnd?: number;
  interactionId?: number;
}

type OpaqueNativeObserverHandle = mixed;
type NativeBatchedObserverCallback = () => void;
```

---

## 16. File Path Reference

| API/Feature                  | File Path                                                                           | Key Lines                       |
| ---------------------------- | ----------------------------------------------------------------------------------- | ------------------------------- |
| React Profiler Component     | `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js`       | 15516-15528                     |
| Profiler onRender            | `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js`       | 10863-10886                     |
| Profiler onCommit            | `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js`       | 10884-10886                     |
| Profiler onPostCommit        | `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js`       | 10887-10905                     |
| Profiler Timer Functions     | `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js`       | 3440-3483                       |
| Performance API              | `packages/react-native/src/private/webapis/performance/Performance.js`              | 96-463                          |
| PerformanceEntry             | `packages/react-native/src/private/webapis/performance/PerformanceEntry.js`         | 37-95                           |
| PerformanceObserver          | `packages/react-native/src/private/webapis/performance/PerformanceObserver.js`      | 99-242                          |
| PerformanceMark/Measure      | `packages/react-native/src/private/webapis/performance/UserTiming.js`               | (referenced via Performance.js) |
| EventTiming                  | `packages/react-native/src/private/webapis/performance/EventTiming.js`              | 38-161                          |
| EventCounts                  | `packages/react-native/src/private/webapis/performance/EventTiming.js`              | 120-148                         |
| PerformanceLogger            | `packages/react-native/Libraries/Utilities/createPerformanceLogger.js`              | 23-329                          |
| IPerformanceLogger Interface | `packages/react-native/Libraries/Utilities/IPerformanceLogger.js`                   | 11-49                           |
| Systrace                     | `packages/react-native/Libraries/Performance/Systrace.js`                           | 33-139                          |
| MemoryInfo                   | `packages/react-native/src/private/webapis/performance/MemoryInfo.js`               | 22-57                           |
| ReactNativeStartupTiming     | `packages/react-native/src/private/webapis/performance/ReactNativeStartupTiming.js` | 24-74                           |
| NativePerformance Spec       | `packages/react-native/src/private/webapis/performance/specs/NativePerformance.js`  | 58-104                          |
| DevTools Setup               | `packages/react-native/Libraries/Core/setUpReactDevTools.js`                        | 59-258                          |
| Fiber Node Properties        | `packages/react-native/Libraries/Renderer/implementations/ReactFabric-dev.js`       | 15340-15376                     |

---

## Summary

This guide covers everything you need to build a custom performance profiler for React Native:

1. **React.Profiler**: Built-in component for measuring render performance with `onRender`, `onCommit`, and `onPostCommit` callbacks
2. **Performance API**: W3C-compliant `mark()` and `measure()` for custom timing
3. **PerformanceObserver**: Reactive API for observing performance entries as they occur
4. **PerformanceLogger**: Lightweight utility for production timing with start/stop semantics
5. **Systrace**: Native platform tracing integration for deep profiling
6. **Memory Info**: Hermes heap information for memory tracking
7. **Startup Timing**: React Native-specific app initialization metrics
8. **Event Timing**: User interaction timing with processing start/end

For your simple profiler use case (record → action → stop → save → compare):

1. Use `React.Profiler` to capture render metrics
2. Use `performance.mark/measure` for custom operation timing
3. Use `PerformanceLogger` for timespan tracking
4. Store reports with consistent schema
5. Compare reports using duration and render metrics

The complete implementation example in [Section 13.2](#132-complete-implementation-example) provides a ready-to-use profiler class that captures all relevant metrics and supports session comparison.
