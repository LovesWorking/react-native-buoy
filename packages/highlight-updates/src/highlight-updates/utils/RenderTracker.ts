/**
 * RenderTracker
 *
 * Singleton that tracks component render history for the Highlight Updates modal.
 * Stores information about each tracked component including render counts,
 * timestamps, and identifying props (testID, nativeID, etc.)
 */

"use strict";

import { getComponentDisplayName } from "./ViewTypeMapper";
import { PerformanceLogger } from "./PerformanceLogger";

/**
 * Debug logging levels for render cause detection.
 * Controls verbosity of console output for debugging "Why Did You Render" feature.
 *
 * - "off": No debug logging (default, best for production)
 * - "minimal": Only log state/hook value changes (e.g., "useState: 3334 → 3335")
 * - "verbose": Log component info + cause + value changes
 * - "all": Full fiber dump with everything (native fiber, component fiber, hooks, batch context)
 */
export type DebugLogLevel = "off" | "minimal" | "verbose" | "all";

// Render cause types - why did a component render?
export type RenderCauseType =
  | "mount" // First render
  | "props" // Props changed
  | "state" // State changed (class components)
  | "hooks" // Hooks changed (useState, useReducer, etc.)
  | "context" // Context changed (future)
  | "parent" // Parent component re-rendered
  | "unknown"; // Could not determine

// Component-level cause - why did the React component re-render?
export type ComponentCauseType =
  | "mount" // First render
  | "props" // Component received different props
  | "state" // Component's own state changed (useState/useReducer)
  | "parent" // Parent component re-rendered (no prop/state changes)
  | "unknown"; // Could not determine

/**
 * Represents a change in a single hook's state
 * Used to show meaningful before/after values for debugging
 */
export interface HookStateChange {
  /** Hook index in the linked list (0-based) */
  index: number;
  /** Detected hook type */
  type: 'useState' | 'useReducer' | 'useRef' | 'useMemo' | 'useCallback' | 'useEffect' | 'unknown';
  /** Previous value (if available) */
  previousValue?: any;
  /** Current value */
  currentValue?: any;
  /** Human-readable description of the change */
  description?: string;
}

export interface RenderCause {
  type: RenderCauseType;
  changedKeys?: string[]; // For props: ["onClick", "style"]
  hookIndices?: number[]; // For hooks: [0, 2] = first and third hook
  /** Detailed hook state changes with actual values (Phase 3 enhancement) */
  hookChanges?: HookStateChange[];
  timestamp: number;
  // Two-level causation: component-level cause (why React component rendered)
  componentCause?: ComponentCauseType;
  componentName?: string; // The React component that owns this native view
}

/**
 * A single render event in the history
 * Captures everything about one render occurrence
 */
export interface RenderEvent {
  id: string; // Unique event ID (nativeTag-timestamp)
  timestamp: number; // When this render occurred
  cause: RenderCause; // Why it rendered (two-level causation)

  // Captured state at this render (for diff visualization)
  // Only populated when enableRenderHistory is true
  capturedProps?: Record<string, any>;
  capturedState?: any;

  // Render number at this event (e.g., 5th render)
  renderNumber: number;
}

export interface TrackedRender {
  id: string; // nativeTag as string for Map key
  nativeTag: number;
  viewType: string; // "RCTView", "RCTText", etc. (native class name)
  displayName: string; // "View", "Text", etc. (developer-friendly name)
  testID?: string;
  nativeID?: string;
  accessibilityLabel?: string;
  componentName?: string; // from fiberDebugOwner
  renderCount: number;
  firstRenderTime: number;
  lastRenderTime: number;
  measurements?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  color: string; // Current highlight color
  // Render cause tracking
  lastRenderCause?: RenderCause;

  // Render history (for event stepping and diff visualization)
  // Only populated when enableRenderHistory setting is true
  renderHistory?: RenderEvent[];
}

