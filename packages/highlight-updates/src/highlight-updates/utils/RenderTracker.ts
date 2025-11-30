/**
 * RenderTracker
 *
 * Singleton that tracks component render history for the Highlight Updates modal.
 * Stores information about each tracked component including render counts,
 * timestamps, and identifying props (testID, nativeID, etc.)
 */

"use strict";

import { getComponentDisplayName } from "./ViewTypeMapper";

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
  };
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
      };

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

    this.notifyListeners();
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
    this.settings = { ...this.settings, ...newSettings };
    this.notifySettingsListeners();
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
