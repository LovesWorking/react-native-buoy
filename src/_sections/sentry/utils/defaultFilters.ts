import { LogType, LogLevel } from "../../../_shared/logger/types";
import { SentryEventType } from "./sentryEventListeners";

/**
 * Default filter configuration based on the Sentry Event Filtering Guide
 * These filters are designed to reduce noise and show only essential events
 */

// Events to show by default (Essential for Development)
export const DEFAULT_VISIBLE_TYPES = new Set<LogType>([
  LogType.Error,        // High Priority - All error events and crashes
  LogType.Auth,         // High Priority - Authentication flows and issues
  LogType.Navigation,   // High Priority - Screen transitions and routing (but not spans)
  LogType.HTTPRequest,  // High Priority - Network requests and API calls
  LogType.UserAction,   // Medium Priority - Direct user interactions
  LogType.Touch,        // Medium Priority - UI touch events and gestures
  LogType.Custom,       // Medium Priority - Business logic events
]);

// Events to hide by default (Reduce Noise)
export const DEFAULT_HIDDEN_TYPES = new Set<LogType>([
  LogType.System,      // Low Priority - Session lifecycle, profiles, SDK reports
  LogType.Debug,       // Low Priority - Development-only debugging breadcrumbs
  LogType.Generic,     // Low Priority - Uncategorized log events
  LogType.State,       // Low Priority - Redux/state management events
  LogType.Replay,      // Low Priority - Session replay metadata
]);

// Log levels to show by default
export const DEFAULT_VISIBLE_LEVELS = new Set<LogLevel>([
  LogLevel.Error,      // Critical issues requiring immediate attention
  LogLevel.Warn,       // Important warnings that may indicate problems
  LogLevel.Info,       // Key application events and milestones
]);

// Log levels to hide by default
export const DEFAULT_HIDDEN_LEVELS = new Set<LogLevel>([
  LogLevel.Debug,      // Verbose debugging information
  // LogLevel.Log is not typically used in our system
]);

/**
 * Get initial filter sets for types
 * Returns only the types we want to show by default
 */
export function getDefaultTypeFilters(): Set<LogType> {
  return new Set(DEFAULT_VISIBLE_TYPES);
}

/**
 * Get initial filter sets for levels
 * Returns only the levels we want to show by default
 */
export function getDefaultLevelFilters(): Set<LogLevel> {
  return new Set(DEFAULT_VISIBLE_LEVELS);
}

/**
 * Check if a specific Sentry event should be hidden by default
 * According to the guide, spans should be hidden to reduce noise
 */
export function shouldHideSentryEvent(eventType: SentryEventType): boolean {
  // Spans clog up the logs and should be hidden by default
  return eventType === SentryEventType.Span;
}