export type FilterType = "any" | "viewType" | "testID" | "nativeID" | "component" | "accessibilityLabel";

export interface FilterPattern {
  type: FilterType;
  value: string;
}

export interface FilterConfig {
  // Include-only patterns (show ONLY these if set)
  includeTestID: Set<string>;
  includeNativeID: Set<string>;
  includeViewType: Set<string>;
  includeComponent: Set<string>;

  // Exclude patterns (hide these)
  excludeTestID: Set<string>;
  excludeNativeID: Set<string>;
  excludeViewType: Set<string>;
  excludeComponent: Set<string>;

  // New unified pattern lists
  includePatterns: FilterPattern[];
  excludePatterns: FilterPattern[];
}

type RenderTrackerListener = (renders: TrackedRender[]) => void;
type StateListener = (state: { isTracking: boolean; isPaused: boolean }) => void;
type SettingsListener = (settings: RenderTrackerSettings) => void;

// Maximum number of tracked components to prevent memory issues
const MAX_TRACKED_COMPONENTS = 200;

// Default batch size for highlight rendering
const DEFAULT_BATCH_SIZE = 150;

export interface RenderTrackerSettings {
  /**
   * Maximum number of components to highlight per batch.
   * Higher values show more highlights but may impact performance.
   * Range: 10-500, Default: 150
   */
  batchSize: number;
  /**
   * Whether to show and track render counts on highlight badges.
   * Disabling this improves performance by skipping count tracking.
   * Default: true
   */
  showRenderCount: boolean;
  /**
   * Whether to enable performance logging to the console.
   * Logs detailed timing metrics for each batch of highlights.
   * Useful for debugging and optimization.
   * Default: false
   */
  performanceLogging: boolean;
  /**
   * Whether to track and display render causes (why components rendered).
   * Detects props changes, hooks changes, parent re-renders, and first mounts.
   * Adds ~2-5% performance overhead and stores previous component state in memory.
   * Requires showRenderCount to be enabled.
   * Default: false
   */
  trackRenderCauses: boolean;

  // === Render History Settings ===

  /**
   * Whether to enable render history tracking.
   * When enabled, stores a history of render events per component for
   * event stepping and diff visualization. Has memory and performance overhead.
   * Requires trackRenderCauses to be enabled.
   * Default: false
   */
  enableRenderHistory: boolean;
  /**
   * Maximum number of render events to store per component.
   * Older events are discarded when this limit is reached.
   * Range: 5-50, Default: 20
   */
  maxRenderHistoryPerComponent: number;
  /**
   * Whether to capture props at each render for diff visualization.
   * Enabling this allows comparing props between renders but increases
   * memory usage significantly. Only effective when enableRenderHistory is true.
   * Default: false
   */
  capturePropsOnRender: boolean;
  /**
   * Whether to capture state at each render for diff visualization.
   * Enabling this allows comparing state between renders but increases
   * memory usage. Only effective when enableRenderHistory is true.
   * Default: false
   */
  captureStateOnRender: boolean;

  // === Debug Settings ===

  /**
   * Debug logging level for render cause detection.
   * Controls console output verbosity for "Why Did You Render" debugging.
   *
   * - "off": No debug logging (default)
   * - "minimal": Only state/hook value changes (e.g., "useState: 3334 → 3335")
   * - "verbose": Component info + cause + value changes
   * - "all": Full fiber dump with everything
   *
   * Default: "off"
   */
  debugLogLevel: DebugLogLevel;

  /**
   * @deprecated Use debugLogLevel instead. Kept for backward compatibility.
   * When true, equivalent to debugLogLevel: "all"
   */
  debugRawFiberLogging: boolean;
}

