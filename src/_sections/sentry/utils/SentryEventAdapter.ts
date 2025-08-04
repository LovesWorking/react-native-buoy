import {
  SentryEventEntry,
  SentryEventLevel,
  SentryEventType,
} from "./sentryEventListeners";
import { ConsoleTransportEntry, LogLevel, LogType } from "../../../_components/floating-bubble/admin/logger/types";

/**
 * Maps SentryEventType to LogType for UI consistency
 */
const mapEventTypeToLogType = (eventType: SentryEventType): LogType => {
  switch (eventType) {
    case SentryEventType.Error:
      return LogType.Error;
    case SentryEventType.Transaction:
      return LogType.Navigation;
    case SentryEventType.Span:
      return LogType.Navigation;
    case SentryEventType.Session:
      return LogType.System;
    case SentryEventType.UserFeedback:
      return LogType.UserAction;
    case SentryEventType.Profile:
      return LogType.System;
    case SentryEventType.Replay:
      return LogType.Replay;
    case SentryEventType.Attachment:
      return LogType.System;
    case SentryEventType.ClientReport:
      return LogType.System;
    case SentryEventType.Log:
      return LogType.Generic;
    case SentryEventType.Breadcrumb:
      // Determine type based on breadcrumb category
      return LogType.Generic; // Will be refined below
    case SentryEventType.Native:
      return LogType.System;
    default:
      return LogType.Generic;
  }
};

/**
 * Maps SentryEventLevel to LogLevel for UI consistency
 */
const mapEventLevelToLogLevel = (eventLevel: SentryEventLevel): LogLevel => {
  switch (eventLevel) {
    case SentryEventLevel.Debug:
      return LogLevel.Debug;
    case SentryEventLevel.Info:
      return LogLevel.Info;
    case SentryEventLevel.Warning:
      return LogLevel.Warn;
    case SentryEventLevel.Error:
      return LogLevel.Error;
    case SentryEventLevel.Fatal:
      return LogLevel.Error;
    default:
      return LogLevel.Info;
  }
};

/**
 * Refines log type based on Sentry event data context
 */
const refineLogTypeFromContext = (
  entry: SentryEventEntry,
  baseType: LogType
): LogType => {
  // Check category from data for more specific typing
  const category = entry.data?.category as string;

  if (category) {
    switch (category) {
      case "touch":
        return LogType.Touch;
      case "xhr":
      case "fetch":
      case "http":
        return LogType.HTTPRequest;
      case "navigation":
        return LogType.Navigation;
      case "auth":
        return LogType.Auth;
      case "console":
        return LogType.System;
      case "debug":
        return LogType.Debug;
      default:
        if (category.startsWith("ui.")) {
          return LogType.UserAction;
        } else if (category.startsWith("replay.")) {
          return LogType.Replay;
        } else if (category.includes("redux") || category.includes("state")) {
          return LogType.State;
        } else if (
          category.includes("payment") ||
          category.includes("analytics") ||
          category.includes("webhook")
        ) {
          return LogType.Custom;
        }
    }
  }

  return baseType;
};

/**
 * Converts a SentryEventEntry to ConsoleTransportEntry format for UI compatibility
 */
const adaptSentryEventToConsoleEntry = (
  sentryEntry: SentryEventEntry
): ConsoleTransportEntry => {
  const baseLogType = mapEventTypeToLogType(sentryEntry.eventType);
  const refinedLogType = refineLogTypeFromContext(sentryEntry, baseLogType);

  return {
    id: sentryEntry.id,
    timestamp: sentryEntry.timestamp,
    level: mapEventLevelToLogLevel(sentryEntry.level),
    message: sentryEntry.message,
    metadata: {
      // Include original Sentry data
      sentryEventType: sentryEntry.eventType,
      sentryLevel: sentryEntry.level,
      sentrySource: sentryEntry.source,
      ...sentryEntry.data,
      // Keep raw data for detailed view
      _sentryRawData: sentryEntry.rawData,
    },
    type: refinedLogType,
  };
};

/**
 * Converts multiple SentryEventEntry to ConsoleTransportEntry format
 */
export const adaptSentryEventsToConsoleEntries = (
  sentryEntries: SentryEventEntry[]
): ConsoleTransportEntry[] => {
  return sentryEntries.map(adaptSentryEventToConsoleEntry);
};
