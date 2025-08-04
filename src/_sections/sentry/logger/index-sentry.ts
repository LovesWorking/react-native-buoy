import { add } from '../../../_components/floating-bubble/admin/logger/logDump';
import { ConsoleTransportEntry, LogLevel, LogType, SentryBreadcrumb, SentryEvent } from '../../../_components/floating-bubble/admin/logger/types';

export { LogLevel, LogType };

// Simple ID generator to replace nanoid
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

type SentryEventData = {
  category?: string;
  message?: string;
  level?: string;
  type?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
};

type SentryLog = {
  level: string;
  message: string;
  attributes?: Record<string, unknown>;
  timestamp?: number;
};

/**
 * SentryLogger - Captures Sentry events for display in admin modal
 *
 * This logger is specifically designed to capture Sentry events before they are sent
 * and store them in memory for display in the admin modal. It maintains up to 500 events.
 *
 * Usage:
 * ```ts
 * // In your Sentry.init():
 * const logger = new SentryLogger();
 *
 * Sentry.init({
 *   beforeSendTransaction: logger.captureTransaction,
 *   beforeSendSpan: logger.captureSpan,
 *   beforeSend: logger.captureEvent,
 *   beforeBreadcrumb: logger.captureBreadcrumb,
 *   // ... other config
 * });
 * ```
 */
export class SentryLogger {
  /**
   * Capture a Sentry transaction before it's sent
   */
  captureTransaction = (event: SentryEvent) => {
    this.logSentryEvent('transaction', event as unknown as SentryEventData);
    return event;
  };

  /**
   * Capture a Sentry span before it's sent
   */
  captureSpan = (span: SentryEvent) => {
    this.logSentryEvent('span', span as unknown as SentryEventData);
    return span;
  };

  /**
   * Capture a Sentry event before it's sent
   */
  captureEvent = (event: SentryEvent) => {
    this.logSentryEvent('event', event as unknown as SentryEventData);
    return event;
  };

  /**
   * Capture a Sentry log before it's sent
   */
  captureLog = (log: SentryLog) => {
    this.logSentryEvent('console', {
      message: log.message || 'Log entry',
      level: log.level,
      category: 'console',
      timestamp: log.timestamp,
      ...log.attributes,
    });
    return log;
  };

  /**
   * Capture a Sentry breadcrumb before it's added
   */
  captureBreadcrumb = (breadcrumb: SentryBreadcrumb) => {
    // Get current pathname from global tracker if available
    let pathname = 'unknown';
    try {
      // Try to get the pathname from the global function if it exists
      const getCurrentPathname = (globalThis as { getCurrentPathname?: () => string }).getCurrentPathname;
      if (getCurrentPathname) {
        pathname = getCurrentPathname();
      }
    } catch {
      // Ignore errors - use default pathname
    }

    // Type assertion for the category
    const category = breadcrumb.category as string;

    // Filter out breadcrumbs with "ignore" in the message (for admin components)
    if (breadcrumb.message?.toLowerCase().includes('ignore')) {
      return null;
    }

    // Replace touch event message if present
    if (breadcrumb.message?.includes('Touch event within element:')) {
      breadcrumb.message = breadcrumb.message.replace('Touch event within element:', '');
    }

    // Replace navigation message if present
    if (category === 'navigation' && breadcrumb.data?.from && breadcrumb.data?.to) {
      breadcrumb.message = `From ${breadcrumb.data.from} To ${breadcrumb.data.to}`;
    }

    // Handle touch events specially
    if (category === 'touch' && breadcrumb.data?.path) {
      // Clean up message if it starts with a space
      if (breadcrumb.message) {
        breadcrumb.message = breadcrumb.message.trim();
      }

      // Create enriched data structure
      const enrichedData = {
        ...breadcrumb.data,
        category,
        message: breadcrumb.message,
        route: pathname,
        timestamp: new Date().toISOString(),
        path: breadcrumb.message ? [{ label: breadcrumb.message }] : breadcrumb.data?.path,
      };

      // Update breadcrumb data
      breadcrumb.data = enrichedData;
    }

    this.logSentryEvent('breadcrumb', breadcrumb as unknown as SentryEventData);
    return breadcrumb;
  };

  /**
   * Internal method to log Sentry events to memory
   */
  private logSentryEvent(type: 'transaction' | 'span' | 'event' | 'breadcrumb' | 'console', data: SentryEventData) {
    // Determine log type based on Sentry category
    let logType = LogType.Generic;
    const category = data.category;

    if (category) {
      switch (category) {
        case 'touch':
          logType = LogType.Touch;
          break;
        case 'xhr':
        case 'fetch':
        case 'http':
          logType = LogType.HTTPRequest;
          break;
        case 'navigation':
          logType = LogType.Navigation;
          break;
        case 'auth':
          logType = LogType.Auth;
          break;
        case 'console':
          logType = LogType.System;
          break;
        case 'debug':
          logType = LogType.Debug;
          break;
        default:
          if (category.startsWith('ui.')) {
            logType = LogType.UserAction;
          } else if (category.startsWith('replay.')) {
            logType = LogType.Replay;
          } else if (category.includes('redux') || category.includes('state')) {
            logType = LogType.State;
          } else {
            logType = LogType.Custom;
          }
      }
    }

    // Create log entry
    const entry: ConsoleTransportEntry = {
      id: generateId(),
      timestamp: Date.now(),
      level: this.getSentryLevel(data),
      message: this.getSentryMessage(data),
      metadata: this.getSentryMetadata(data),
      type: logType,
    };

    // Add to memory store
    add(entry);
  }

  /**
   * Get appropriate log level from Sentry data
   */
  private getSentryLevel(data: SentryEventData): LogLevel {
    const level = data.level;
    switch (level) {
      case 'fatal':
      case 'error':
        return LogLevel.Error;
      case 'warning':
        return LogLevel.Warn;
      case 'info':
        return LogLevel.Info;
      case 'debug':
        return LogLevel.Debug;
      default:
        return LogLevel.Log;
    }
  }

  /**
   * Extract message from Sentry data
   */
  private getSentryMessage(data: SentryEventData): string {
    const message = data.message;
    if (typeof message === 'string') {
      return message;
    }
    return `${data.type || 'Unknown'} Event`;
  }

  /**
   * Extract metadata from Sentry data
   */
  private getSentryMetadata(data: SentryEventData): Record<string, unknown> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { message, level, type, ...metadata } = data;
    return metadata;
  }
}

// Export a default instance for convenience
export const sentryLogger = new SentryLogger();