class RenderTrackerSingleton {
  private renders: Map<string, TrackedRender> = new Map();
  private listeners: Set<RenderTrackerListener> = new Set();
  private stateListeners: Set<StateListener> = new Set();
  private settingsListeners: Set<SettingsListener> = new Set();
  private isTracking: boolean = false;
  private isPaused: boolean = false;
  private settings: RenderTrackerSettings = {
    batchSize: DEFAULT_BATCH_SIZE,
    showRenderCount: true,
    performanceLogging: false,
    trackRenderCauses: false,
    // History settings (opt-in for performance)
    enableRenderHistory: false,
    maxRenderHistoryPerComponent: 20,
    capturePropsOnRender: false,
    captureStateOnRender: false,
    // Debug settings
    debugLogLevel: "off",
    debugRawFiberLogging: false, // deprecated, use debugLogLevel
  };

  // Batch mode: defer notifyListeners until endBatch is called
  private isBatchMode: boolean = false;
  private batchDirty: boolean = false;
  private filters: FilterConfig = {
    includeTestID: new Set(),
    includeNativeID: new Set(),
    includeViewType: new Set(),
    includeComponent: new Set(),
    excludeTestID: new Set(),
    excludeNativeID: new Set(),
    excludeViewType: new Set(),
    excludeComponent: new Set(),
    includePatterns: [],
    excludePatterns: [],
  };

  /**
   * Track a component render
   */
  trackRender(data: {
    nativeTag: number;
    viewType: string;
    testID?: string;
    nativeID?: string;
    accessibilityLabel?: string;
    componentName?: string;
    measurements?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    color: string;
    count: number;
    renderCause?: RenderCause;
    // Optional captured snapshots for history
    capturedProps?: Record<string, any>;
    capturedState?: any;
  }): void {
    if (this.isPaused) return;

    const id = String(data.nativeTag);
    const now = Date.now();

    const existing = this.renders.get(id);

    if (existing) {
      // Mutate in place to keep Map entry correct
      existing.renderCount = data.count;
      existing.lastRenderTime = now;
      existing.color = data.color;
      if (data.measurements) {
        existing.measurements = data.measurements;
      }
      // Update props if they weren't set before
      if (data.testID && !existing.testID) existing.testID = data.testID;
      if (data.nativeID && !existing.nativeID) existing.nativeID = data.nativeID;
      if (data.accessibilityLabel && !existing.accessibilityLabel) {
        existing.accessibilityLabel = data.accessibilityLabel;
      }
      if (data.componentName && !existing.componentName) {
        existing.componentName = data.componentName;
      }
      // Update render cause if provided
      if (data.renderCause) {
        existing.lastRenderCause = data.renderCause;
      }

      // Add to render history if enabled
      if (this.settings.enableRenderHistory && data.renderCause) {
        this.addRenderEvent(existing, data.renderCause, data.capturedProps, data.capturedState);
      }
    } else {
      // Add new render
      const newRender: TrackedRender = {
        id,
        nativeTag: data.nativeTag,
        viewType: data.viewType,
        displayName: getComponentDisplayName(data.viewType),
        testID: data.testID,
        nativeID: data.nativeID,
        accessibilityLabel: data.accessibilityLabel,
        componentName: data.componentName,
        renderCount: data.count,
        firstRenderTime: now,
        lastRenderTime: now,
        measurements: data.measurements,
        color: data.color,
        lastRenderCause: data.renderCause,
      };

      // Initialize render history if enabled
      if (this.settings.enableRenderHistory && data.renderCause) {
        newRender.renderHistory = [];
        this.addRenderEvent(newRender, data.renderCause, data.capturedProps, data.capturedState);
      }

      this.renders.set(id, newRender);

      // Enforce max limit - remove oldest renders
      if (this.renders.size > MAX_TRACKED_COMPONENTS) {
        const sorted = Array.from(this.renders.values()).sort(
          (a, b) => a.lastRenderTime - b.lastRenderTime
        );
        const toRemove = sorted.slice(0, this.renders.size - MAX_TRACKED_COMPONENTS);
        for (const render of toRemove) {
          this.renders.delete(render.id);
        }
      }
    }

    // In batch mode, defer notification until endBatch()
    if (this.isBatchMode) {
      this.batchDirty = true;
    } else {
      this.notifyListeners();
    }
  }

