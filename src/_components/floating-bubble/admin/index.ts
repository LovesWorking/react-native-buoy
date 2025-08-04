// Types
export type { Environment, UserRole } from "./components";

// Logger for Sentry events
export type { ConsoleTransportEntry, LogLevel, LogType } from "./logger";
export { SentryLogger, sentryLogger, TestLogger, testLogger } from "./logger";

// Sentry Event Logger
export type {
  SentryEventEntry,
  SentryEventLevel,
  SentryEventType,
} from "../sentry/sentryEventListeners";
export {
  clearSentryEvents,
  configureSentryClient,
  generateTestSentryEvents,
  getEventEmoji,
  getSentryEvents,
  SentryEventLogger,
  sentryEventLogger,
  setMaxSentryEvents,
  setupSentryEventListeners,
} from "../sentry/sentryEventListeners";

// Default sections
export { EnvVarsSection } from "./sections/EnvVarsSection";

// Utilities for creating custom sections
export { ExpandableSectionWithModal } from "./ExpandableSectionWithModal";
export { EnvVarsModalContent } from "./sections/env-vars";
export {
  LogDumpModalContent,
  SentryEventLogDumpModalContent,
} from "./sections/log-dump";

// Examples
export { ExampleCustomSection } from "./ExampleCustomSection";
