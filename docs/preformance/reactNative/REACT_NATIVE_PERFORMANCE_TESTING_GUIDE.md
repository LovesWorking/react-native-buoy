# React Native Mobile Performance Testing Guide

## Table of Contents

1. [Overview](#overview)
2. [React Native Performance APIs](#react-native-performance-apis)
3. [Component & Function Performance Testing](#component--function-performance-testing)
4. [Thread-Specific Performance Monitoring](#thread-specific-performance-monitoring)
5. [Memory Profiling](#memory-profiling)
6. [Render Performance Measurement](#render-performance-measurement)
7. [Touch & Gesture Performance](#touch--gesture-performance)
8. [Native Performance Modules](#native-performance-modules)
9. [Mobile-Specific Performance Patterns](#mobile-specific-performance-patterns)
10. [Complete Mobile Examples](#complete-mobile-examples)

## Overview

This guide focuses exclusively on mobile performance testing in React Native, covering APIs and patterns specifically designed for iOS and Android performance optimization. All examples are optimized for mobile app performance monitoring in production environments.

## React Native Performance APIs

### 1. Core Performance Timing API

React Native provides a performance API optimized for mobile environments with high-resolution timing.

#### Basic Usage

```typescript
import { performance } from "react-native";

// Get current high-resolution timestamp
const startTime = performance.now();

// Perform operation
doSomeWork();

const endTime = performance.now();
const duration = endTime - startTime;
console.log(`Operation took ${duration}ms`);
```

#### Performance Marks & Measures

```typescript
// Mark specific points in time
performance.mark("myOperation-start");

// Do some work
doExpensiveOperation();

performance.mark("myOperation-end");

// Measure between marks
performance.measure("myOperation", "myOperation-start", "myOperation-end");

// Get all performance entries
const entries = performance.getEntries();
const measures = performance.getEntriesByType("measure");
const marks = performance.getEntriesByType("mark");

// Clear marks and measures
performance.clearMarks("myOperation-start");
performance.clearMeasures("myOperation");
```

#### Advanced Mark & Measure Options

```typescript
// Mark with custom timestamp and detail
performance.mark("customMark", {
  startTime: 100,
  detail: {
    component: "MyComponent",
    action: "render",
  },
});

// Measure with options
performance.measure("renderTime", {
  start: 100,
  end: 200,
  detail: {
    componentCount: 50,
  },
});

// Measure with duration
performance.measure("animationDuration", {
  start: performance.now(),
  duration: 300,
});
```

### 2. React Native Startup Timing (Mobile-Specific)

Access React Native-specific startup metrics.

```typescript
// Access startup timing (React Native specific)
const startupTiming = performance.rnStartupTiming;

if (startupTiming) {
  console.log({
    // When app started
    startTime: startupTiming.startTime,

    // When app finished loading
    endTime: startupTiming.endTime,

    // Runtime initialization
    initializeRuntimeStart: startupTiming.initializeRuntimeStart,
    initializeRuntimeEnd: startupTiming.initializeRuntimeEnd,

    // JS bundle execution
    bundleStart: startupTiming.executeJavaScriptBundleEntryPointStart,
    bundleEnd: startupTiming.executeJavaScriptBundleEntryPointEnd,
  });
}
```

### 3. Mobile Memory Monitoring

Monitor JavaScript heap usage on mobile devices.

```typescript
// Get memory info optimized for mobile
const memoryInfo = performance.memory;

if (memoryInfo) {
  const memoryMB = {
    // Convert to MB for mobile reporting
    used: memoryInfo.usedJSHeapSize / 1024 / 1024,
    total: memoryInfo.totalJSHeapSize / 1024 / 1024,
    limit: memoryInfo.jsHeapSizeLimit
      ? memoryInfo.jsHeapSizeLimit / 1024 / 1024
      : null,
  };

  // Mobile-specific memory thresholds
  const isCritical = memoryMB.used > 200; // Critical on most mobile devices
  const isWarning = memoryMB.used > 100; // Warning threshold

  if (isCritical) {
    console.error("Critical memory usage on mobile:", memoryMB);
  } else if (isWarning) {
    console.warn("High memory usage on mobile:", memoryMB);
  }
}
```

### 4. Performance Observer for Mobile Events

Monitor mobile-specific performance events.

```typescript
import { PerformanceObserver } from "react-native";

// Mobile-optimized observer
const mobileObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();

  entries.forEach((entry) => {
    // Focus on mobile-critical metrics
    if (entry.duration > 16.67) {
      // 60fps threshold
      console.warn(
        `Frame drop detected: ${entry.name} took ${entry.duration}ms`
      );
    }

    // Track mobile interactions
    if (entry.entryType === "event" && entry.interactionId) {
      trackMobileInteraction(entry);
    }
  });
});

// Observe mobile-critical events
mobileObserver.observe({
  type: "event",
  durationThreshold: 16, // Mobile frame budget
});
```

## Component & Function Performance Testing

### 1. Component Render Performance

```typescript
import React, { useEffect, useRef } from "react";
import { View, Text } from "react-native";

interface PerformanceMetrics {
  mountTime: number;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
}

function useComponentPerformance(componentName: string): PerformanceMetrics {
  const mountTimeRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);
  const renderTimesRef = useRef<number[]>([]);
  const lastRenderStartRef = useRef<number>(performance.now());

  useEffect(() => {
    // Measure mount time
    const mountEndTime = performance.now();
    const mountDuration = mountEndTime - mountTimeRef.current;

    performance.measure(`${componentName}-mount`, {
      start: mountTimeRef.current,
      end: mountEndTime,
    });

    return () => {
      // Component unmount
      performance.mark(`${componentName}-unmount`);
    };
  }, []);

  useEffect(() => {
    // Measure render time
    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - lastRenderStartRef.current;

    renderCountRef.current++;
    renderTimesRef.current.push(renderDuration);

    performance.measure(`${componentName}-render-${renderCountRef.current}`, {
      start: lastRenderStartRef.current,
      end: renderEndTime,
    });

    lastRenderStartRef.current = performance.now();
  });

  const averageRenderTime =
    renderTimesRef.current.length > 0
      ? renderTimesRef.current.reduce((a, b) => a + b, 0) /
        renderTimesRef.current.length
      : 0;

  return {
    mountTime: mountTimeRef.current,
    renderCount: renderCountRef.current,
    lastRenderTime:
      renderTimesRef.current[renderTimesRef.current.length - 1] || 0,
    averageRenderTime,
  };
}

// Usage
function MyComponent() {
  const metrics = useComponentPerformance("MyComponent");

  return (
    <View>
      <Text>Render count: {metrics.renderCount}</Text>
      <Text>Average render time: {metrics.averageRenderTime.toFixed(2)}ms</Text>
    </View>
  );
}
```

### 2. Function Performance Testing

```typescript
// Performance decorator for functions
function measurePerformance<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    performance.mark(`${name}-start`);

    try {
      const result = fn(...args);

      // Handle async functions
      if (result instanceof Promise) {
        return result.finally(() => {
          performance.mark(`${name}-end`);
          performance.measure(name, `${name}-start`, `${name}-end`);
        });
      }

      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);

      return result;
    } catch (error) {
      performance.mark(`${name}-error`);
      performance.measure(`${name}-error`, `${name}-start`, `${name}-error`);
      throw error;
    }
  }) as T;
}

// Usage
const processData = measurePerformance((data: any[]) => {
  // Heavy computation
  return data.map((item) => item * 2);
}, "processData");

const fetchData = measurePerformance(async (url: string) => {
  const response = await fetch(url);
  return response.json();
}, "fetchData");
```

### 3. Comparative Performance Testing with Statistical Analysis

```typescript
interface Stats {
  n: number;
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  stdev: number;
}

function computeStats(samples: number[]): Stats {
  const n = samples.length;
  if (n === 0)
    return {
      n: 0,
      min: 0,
      max: 0,
      mean: 0,
      median: 0,
      p95: 0,
      p99: 0,
      stdev: 0,
    };

  const sorted = [...samples].sort((a, b) => a - b);
  const sum = samples.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  // Calculate variance and standard deviation
  const variance =
    samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (n - 1 || 1);
  const stdev = Math.sqrt(variance);

  // Calculate percentiles
  const percentile = (p: number) => {
    const index = Math.ceil((p / 100) * n) - 1;
    return sorted[Math.max(0, Math.min(index, n - 1))];
  };

  return {
    n,
    min: sorted[0],
    max: sorted[n - 1],
    mean,
    median: percentile(50),
    p95: percentile(95),
    p99: percentile(99),
    stdev,
  };
}

interface BenchmarkOptions {
  warmupIterations?: number; // Default: 10
  iterations?: number; // Default: 100
  beforeEach?: () => void | Promise<void>;
  afterEach?: () => void | Promise<void>;
}

class PerformanceComparator {
  private results = new Map<string, { samples: number[]; stats: Stats }>();

  async runTest(
    name: string,
    fn: () => void | Promise<void>,
    options: BenchmarkOptions = {}
  ): Promise<{ name: string; samples: number[]; stats: Stats }> {
    const warmup = options.warmupIterations ?? 10;
    const iterations = options.iterations ?? 100;
    const samples: number[] = [];

    // Warmup phase (avoid JIT compilation noise)
    for (let i = 0; i < warmup; i++) {
      await fn();
    }

    // Actual test with optional setup/teardown
    for (let i = 0; i < iterations; i++) {
      await options.beforeEach?.();

      const start = performance.now();
      await fn();
      const end = performance.now();

      samples.push(end - start);
      await options.afterEach?.();
    }

    const stats = computeStats(samples);
    const result = { name, samples, stats };
    this.results.set(name, result);

    return result;
  }

  async compareFunctions(
    a: { name: string; fn: () => void | Promise<void> },
    b: { name: string; fn: () => void | Promise<void> },
    options?: BenchmarkOptions
  ) {
    const resultA = await this.runTest(a.name, a.fn, options);
    const resultB = await this.runTest(b.name, b.fn, options);

    // Use median for comparison (more stable than mean)
    const faster =
      resultA.stats.median <= resultB.stats.median ? a.name : b.name;
    const speedup =
      Math.max(resultA.stats.median, resultB.stats.median) /
      Math.min(resultA.stats.median, resultB.stats.median);

    return {
      A: resultA,
      B: resultB,
      faster,
      speedup: speedup.toFixed(2) + "x",
      significantDifference:
        Math.abs(resultA.stats.median - resultB.stats.median) >
        (resultA.stats.stdev + resultB.stats.stdev) / 2,
    };
  }

  getResults() {
    return Array.from(this.results.values()).sort(
      (a, b) => a.stats.median - b.stats.median
    );
  }

  reset() {
    this.results.clear();
  }
}

// Usage
const comparator = new PerformanceComparator();

await comparator.runTest("Array.map", () => {
  const arr = Array(1000).fill(0);
  arr.map((x) => x * 2);
});

await comparator.runTest("for loop", () => {
  const arr = Array(1000).fill(0);
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    result.push(arr[i] * 2);
  }
});

const comparison = comparator.compare();
console.log(`Winner: ${comparison.winner}`);
console.table(comparison.results);
```

## Thread-Specific Performance Monitoring

### 1. Mobile JS Thread Monitoring

```typescript
import { InteractionManager } from "react-native";

class MobileJSThreadMonitor {
  private frameDrops: number = 0;
  private jankFrames: number = 0;
  private lastFrameTime: number = 0;
  private isMonitoring: boolean = false;

  start() {
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.frameDrops = 0;
    this.jankFrames = 0;
    this.monitorFrame();
  }

  private monitorFrame = () => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const frameTime = currentTime - this.lastFrameTime;

    // Mobile frame budgets
    if (frameTime > 16.67) {
      // 60fps target
      this.frameDrops++;

      if (frameTime > 33.33) {
        // Severe jank (< 30fps)
        this.jankFrames++;
        console.warn(`Severe jank detected: ${frameTime.toFixed(2)}ms`);
      }
    }

    this.lastFrameTime = currentTime;
    requestAnimationFrame(this.monitorFrame);
  };

  getMetrics() {
    return {
      frameDrops: this.frameDrops,
      jankFrames: this.jankFrames,
      smoothness:
        this.frameDrops === 0 ? 100 : Math.max(0, 100 - this.frameDrops * 2),
    };
  }

  // Schedule work for idle time on mobile
  // Note: InteractionManager is considered legacy but still works
  scheduleIdleWork(task: () => void) {
    return InteractionManager.runAfterInteractions(() => {
      const start = performance.now();
      task();
      const duration = performance.now() - start;

      if (duration > 50) {
        console.warn(`Long task detected: ${duration.toFixed(2)}ms`);
      }
    });
  }
}
```

### 2. UI Thread Monitoring for Mobile Lists

```typescript
import { FillRateHelper } from "react-native";

// Monitor list scrolling performance
class ScrollPerformanceMonitor {
  private fillRateHelper?: typeof FillRateHelper;

  startMonitoring(sampleRate: number = 0.1) {
    // Set sample rate (0.0 to 1.0)
    FillRateHelper.setSampleRate(sampleRate);

    // Set minimum sample count
    FillRateHelper.setMinSampleCount(10);

    // Add listener for fill rate info
    const listener = FillRateHelper.addListener((info) => {
      console.log("Fill Rate Info:", {
        // Blank pixels metrics
        anyBlankCount: info.any_blank_count,
        anyBlankMs: info.any_blank_ms,
        mostlyBlankCount: info.mostly_blank_count,
        mostlyBlankMs: info.mostly_blank_ms,

        // Pixel metrics
        pixelsBlank: info.pixels_blank,
        pixelsSampled: info.pixels_sampled,
        pixelsScrolled: info.pixels_scrolled,

        // Time metrics
        totalTimeSpent: info.total_time_spent,
        sampleCount: info.sample_count,

        // Calculated metrics
        blankness: info.pixels_blank / info.pixels_sampled,
        avgScrollSpeed: info.pixels_scrolled / (info.total_time_spent / 1000),
      });
    });

    return listener;
  }
}
```

## Memory Profiling

### 1. Mobile Memory Tracker

```typescript
interface MobileMemorySnapshot {
  timestamp: number;
  usedMB: number;
  totalMB: number;
  percentUsed: number;
  isLowMemory: boolean;
}

class MobileMemoryProfiler {
  private snapshots: MobileMemorySnapshot[] = [];
  private interval?: NodeJS.Timeout;
  private lowMemoryThresholdMB = 50; // Mobile threshold

  startProfiling(intervalMs: number = 2000) {
    // Less frequent on mobile
    this.interval = setInterval(() => {
      const memory = performance.memory;

      if (!memory) {
        console.warn("Memory API not available");
        return;
      }

      const usedMB = (memory.usedJSHeapSize || 0) / 1024 / 1024;
      const totalMB = (memory.totalJSHeapSize || 0) / 1024 / 1024;

      const snapshot: MobileMemorySnapshot = {
        timestamp: performance.now(),
        usedMB,
        totalMB,
        percentUsed: totalMB ? (usedMB / totalMB) * 100 : 0,
        isLowMemory: totalMB - usedMB < this.lowMemoryThresholdMB,
      };

      this.snapshots.push(snapshot);

      // Mobile: Keep fewer snapshots to save memory
      if (this.snapshots.length > 30) {
        this.snapshots.shift();
      }

      // Mobile-specific memory warnings
      if (snapshot.isLowMemory) {
        console.warn("Low memory warning on mobile device");
        this.onLowMemory();
      }

      // Detect memory leaks
      this.detectMemoryLeak();
    }, intervalMs);
  }

  private onLowMemory() {
    // Trigger memory cleanup on mobile
    if (global.gc) {
      global.gc();
    }
  }

  stopProfiling() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
  }

  private detectMemoryLeak() {
    if (this.snapshots.length < 10) return;

    // Check if memory is consistently increasing on mobile
    const recent = this.snapshots.slice(-10);
    const isIncreasing = recent.every((snapshot, index) => {
      if (index === 0) return true;
      return snapshot.usedMB > recent[index - 1].usedMB;
    });

    if (isIncreasing) {
      const increase = recent[9].usedMB - recent[0].usedMB;

      // Mobile has stricter thresholds
      if (increase > 20) {
        // 20MB increase is significant on mobile
        console.error(
          `Memory leak detected on mobile: ${increase.toFixed(2)}MB increase`
        );

        performance.mark("mobile-memory-leak", {
          detail: {
            startMemoryMB: recent[0].usedMB,
            endMemoryMB: recent[9].usedMB,
            increaseMB: increase,
          },
        });
      }
    }
  }

  getStats() {
    if (this.snapshots.length === 0) return null;

    const usedValues = this.snapshots.map((s) => s.usedMB);

    return {
      current: this.snapshots[this.snapshots.length - 1],
      minMB: Math.min(...usedValues),
      maxMB: Math.max(...usedValues),
      averageMB: usedValues.reduce((a, b) => a + b, 0) / usedValues.length,
      trend: this.calculateTrend(),
      isHealthy: this.snapshots[this.snapshots.length - 1].usedMB < 150, // Mobile health threshold
    };
  }

  private calculateTrend(): "increasing" | "decreasing" | "stable" {
    if (this.snapshots.length < 2) return "stable";

    const recent = this.snapshots.slice(-Math.min(10, this.snapshots.length));
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));

    const firstAvg =
      firstHalf.reduce((a, b) => a + b.usedMB, 0) / firstHalf.length;
    const secondAvg =
      secondHalf.reduce((a, b) => a + b.usedMB, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;

    // Mobile-specific thresholds
    if (difference > 10) return "increasing"; // 10MB increase
    if (difference < -10) return "decreasing"; // 10MB decrease
    return "stable";
  }
}
```

## Render Performance Measurement

### 1. Component Render Tracker

```typescript
import React, { Component, Profiler } from "react";
import { View, Text } from "react-native";

interface RenderMetrics {
  id: string;
  phase: "mount" | "update";
  actualDuration: number;
  baseDuration: number;
  startTime: number;
  commitTime: number;
}

class RenderPerformanceTracker {
  private metrics: Map<string, RenderMetrics[]> = new Map();

  onRender = (
    id: string,
    phase: "mount" | "update",
    actualDuration: number,
    baseDuration: number,
    startTime: number,
    commitTime: number
  ) => {
    const metric: RenderMetrics = {
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
    };

    if (!this.metrics.has(id)) {
      this.metrics.set(id, []);
    }

    this.metrics.get(id)!.push(metric);

    // Log slow renders
    if (actualDuration > 16.67) {
      console.warn(
        `Slow render detected in ${id}: ${actualDuration.toFixed(2)}ms`
      );

      performance.mark(`slow-render-${id}`, {
        detail: metric,
      });
    }
  };

  getMetrics(componentId: string) {
    const metrics = this.metrics.get(componentId) || [];

    if (metrics.length === 0) return null;

    const durations = metrics.map((m) => m.actualDuration);

    return {
      renderCount: metrics.length,
      totalTime: durations.reduce((a, b) => a + b, 0),
      averageTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      minTime: Math.min(...durations),
      maxTime: Math.max(...durations),
      mountTime: metrics.find((m) => m.phase === "mount")?.actualDuration || 0,
      updateTimes: metrics
        .filter((m) => m.phase === "update")
        .map((m) => m.actualDuration),
    };
  }

  reset() {
    this.metrics.clear();
  }
}

// Usage with React Profiler
const tracker = new RenderPerformanceTracker();

function ProfiledComponent({ children }: { children: React.ReactNode }) {
  return (
    <Profiler id="MyComponent" onRender={tracker.onRender}>
      {children}
    </Profiler>
  );
}
```

### 2. Mobile FPS Monitor

```typescript
import { Platform } from "react-native";

class MobileFPSMonitor {
  private frameCount: number = 0;
  private startTime: number = 0;
  private fps: number = 0;
  private isRunning: boolean = false;
  private animationFrame?: number;
  private fpsHistory: number[] = [];

  // Mobile-specific thresholds
  private readonly TARGET_FPS = Platform.OS === "ios" ? 60 : 60; // Both support 60fps
  private readonly MIN_ACCEPTABLE_FPS = 30;
  private readonly JANK_THRESHOLD = 24; // Severe jank

  start() {
    this.isRunning = true;
    this.startTime = performance.now();
    this.frameCount = 0;
    this.measureFrame();
  }

  private measureFrame = () => {
    if (!this.isRunning) return;

    this.frameCount++;

    const currentTime = performance.now();
    const elapsed = currentTime - this.startTime;

    // Calculate FPS every second
    if (elapsed >= 1000) {
      this.fps = (this.frameCount / elapsed) * 1000;
      this.fpsHistory.push(this.fps);

      // Mobile: Keep fewer samples to save memory
      if (this.fpsHistory.length > 30) {
        this.fpsHistory.shift();
      }

      // Mobile-specific FPS warnings
      if (this.fps < this.JANK_THRESHOLD) {
        console.error(
          `Severe jank on ${Platform.OS}: ${this.fps.toFixed(1)} FPS`
        );
      } else if (this.fps < this.MIN_ACCEPTABLE_FPS) {
        console.warn(
          `Poor performance on ${Platform.OS}: ${this.fps.toFixed(1)} FPS`
        );
      }

      // Reset for next measurement
      this.frameCount = 0;
      this.startTime = currentTime;
    }

    this.animationFrame = requestAnimationFrame(this.measureFrame);
  };

  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  getPerformanceScore(): number {
    const avgFPS = this.getAverageFPS();
    // Score from 0-100 based on mobile performance
    if (avgFPS >= 55) return 100;
    if (avgFPS >= 45) return 80;
    if (avgFPS >= 30) return 60;
    if (avgFPS >= 24) return 40;
    return 20;
  }

  getCurrentFPS(): number {
    return Math.round(this.fps);
  }

  getAverageFPS(): number {
    if (this.fpsHistory.length === 0) return 0;
    return Math.round(
      this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
    );
  }

  getDroppedFrames(): number {
    // Estimate dropped frames based on target FPS
    return this.fpsHistory.filter((fps) => fps < this.TARGET_FPS * 0.95).length;
  }
}
```

## Touch & Gesture Performance

### 1. Mobile Touch Performance Tracking

```typescript
import { Platform } from "react-native";

class MobileTouchPerformanceMonitor {
  private touchStartTime: number = 0;
  private touchMetrics: Array<{
    responseTime: number;
    platform: string;
  }> = [];

  constructor() {
    this.setupTouchTracking();
  }

  private setupTouchTracking() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        if (entry.entryType === "event") {
          const eventTiming = entry as PerformanceEventTiming;

          // Mobile touch events
          if (
            eventTiming.name.includes("touch") ||
            eventTiming.name.includes("press")
          ) {
            const responseTime =
              eventTiming.processingStart - eventTiming.startTime;

            this.touchMetrics.push({
              responseTime,
              platform: Platform.OS,
            });

            // Mobile touch responsiveness thresholds
            if (responseTime > 100) {
              console.error(
                `Slow touch response on ${Platform.OS}: ${responseTime.toFixed(
                  2
                )}ms`
              );
            } else if (responseTime > 50) {
              console.warn(
                `Touch delay detected: ${responseTime.toFixed(2)}ms`
              );
            }

            // Keep only recent touches to save memory
            if (this.touchMetrics.length > 50) {
              this.touchMetrics.shift();
            }
          }
        }
      });
    });

    observer.observe({
      type: "event",
      durationThreshold: 8, // Lower threshold for mobile
    });
  }

  getAverageTouchResponse(): number {
    if (this.touchMetrics.length === 0) return 0;

    const sum = this.touchMetrics.reduce((acc, m) => acc + m.responseTime, 0);
    return sum / this.touchMetrics.length;
  }

  getTouchResponsiveness(): "excellent" | "good" | "poor" | "unresponsive" {
    const avg = this.getAverageTouchResponse();

    if (avg < 50) return "excellent";
    if (avg < 100) return "good";
    if (avg < 200) return "poor";
    return "unresponsive";
  }
}
```

### 2. Gesture Performance for Mobile

```typescript
import { PanResponder, GestureResponderEvent, Platform } from "react-native";

class MobileGesturePerformanceTracker {
  private gestureStart: number = 0;
  private gestureMoves: number[] = [];
  private frameDrops: number = 0;
  private smoothGestures: number = 0;
  private totalGestures: number = 0;

  createPanResponder() {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,

      onPanResponderGrant: (evt: GestureResponderEvent) => {
        this.gestureStart = performance.now();
        this.gestureMoves = [];
        this.frameDrops = 0;
        this.totalGestures++;

        performance.mark("mobile-gesture-start", {
          detail: {
            touches: evt.nativeEvent.touches.length,
            platform: Platform.OS,
          },
        });
      },

      onPanResponderMove: (evt: GestureResponderEvent) => {
        const moveTime = performance.now();
        const timeSinceLastMove =
          this.gestureMoves.length > 0
            ? moveTime - this.gestureMoves[this.gestureMoves.length - 1]
            : 0;

        this.gestureMoves.push(moveTime);

        // Mobile gesture smoothness detection
        if (timeSinceLastMove > 16.67) {
          // 60fps threshold
          this.frameDrops++;

          if (timeSinceLastMove > 33.33) {
            // Severe drop < 30fps
            console.warn(
              `Gesture jank on ${Platform.OS}: ${timeSinceLastMove.toFixed(
                2
              )}ms`
            );
          }
        }
      },

      onPanResponderRelease: () => {
        const gestureEnd = performance.now();
        const duration = gestureEnd - this.gestureStart;

        // Track smooth gestures for mobile UX
        if (this.frameDrops === 0) {
          this.smoothGestures++;
        }

        const smoothnessRate = (this.smoothGestures / this.totalGestures) * 100;

        performance.measure("mobile-gesture", {
          start: this.gestureStart,
          end: gestureEnd,
          detail: {
            platform: Platform.OS,
            moveCount: this.gestureMoves.length,
            frameDrops: this.frameDrops,
            duration,
            isSmooth: this.frameDrops === 0,
            overallSmoothnessRate: smoothnessRate,
          },
        });

        // Alert if gesture performance is poor
        if (this.frameDrops > 5) {
          console.error(
            `Poor gesture performance: ${this.frameDrops} frame drops`
          );
        }
      },
    });
  }

  getGestureQuality(): "smooth" | "acceptable" | "janky" {
    const smoothnessRate = (this.smoothGestures / this.totalGestures) * 100;

    if (smoothnessRate > 90) return "smooth";
    if (smoothnessRate > 70) return "acceptable";
    return "janky";
  }
}
```

## Native Performance Modules

### 1. Systrace Integration

```typescript
import { Systrace } from "react-native";

class SystraceProfiler {
  private cookie?: number;

  // Check if profiling is enabled
  isEnabled(): boolean {
    return Systrace.isEnabled();
  }

  // Start synchronous event
  beginEvent(name: string, args?: { [key: string]: any }) {
    if (this.isEnabled()) {
      Systrace.beginEvent(name, args);
    }
  }

  // End synchronous event
  endEvent(args?: { [key: string]: any }) {
    if (this.isEnabled()) {
      Systrace.endEvent(args);
    }
  }

  // Start async event
  beginAsyncEvent(name: string, args?: { [key: string]: any }): number {
    if (this.isEnabled()) {
      this.cookie = Systrace.beginAsyncEvent(name, args);
      return this.cookie;
    }
    return 0;
  }

  // End async event
  endAsyncEvent(name: string, cookie: number, args?: { [key: string]: any }) {
    if (this.isEnabled()) {
      Systrace.endAsyncEvent(name, cookie, args);
    }
  }

  // Log counter value
  counterEvent(name: string, value: number) {
    if (this.isEnabled()) {
      Systrace.counterEvent(name, value);
    }
  }

  // Wrap function with profiling
  profile<T extends (...args: any[]) => any>(fn: T, name: string): T {
    return ((...args: Parameters<T>) => {
      if (!this.isEnabled()) {
        return fn(...args);
      }

      this.beginEvent(name);

      try {
        const result = fn(...args);

        if (result instanceof Promise) {
          const cookie = this.beginAsyncEvent(`${name}-async`);
          return result.finally(() => {
            this.endAsyncEvent(`${name}-async`, cookie);
          });
        }

        return result;
      } finally {
        this.endEvent();
      }
    }) as T;
  }
}
```

## Mobile-Specific Performance Patterns

### 1. Mobile Performance Budget Manager

```typescript
import { Platform } from "react-native";

interface MobilePerformanceBudget {
  componentRender?: number;
  listScroll?: number;
  navigation?: number;
  imageLoad?: number;
  touch?: number;
  memoryMB?: number;
}

class MobilePerformanceBudgetManager {
  private budgets: MobilePerformanceBudget;
  private violations: Array<{
    type: string;
    expected: number;
    actual: number;
    platform: string;
    timestamp: number;
  }> = [];

  // Mobile-optimized default budgets
  private static DEFAULT_BUDGETS: MobilePerformanceBudget = {
    componentRender: 16, // 60fps
    listScroll: 8, // Smooth scrolling
    navigation: 300, // Screen transition
    imageLoad: 200, // Image loading
    touch: 100, // Touch response
    memoryMB: 150, // Memory usage
  };

  constructor(budgets?: Partial<MobilePerformanceBudget>) {
    this.budgets = {
      ...MobilePerformanceBudgetManager.DEFAULT_BUDGETS,
      ...budgets,
    };
    this.setupMobileObservers();
  }

  private setupMobileObservers() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();

      entries.forEach((entry) => {
        this.checkMobileBudget(entry);
      });
    });

    observer.observe({ entryTypes: ["measure", "event"] });

    // Monitor memory separately for mobile
    this.monitorMemory();
  }

  private checkMobileBudget(entry: PerformanceEntry) {
    let budget: number | undefined;
    let type: string = entry.name;

    // Mobile-specific budget categories
    if (entry.name.includes("render") || entry.name.includes("component")) {
      budget = this.budgets.componentRender;
      type = "componentRender";
    } else if (entry.name.includes("scroll") || entry.name.includes("list")) {
      budget = this.budgets.listScroll;
      type = "listScroll";
    } else if (
      entry.name.includes("navigation") ||
      entry.name.includes("screen")
    ) {
      budget = this.budgets.navigation;
      type = "navigation";
    } else if (entry.name.includes("image")) {
      budget = this.budgets.imageLoad;
      type = "imageLoad";
    } else if (entry.name.includes("touch") || entry.name.includes("press")) {
      budget = this.budgets.touch;
      type = "touch";
    }

    if (budget && entry.duration > budget) {
      const violation = {
        type,
        expected: budget,
        actual: entry.duration,
        platform: Platform.OS,
        timestamp: performance.now(),
      };

      this.violations.push(violation);

      // Mobile-specific severity
      const severity = entry.duration > budget * 2 ? "critical" : "warning";

      if (severity === "critical") {
        console.error(
          `Critical performance violation on ${Platform.OS}:`,
          violation
        );
      } else {
        console.warn(
          `Performance budget exceeded on ${Platform.OS}:`,
          violation
        );
      }

      this.reportViolation(violation, severity);
    }
  }

  private monitorMemory() {
    setInterval(() => {
      const memory = performance.memory;
      if (memory && this.budgets.memoryMB) {
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;

        if (usedMB > this.budgets.memoryMB) {
          const violation = {
            type: "memory",
            expected: this.budgets.memoryMB,
            actual: usedMB,
            platform: Platform.OS,
            timestamp: performance.now(),
          };

          this.violations.push(violation);
          console.error(
            `Memory budget exceeded on ${Platform.OS}: ${usedMB.toFixed(2)}MB`
          );
        }
      }
    }, 5000); // Check every 5 seconds on mobile
  }

  private reportViolation(violation: any, severity: string) {
    performance.mark(`mobile-budget-violation-${severity}`, {
      detail: violation,
    });
  }

  getViolationRate(): number {
    // Calculate violation rate for mobile performance score
    return this.violations.length;
  }

  getMobileHealthScore(): number {
    // 0-100 score based on violations
    const violationCount = this.violations.length;
    if (violationCount === 0) return 100;
    if (violationCount < 5) return 80;
    if (violationCount < 10) return 60;
    if (violationCount < 20) return 40;
    return 20;
  }
}
```

### 2. Automated Performance Testing

```typescript
interface PerformanceTest {
  name: string;
  fn: () => void | Promise<void>;
  maxDuration: number;
  minIterations?: number;
}

class PerformanceTestRunner {
  private tests: PerformanceTest[] = [];
  private results: Map<string, any> = new Map();

  addTest(test: PerformanceTest) {
    this.tests.push(test);
  }

  async runAll(): Promise<Map<string, any>> {
    for (const test of this.tests) {
      await this.runTest(test);
    }

    return this.results;
  }

  private async runTest(test: PerformanceTest) {
    const iterations = test.minIterations || 10;
    const durations: number[] = [];
    let passed = true;

    // Warm up
    for (let i = 0; i < 3; i++) {
      await test.fn();
    }

    // Run test iterations
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await test.fn();
      const duration = performance.now() - start;

      durations.push(duration);

      if (duration > test.maxDuration) {
        passed = false;
      }
    }

    const result = {
      name: test.name,
      passed,
      iterations,
      maxAllowed: test.maxDuration,
      durations,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p95: this.percentile(durations, 0.95),
      p99: this.percentile(durations, 0.99),
    };

    this.results.set(test.name, result);

    if (!passed) {
      console.error(`Performance test failed: ${test.name}`, result);
    }

    return result;
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[index];
  }
}
```

## Complete Mobile Examples

### Example 1: Mobile Performance Monitor Component

```typescript
import React, { useEffect, useState, useRef } from "react";
import { View, Text, ScrollView, StyleSheet, Platform } from "react-native";

interface MobilePerformanceData {
  fps: number;
  fpsStatus: "good" | "warning" | "critical";
  memoryMB: number;
  memoryStatus: "healthy" | "warning" | "critical";
  touchResponseMs: number;
  jankFrames: number;
  platform: string;
}

export function MobilePerformanceMonitor({
  enabled = true,
}: {
  enabled?: boolean;
}) {
  const [data, setData] = useState<MobilePerformanceData>({
    fps: 0,
    fpsStatus: "good",
    memoryMB: 0,
    memoryStatus: "healthy",
    touchResponseMs: 0,
    jankFrames: 0,
    platform: Platform.OS,
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const jankCount = useRef(0);
  const animationFrame = useRef<number>();

  useEffect(() => {
    if (!enabled) return;

    // Mobile FPS Monitor
    const measureFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastTime.current;

      // Detect jank frames
      if (delta > 33.33) {
        // < 30fps
        jankCount.current++;
      }

      if (delta >= 1000) {
        const fps = (frameCount.current / delta) * 1000;
        frameCount.current = 0;
        lastTime.current = now;

        // Determine FPS status for mobile
        let fpsStatus: "good" | "warning" | "critical" = "good";
        if (fps < 24) fpsStatus = "critical";
        else if (fps < 45) fpsStatus = "warning";

        setData((prev) => ({
          ...prev,
          fps: Math.round(fps),
          fpsStatus,
          jankFrames: jankCount.current,
        }));

        jankCount.current = 0;
      }

      animationFrame.current = requestAnimationFrame(measureFPS);
    };

    measureFPS();

    // Mobile Memory Monitor
    const memoryInterval = setInterval(() => {
      const memory = performance.memory;
      if (memory) {
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;

        // Mobile memory thresholds
        let memoryStatus: "healthy" | "warning" | "critical" = "healthy";
        if (usedMB > 200) memoryStatus = "critical";
        else if (usedMB > 100) memoryStatus = "warning";

        setData((prev) => ({
          ...prev,
          memoryMB: Math.round(usedMB),
          memoryStatus,
        }));
      }
    }, 2000); // Less frequent on mobile

    // Touch Response Monitor
    const touchObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const touchEvents = entries.filter(
        (e) =>
          e.entryType === "event" &&
          (e.name.includes("touch") || e.name.includes("press"))
      );

      if (touchEvents.length > 0) {
        const avgResponse =
          touchEvents.reduce(
            (sum, e) => sum + (e.processingStart - e.startTime),
            0
          ) / touchEvents.length;

        setData((prev) => ({
          ...prev,
          touchResponseMs: Math.round(avgResponse),
        }));
      }
    });

    touchObserver.observe({ type: "event", durationThreshold: 8 });

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      clearInterval(memoryInterval);
      touchObserver.disconnect();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mobile Performance ({data.platform})</Text>

      <View style={styles.row}>
        <Text style={styles.label}>FPS:</Text>
        <Text
          style={[
            styles.value,
            data.fpsStatus === "warning" && styles.warning,
            data.fpsStatus === "critical" && styles.critical,
          ]}
        >
          {data.fps} {data.fpsStatus !== "good" && `(${data.fpsStatus})`}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Memory:</Text>
        <Text
          style={[
            styles.value,
            data.memoryStatus === "warning" && styles.warning,
            data.memoryStatus === "critical" && styles.critical,
          ]}
        >
          {data.memoryMB}MB
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Touch Response:</Text>
        <Text
          style={[styles.value, data.touchResponseMs > 100 && styles.warning]}
        >
          {data.touchResponseMs}ms
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Jank Frames:</Text>
        <Text style={[styles.value, data.jankFrames > 0 && styles.warning]}>
          {data.jankFrames}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 10,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    padding: 10,
    borderRadius: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  label: {
    color: "#cccccc",
    fontSize: 12,
  },
  value: {
    color: "#4CAF50",
    fontSize: 12,
    fontWeight: "600",
  },
  warning: {
    color: "#FFC107",
  },
  critical: {
    color: "#F44336",
  },
});
```

### Example 2: Mobile Performance Testing Hook

```typescript
import { useEffect, useRef, useCallback } from "react";
import { Platform, AppState } from "react-native";

interface MobilePerformanceOptions {
  trackRenders?: boolean;
  trackMemory?: boolean;
  trackAppState?: boolean;
  frameThreshold?: number;
}

interface MobileMetrics {
  renderCount: number;
  avgRenderTime: number;
  slowRenders: number;
  memoryMB: number;
  appStateChanges: number;
  performanceScore: number;
}

export function useMobilePerformance(
  componentName: string,
  options: MobilePerformanceOptions = {}
): [
  MobileMetrics,
  (name: string, fn: () => void | Promise<void>) => Promise<void>
] {
  const {
    trackRenders = true,
    trackMemory = true,
    trackAppState = true,
    frameThreshold = 16.67,
  } = options;

  const metrics = useRef<MobileMetrics>({
    renderCount: 0,
    avgRenderTime: 0,
    slowRenders: 0,
    memoryMB: 0,
    appStateChanges: 0,
    performanceScore: 100,
  });

  const renderTimes = useRef<number[]>([]);
  const renderStart = useRef<number>(performance.now());

  // Track renders
  useEffect(() => {
    if (!trackRenders) return;

    const renderEnd = performance.now();
    const duration = renderEnd - renderStart.current;

    metrics.current.renderCount++;
    renderTimes.current.push(duration);

    // Mobile: Keep fewer samples
    if (renderTimes.current.length > 20) {
      renderTimes.current.shift();
    }

    if (duration > frameThreshold) {
      metrics.current.slowRenders++;

      if (Platform.OS === "ios" && duration > 33.33) {
        console.warn(
          `Slow iOS render in ${componentName}: ${duration.toFixed(2)}ms`
        );
      } else if (Platform.OS === "android" && duration > 16.67) {
        console.warn(
          `Slow Android render in ${componentName}: ${duration.toFixed(2)}ms`
        );
      }
    }

    metrics.current.avgRenderTime =
      renderTimes.current.reduce((a, b) => a + b, 0) /
      renderTimes.current.length;

    // Calculate performance score
    const slowRenderRatio =
      metrics.current.slowRenders / metrics.current.renderCount;
    metrics.current.performanceScore = Math.max(
      0,
      Math.round(100 - slowRenderRatio * 100)
    );

    renderStart.current = performance.now();
  });

  // Track memory
  useEffect(() => {
    if (!trackMemory) return;

    const checkMemory = () => {
      const memory = performance.memory;
      if (memory) {
        metrics.current.memoryMB = Math.round(
          memory.usedJSHeapSize / 1024 / 1024
        );
      }
    };

    const interval = setInterval(checkMemory, 3000); // Less frequent on mobile
    return () => clearInterval(interval);
  }, [trackMemory]);

  // Track app state changes
  useEffect(() => {
    if (!trackAppState) return;

    const handleAppStateChange = (nextAppState: string) => {
      metrics.current.appStateChanges++;

      performance.mark(`${componentName}-appstate-${nextAppState}`, {
        detail: {
          componentName,
          appState: nextAppState,
          platform: Platform.OS,
        },
      });
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [trackAppState, componentName]);

  const measureAsync = useCallback(
    async (name: string, fn: () => void | Promise<void>) => {
      const start = performance.now();

      try {
        await fn();
      } finally {
        const duration = performance.now() - start;

        // Mobile-specific thresholds
        const isSlowOperation =
          Platform.OS === "ios" ? duration > 100 : duration > 150; // Android typically needs more time

        if (isSlowOperation) {
          console.warn(
            `Slow operation "${name}" on ${Platform.OS}: ${duration.toFixed(
              2
            )}ms`
          );
        }

        performance.measure(`${componentName}-${name}`, {
          start,
          duration,
          detail: {
            componentName,
            operationName: name,
            platform: Platform.OS,
            isSlow: isSlowOperation,
          },
        });
      }
    },
    [componentName]
  );

  return [metrics.current, measureAsync];
}

// Usage Example
function MobileComponent() {
  const [metrics, measure] = useMobilePerformance("MobileComponent", {
    trackMemory: true,
    trackAppState: true,
    frameThreshold: Platform.OS === "ios" ? 16.67 : 20, // Adjust per platform
  });

  const handlePress = async () => {
    await measure("fetchData", async () => {
      const response = await fetch("/api/data");
      await response.json();
    });
  };

  return (
    <View>
      <Text>Performance Score: {metrics.performanceScore}%</Text>
      <Text>Memory: {metrics.memoryMB}MB</Text>
      <Text>
        Slow Renders: {metrics.slowRenders}/{metrics.renderCount}
      </Text>
      <Button title="Fetch Data" onPress={handlePress} />
    </View>
  );
}
```

## Unified Performance Testing Suite

### Complete All-in-One Performance Suite

```typescript
 ;
import { Platform } from "react-native";

export interface FunctionTestCase {
  name: string;
  fn: () => void | Promise<void>;
  expectedMaxMs?: number;
}

export interface ComponentTestCase {
  id: string;
  render: () => React.ReactElement;
  updates?: number;
  triggerUpdate?: () => void | Promise<void>;
  expectedMountMs?: number;
  expectedUpdateMs?: number;
}

export interface PerformanceSuiteOptions {
  warmupIterations?: number;
  testIterations?: number;
  enableMemoryTracking?: boolean;
  enableFPSTracking?: boolean;
  platform?: "ios" | "android";
}

export interface SuiteResults {
  platform: string;
  timestamp: number;
  functions?: Array<{
    name: string;
    stats: Stats;
    passed: boolean;
  }>;
  components?: Array<{
    id: string;
    mountMs: number;
    updateStats?: Stats;
    passed: boolean;
  }>;
  memory?: {
    startMB: number;
    endMB: number;
    peakMB: number;
    growthMB: number;
  };
  fps?: {
    average: number;
    min: number;
    droppedFrames: number;
  };
  overallScore: number;
}

export class UnifiedPerformanceSuite {
  private functionTests: FunctionTestCase[] = [];
  private componentTests: ComponentTestCase[] = [];
  private options: Required<PerformanceSuiteOptions>;
  private memoryProfiler?: MobileMemoryProfiler;
  private fpsMonitor?: MobileFPSMonitor;

  constructor(options: PerformanceSuiteOptions = {}) {
    this.options = {
      warmupIterations: options.warmupIterations ?? 10,
      testIterations: options.testIterations ?? 100,
      enableMemoryTracking: options.enableMemoryTracking ?? true,
      enableFPSTracking: options.enableFPSTracking ?? true,
      platform: options.platform ?? (Platform.OS as "ios" | "android"),
    };

    if (this.options.enableMemoryTracking) {
      this.memoryProfiler = new MobileMemoryProfiler();
    }

    if (this.options.enableFPSTracking) {
      this.fpsMonitor = new MobileFPSMonitor();
    }
  }

  addFunctionTest(test: FunctionTestCase) {
    this.functionTests.push(test);
    return this;
  }

  addComponentTest(test: ComponentTestCase) {
    this.componentTests.push(test);
    return this;
  }

  async run(): Promise<SuiteResults> {
    const startTime = performance.now();
    const results: SuiteResults = {
      platform: this.options.platform,
      timestamp: Date.now(),
      functions: [],
      components: [],
      overallScore: 100,
    };

    // Start monitoring
    this.memoryProfiler?.startProfiling(1000);
    this.fpsMonitor?.start();

    // Run function tests
    for (const test of this.functionTests) {
      const comparator = new PerformanceComparator();
      const result = await comparator.runTest(test.name, test.fn, {
        warmupIterations: this.options.warmupIterations,
        iterations: this.options.testIterations,
      });

      const passed = test.expectedMaxMs
        ? result.stats.median <= test.expectedMaxMs
        : true;

      results.functions?.push({
        name: test.name,
        stats: result.stats,
        passed,
      });

      if (!passed) results.overallScore -= 10;
    }

    // Run component tests
    for (const test of this.componentTests) {
      const tracker = new RenderPerformanceTracker();

      // Mount timing
      const mountStart = performance.now();
      // In real app, render the component with Profiler wrapper
      const mountMs = performance.now() - mountStart;

      // Update timings
      const updateSamples: number[] = [];
      const updates = test.updates ?? 10;

      for (let i = 0; i < updates; i++) {
        const updateStart = performance.now();
        await test.triggerUpdate?.();
        updateSamples.push(performance.now() - updateStart);
      }

      const updateStats =
        updateSamples.length > 0 ? computeStats(updateSamples) : undefined;

      const mountPassed = test.expectedMountMs
        ? mountMs <= test.expectedMountMs
        : true;

      const updatePassed =
        test.expectedUpdateMs && updateStats
          ? updateStats.median <= test.expectedUpdateMs
          : true;

      results.components?.push({
        id: test.id,
        mountMs,
        updateStats,
        passed: mountPassed && updatePassed,
      });

      if (!mountPassed || !updatePassed) results.overallScore -= 15;
    }

    // Stop monitoring and collect results
    this.memoryProfiler?.stopProfiling();
    this.fpsMonitor?.stop();

    // Memory results
    if (this.memoryProfiler) {
      const stats = this.memoryProfiler.getStats();
      if (stats) {
        results.memory = {
          startMB: stats.minMB,
          endMB: stats.current.usedMB,
          peakMB: stats.maxMB,
          growthMB: stats.current.usedMB - stats.minMB,
        };

        if (!stats.isHealthy) results.overallScore -= 20;
      }
    }

    // FPS results
    if (this.fpsMonitor) {
      results.fps = {
        average: this.fpsMonitor.getAverageFPS(),
        min: this.fpsMonitor.getCurrentFPS(),
        droppedFrames: this.fpsMonitor.getDroppedFrames(),
      };

      const perfScore = this.fpsMonitor.getPerformanceScore();
      if (perfScore < 60) results.overallScore -= 25;
    }

    results.overallScore = Math.max(0, results.overallScore);

    return results;
  }

  generateReport(results: SuiteResults): string {
    const lines: string[] = [
      `# Performance Test Report`,
      `Platform: ${results.platform}`,
      `Date: ${new Date(results.timestamp).toISOString()}`,
      `Overall Score: ${results.overallScore}/100`,
      "",
    ];

    if (results.functions && results.functions.length > 0) {
      lines.push("## Function Tests");
      results.functions.forEach((f) => {
        const status = f.passed ? "✅" : "❌";
        lines.push(
          `- ${status} ${f.name}: ${f.stats.median.toFixed(
            2
          )}ms (p95: ${f.stats.p95.toFixed(2)}ms)`
        );
      });
      lines.push("");
    }

    if (results.components && results.components.length > 0) {
      lines.push("## Component Tests");
      results.components.forEach((c) => {
        const status = c.passed ? "✅" : "❌";
        lines.push(`- ${status} ${c.id}: Mount ${c.mountMs.toFixed(2)}ms`);
        if (c.updateStats) {
          lines.push(
            `  Update: ${c.updateStats.median.toFixed(
              2
            )}ms (p95: ${c.updateStats.p95.toFixed(2)}ms)`
          );
        }
      });
      lines.push("");
    }

    if (results.memory) {
      lines.push("## Memory Usage");
      lines.push(`- Start: ${results.memory.startMB.toFixed(1)}MB`);
      lines.push(`- Peak: ${results.memory.peakMB.toFixed(1)}MB`);
      lines.push(`- End: ${results.memory.endMB.toFixed(1)}MB`);
      lines.push(`- Growth: ${results.memory.growthMB.toFixed(1)}MB`);
      lines.push("");
    }

    if (results.fps) {
      lines.push("## Frame Rate");
      lines.push(`- Average: ${results.fps.average} FPS`);
      lines.push(`- Dropped Frames: ${results.fps.droppedFrames}`);
      lines.push("");
    }

    return lines.join("\n");
  }
}

// Usage Example
const suite = new UnifiedPerformanceSuite({
  platform: Platform.OS as "ios" | "android",
  enableMemoryTracking: true,
  enableFPSTracking: true,
});

suite
  .addFunctionTest({
    name: "Array.map vs for loop",
    fn: async () => {
      const arr = Array(1000).fill(0);
      arr.map((x) => x * 2);
    },
    expectedMaxMs: 5,
  })
  .addComponentTest({
    id: "MyList",
    render: () => <MyList items={data} />,
    updates: 20,
    triggerUpdate: async () => {
      // Trigger re-render
    },
    expectedMountMs: 50,
    expectedUpdateMs: 16.67,
  });

const results = await suite.run();
console.log(suite.generateReport(results));
```

## Summary

This guide provides a comprehensive overview of mobile-specific performance testing in React Native, focusing on iOS and Android optimization. Key features include:

### Mobile Performance APIs

1. **Performance Timing API** - High-resolution timing for mobile operations
2. **React Native Startup Timing** - Mobile app launch metrics
3. **Memory Monitoring** - Mobile-optimized memory tracking with MB thresholds
4. **Performance Observer** - Event monitoring with mobile frame budgets

### Mobile-Specific Monitoring

1. **JS Thread Monitoring** - Frame drop and jank detection
2. **UI Thread Monitoring** - List scrolling and render performance
3. **Touch Performance** - Gesture responsiveness tracking
4. **FPS Monitoring** - Platform-specific frame rate analysis

### Mobile Optimization Tools

1. **Memory Profiler** - Low memory detection and cleanup triggers
2. **Performance Budgets** - Mobile-specific thresholds for components, scrolling, navigation
3. **Gesture Tracking** - Smooth gesture detection and frame drop analysis
4. **Platform-Specific Metrics** - iOS and Android optimized thresholds

### Key Mobile Thresholds

- **FPS**: 60fps target, 30fps minimum acceptable, 24fps critical
- **Memory**: 100MB warning, 200MB critical
- **Touch Response**: 50ms excellent, 100ms good, 200ms poor
- **Render Time**: 16.67ms for 60fps on both platforms
- **Navigation**: 300ms maximum for screen transitions

All examples are optimized for mobile devices with consideration for:

- Battery consumption (less frequent monitoring)
- Memory constraints (fewer stored samples)
- Platform differences (iOS vs Android thresholds)
- Mobile-specific interactions (touch, gestures, app state)

The APIs and patterns provided are production-ready and accessible in all React Native mobile applications without requiring debug mode or special permissions.

## Best Practices and Common Pitfalls

### Best Practices

1. **Use Release Builds** - Always test performance on release builds; dev builds add significant overhead
2. **Test on Real Devices** - Simulators/emulators don't reflect real device performance
3. **Multiple Iterations** - Run at least 100 iterations and use median/p95 instead of mean
4. **Warmup Phase** - Include 10+ warmup iterations to avoid JIT compilation noise
5. **Statistical Analysis** - Use standard deviation to determine if differences are significant
6. **Stable Component Trees** - Keep component structure stable during profiling
7. **Feature Detection** - Always check for API availability (`performance.mark`, `performance.memory`)
8. **Platform-Specific Thresholds** - iOS and Android have different performance characteristics

### Common Pitfalls to Avoid

1. **Avoid Console Logging in Hot Paths** - Log summaries after test runs, not during
2. **InteractionManager is Legacy** - Still works but considered deprecated; use with caution
3. **Memory API Availability** - Not available in all JS engines; always feature-detect
4. **Dev Mode Overhead** - Never measure performance in `__DEV__` mode
5. **Conditional JSX Changes** - Avoid structure changes during profiling
6. **Single Sample Measurements** - Never rely on a single measurement; outliers are common
7. **Averaging Without Context** - Mean can be misleading; prefer median for stability

### Platform-Specific Considerations

- **iOS**: Generally more consistent performance, stricter memory limits
- **Android**: More device variation, garbage collection pauses, larger memory allowances
- **Frame Budget**: Both platforms target 60fps (16.67ms per frame)
- **Memory Warnings**: iOS ~200MB critical, Android ~300MB critical (device-dependent)