  /**
   * Add a render event to a component's history (circular buffer)
   */
  private addRenderEvent(
    render: TrackedRender,
    cause: RenderCause,
    capturedProps?: Record<string, any>,
    capturedState?: any
  ): void {
    // Initialize history array if needed
    if (!render.renderHistory) {
      render.renderHistory = [];
    }

    const event: RenderEvent = {
      id: `${render.nativeTag}-${cause.timestamp}`,
      timestamp: cause.timestamp,
      cause,
      renderNumber: render.renderCount,
      // Only include captured data if settings allow and data is provided
      capturedProps: this.settings.capturePropsOnRender ? capturedProps : undefined,
      capturedState: this.settings.captureStateOnRender ? capturedState : undefined,
    };

    render.renderHistory.push(event);

    // Enforce max history size (circular buffer behavior)
    const maxHistory = Math.max(5, Math.min(50, this.settings.maxRenderHistoryPerComponent));
    if (render.renderHistory.length > maxHistory) {
      // Remove oldest events
      render.renderHistory = render.renderHistory.slice(-maxHistory);
    }
  }

  /**
   * Start batch mode - defers listener notifications until endBatch() is called.
   * Use this when tracking multiple renders in a loop to avoid O(n²) notifications.
   */
  startBatch(): void {
    this.isBatchMode = true;
    this.batchDirty = false;
  }

  /**
   * End batch mode and notify listeners if any renders were tracked.
   */
  endBatch(): void {
    this.isBatchMode = false;
    if (this.batchDirty) {
      this.batchDirty = false;
      this.notifyListeners();
    }
  }

  /**
   * Get all tracked renders
   * Creates new object copies to trigger React.memo re-renders
   */
  getRenders(): TrackedRender[] {
    return Array.from(this.renders.values()).map(r => ({ ...r }));
  }

  /**
   * Get filtered renders based on current filter config
   */
  getFilteredRenders(searchText: string = ""): TrackedRender[] {
    let renders = this.getRenders();

    // Apply search filter
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      renders = renders.filter((r) => {
        return (
          r.viewType.toLowerCase().includes(search) ||
          r.displayName.toLowerCase().includes(search) ||
          r.testID?.toLowerCase().includes(search) ||
          r.nativeID?.toLowerCase().includes(search) ||
          r.accessibilityLabel?.toLowerCase().includes(search) ||
          r.componentName?.toLowerCase().includes(search) ||
          String(r.nativeTag).includes(search)
        );
      });
    }

    // Apply new unified include patterns (if any are set, must match at least one)
    if (this.filters.includePatterns.length > 0) {
      renders = renders.filter((r) => this.matchesAnyPattern(r, this.filters.includePatterns));
    }

    // Apply new unified exclude patterns
    if (this.filters.excludePatterns.length > 0) {
      renders = renders.filter((r) => !this.matchesAnyPattern(r, this.filters.excludePatterns));
    }

