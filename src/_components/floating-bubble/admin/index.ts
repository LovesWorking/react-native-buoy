// Types
export type { Environment, UserRole } from "./components";

// Logger for Sentry events
export type { ConsoleTransportEntry, LogLevel, LogType } from "../../../_shared/logger";
export { SentryLogger, sentryLogger, TestLogger, testLogger } from "../../../_shared/logger";

// Sentry Event Logger
export type {
  SentryEventEntry,
  SentryEventLevel,
  SentryEventType,
} from "../../../_sections/sentry/utils/sentryEventListeners";
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
} from "../../../_sections/sentry/utils/sentryEventListeners";

// Default sections
export { AdminEnvVarsSection as EnvVarsSection } from "../../../_sections/env";

// Utilities for creating custom sections
export { ExpandableSectionWithModal } from "./components/ExpandableSectionWithModal";
export { EnvVarsModalContent } from "../../../_sections/env";
export {
  LogDumpModalContent,
} from "../../../_sections/log-dump";
export {
  SentryEventLogDumpModalContent,
} from "../../../_sections/sentry/components";