    // Legacy filter support (for backwards compatibility)
    if (this.filters.includeViewType.size > 0) {
      renders = renders.filter((r) =>
        this.matchesPattern(r.viewType, this.filters.includeViewType)
      );
    }
    if (this.filters.includeTestID.size > 0) {
      renders = renders.filter(
        (r) => r.testID && this.matchesPattern(r.testID, this.filters.includeTestID)
      );
    }
    if (this.filters.includeNativeID.size > 0) {
      renders = renders.filter(
        (r) => r.nativeID && this.matchesPattern(r.nativeID, this.filters.includeNativeID)
      );
    }
    if (this.filters.includeComponent.size > 0) {
      renders = renders.filter(
        (r) =>
          r.componentName && this.matchesPattern(r.componentName, this.filters.includeComponent)
      );
    }
    if (this.filters.excludeViewType.size > 0) {
      renders = renders.filter(
        (r) => !this.matchesPattern(r.viewType, this.filters.excludeViewType)
      );
    }
    if (this.filters.excludeTestID.size > 0) {
      renders = renders.filter(
        (r) => !r.testID || !this.matchesPattern(r.testID, this.filters.excludeTestID)
      );
    }
    if (this.filters.excludeNativeID.size > 0) {
      renders = renders.filter(
        (r) => !r.nativeID || !this.matchesPattern(r.nativeID, this.filters.excludeNativeID)
      );
    }
    if (this.filters.excludeComponent.size > 0) {
      renders = renders.filter(
        (r) =>
          !r.componentName || !this.matchesPattern(r.componentName, this.filters.excludeComponent)
      );
    }

    // Sort by last render time (most recent first)
    return renders.sort((a, b) => b.lastRenderTime - a.lastRenderTime);
  }

  /**
   * Check if a render matches any of the given patterns
   */
  private matchesAnyPattern(render: TrackedRender, patterns: FilterPattern[]): boolean {
    for (const pattern of patterns) {
      const lowerValue = pattern.value.toLowerCase();

      switch (pattern.type) {
        case "any":
          // Match against all fields
          if (
            render.viewType.toLowerCase().includes(lowerValue) ||
            render.displayName.toLowerCase().includes(lowerValue) ||
            render.testID?.toLowerCase().includes(lowerValue) ||
            render.nativeID?.toLowerCase().includes(lowerValue) ||
            render.componentName?.toLowerCase().includes(lowerValue) ||
            render.accessibilityLabel?.toLowerCase().includes(lowerValue)
          ) {
            return true;
          }
          break;
        case "viewType":
          if (render.viewType.toLowerCase().includes(lowerValue) ||
              render.displayName.toLowerCase().includes(lowerValue)) {
            return true;
          }
          break;
        case "testID":
          if (render.testID?.toLowerCase().includes(lowerValue)) {
            return true;
          }
          break;
        case "nativeID":
          if (render.nativeID?.toLowerCase().includes(lowerValue)) {
            return true;
          }
          break;
        case "component":
          if (render.componentName?.toLowerCase().includes(lowerValue)) {
            return true;
          }
          break;
        case "accessibilityLabel":
          if (render.accessibilityLabel?.toLowerCase().includes(lowerValue)) {
            return true;
          }
          break;
      }
    }
    return false;
  }

  /**
   * Check if a value matches any pattern in the set
   */
  private matchesPattern(value: string, patterns: Set<string>): boolean {
    const lowerValue = value.toLowerCase();
    for (const pattern of patterns) {
      const lowerPattern = pattern.toLowerCase();
      if (lowerValue.includes(lowerPattern)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get a single render by id
   */
  getRender(id: string): TrackedRender | undefined {
    return this.renders.get(id);
  }

  /**
   * Clear all tracked renders
   */
  clear(): void {
    this.renders.clear();
    this.notifyListeners();
  }

  /**
   * Reset render count for a specific component
   */
  resetRenderCount(id: string): void {
    const render = this.renders.get(id);
    if (render) {
      render.renderCount = 0;
      this.notifyListeners();
    }
  }

  /**
   * Start tracking
   */
  start(): void {
    this.isTracking = true;
    this.isPaused = false;
    this.notifyStateListeners();
  }

  /**
   * Stop tracking
   */
  stop(): void {
    this.isTracking = false;
    this.isPaused = false;
    this.notifyStateListeners();
  }

  /**
   * Pause tracking (keeps state but stops adding new renders)
   */
  pause(): void {
    this.isPaused = true;
    this.notifyStateListeners();
  }

  /**
   * Resume tracking
   */
  resume(): void {
    this.isPaused = false;
    this.notifyStateListeners();
  }

  /**
   * Toggle pause state
   */
  togglePause(): void {
    this.isPaused = !this.isPaused;
    this.notifyStateListeners();
  }

  /**
   * Get current tracking state
   */
  getState(): { isTracking: boolean; isPaused: boolean } {
    return { isTracking: this.isTracking, isPaused: this.isPaused };
  }

  /**
   * Get filter config
   */
  getFilters(): FilterConfig {
    return this.filters;
  }

  /**
   * Update filter config
   */
  setFilters(filters: Partial<FilterConfig>): void {
    this.filters = { ...this.filters, ...filters };
    this.notifyListeners();
  }

  /**
   * Add an include pattern
   */
  addIncludePattern(type: "testID" | "nativeID" | "viewType" | "component", pattern: string): void {
    const key = `include${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof FilterConfig;
    (this.filters[key] as Set<string>).add(pattern);
    this.notifyListeners();
  }

  /**
   * Remove an include pattern
   */
  removeIncludePattern(
    type: "testID" | "nativeID" | "viewType" | "component",
    pattern: string
  ): void {
    const key = `include${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof FilterConfig;
    (this.filters[key] as Set<string>).delete(pattern);
    this.notifyListeners();
  }

  /**
   * Add an exclude pattern
   */
  addExcludePattern(type: "testID" | "nativeID" | "viewType" | "component", pattern: string): void {
    const key = `exclude${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof FilterConfig;
    (this.filters[key] as Set<string>).add(pattern);
    this.notifyListeners();
  }

  /**
   * Remove an exclude pattern
   */
  removeExcludePattern(
    type: "testID" | "nativeID" | "viewType" | "component",
    pattern: string
  ): void {
    const key = `exclude${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof FilterConfig;
    (this.filters[key] as Set<string>).delete(pattern);
    this.notifyListeners();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filters = {
      includeTestID: new Set(),
      includeNativeID: new Set(),
      includeViewType: new Set(),
      includeComponent: new Set(),
      excludeTestID: new Set(),
      excludeNativeID: new Set(),
      excludeViewType: new Set(),
      excludeComponent: new Set(),
      includePatterns: [],
      excludePatterns: [],
    };
    this.notifyListeners();
  }

  /**
   * Get available prop values from tracked renders
   */
  getAvailableProps(): {
    viewTypes: string[];
    testIDs: string[];
    nativeIDs: string[];
    componentNames: string[];
    accessibilityLabels: string[];
  } {
    const viewTypes = new Set<string>();
    const testIDs = new Set<string>();
    const nativeIDs = new Set<string>();
    const componentNames = new Set<string>();
    const accessibilityLabels = new Set<string>();

    for (const render of this.renders.values()) {
      if (render.viewType) viewTypes.add(render.viewType);
      if (render.testID) testIDs.add(render.testID);
      if (render.nativeID) nativeIDs.add(render.nativeID);
      if (render.componentName) componentNames.add(render.componentName);
      if (render.accessibilityLabel) accessibilityLabels.add(render.accessibilityLabel);
    }

    return {
      viewTypes: Array.from(viewTypes).sort(),
      testIDs: Array.from(testIDs).sort(),
      nativeIDs: Array.from(nativeIDs).sort(),
      componentNames: Array.from(componentNames).sort(),
      accessibilityLabels: Array.from(accessibilityLabels).sort(),
    };
  }

  /**
   * Get summary stats
   */
  getStats(): { totalComponents: number; totalRenders: number } {
    let totalRenders = 0;
    for (const render of this.renders.values()) {
      totalRenders += render.renderCount;
    }
    return {
      totalComponents: this.renders.size,
      totalRenders,
    };
  }

  /**
   * Subscribe to render updates
   */
  subscribe(listener: RenderTrackerListener): () => void {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.getRenders());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to state changes (tracking/paused)
   */
  subscribeToState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    // Immediately notify with current state
    listener(this.getState());
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Subscribe to settings changes
   */
  subscribeToSettings(listener: SettingsListener): () => void {
    this.settingsListeners.add(listener);
    // Immediately notify with current settings
    listener(this.settings);
    return () => {
      this.settingsListeners.delete(listener);
    };
  }

  /**
   * Get current settings
   */
  getSettings(): RenderTrackerSettings {
    return { ...this.settings };
  }

  /**
   * Update settings
   */
  setSettings(newSettings: Partial<RenderTrackerSettings>): void {
    // Validate batchSize
    if (newSettings.batchSize !== undefined) {
      newSettings.batchSize = Math.max(10, Math.min(500, newSettings.batchSize));
    }

    // Validate maxRenderHistoryPerComponent
    if (newSettings.maxRenderHistoryPerComponent !== undefined) {
      newSettings.maxRenderHistoryPerComponent = Math.max(
        5,
        Math.min(50, newSettings.maxRenderHistoryPerComponent)
      );
    }

    // If enabling render history, also enable trackRenderCauses
    if (newSettings.enableRenderHistory && !this.settings.trackRenderCauses) {
      newSettings.trackRenderCauses = true;
    }

    // If disabling trackRenderCauses, also disable render history
    if (newSettings.trackRenderCauses === false && this.settings.enableRenderHistory) {
      newSettings.enableRenderHistory = false;
    }

    this.settings = { ...this.settings, ...newSettings };

    // Sync performance logging with PerformanceLogger
    if (newSettings.performanceLogging !== undefined) {
      PerformanceLogger.setEnabled(newSettings.performanceLogging);
    }

    this.notifySettingsListeners();
  }

  /**
   * Clear render history for all components
   */
  clearAllRenderHistory(): void {
    for (const render of this.renders.values()) {
      render.renderHistory = [];
    }
    this.notifyListeners();
  }

  /**
   * Clear render history for a specific component
   */
  clearRenderHistory(id: string): void {
    const render = this.renders.get(id);
    if (render) {
      render.renderHistory = [];
      this.notifyListeners();
    }
  }

  /**
   * Get render history stats for debugging
   */
  getRenderHistoryStats(): {
    totalEvents: number;
    componentsWithHistory: number;
    averageEventsPerComponent: number;
  } {
    let totalEvents = 0;
    let componentsWithHistory = 0;

    for (const render of this.renders.values()) {
      if (render.renderHistory && render.renderHistory.length > 0) {
        totalEvents += render.renderHistory.length;
        componentsWithHistory++;
      }
    }

    return {
      totalEvents,
      componentsWithHistory,
      averageEventsPerComponent:
        componentsWithHistory > 0 ? totalEvents / componentsWithHistory : 0,
    };
  }

  /**
   * Get batch size (convenience method)
   */
  getBatchSize(): number {
    return this.settings.batchSize;
  }

  /**
   * Set batch size (convenience method)
   */
  setBatchSize(size: number): void {
    this.setSettings({ batchSize: size });
  }

  private notifyListeners(): void {
    const renders = this.getRenders();
    for (const listener of this.listeners) {
      try {
        listener(renders);
      } catch (error) {
        console.error("[RenderTracker] Error in listener:", error);
      }
    }
  }

  private notifyStateListeners(): void {
    const state = this.getState();
    for (const listener of this.stateListeners) {
      try {
        listener(state);
      } catch (error) {
        console.error("[RenderTracker] Error in state listener:", error);
      }
    }
  }

  private notifySettingsListeners(): void {
    const settings = this.getSettings();
    for (const listener of this.settingsListeners) {
      try {
        listener(settings);
      } catch (error) {
        console.error("[RenderTracker] Error in settings listener:", error);
      }
    }
  }
}

// Export singleton instance
export const RenderTracker = new RenderTrackerSingleton();

export default RenderTracker;
