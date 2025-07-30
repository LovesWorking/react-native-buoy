// Types
export type { Environment, UserRole } from './components';

// Main components
export { FloatingStatusBubble } from './FloatingStatusBubble';

// Logger for Sentry events
export type { ConsoleTransportEntry, LogLevel, LogType } from './logger';
export { SentryLogger, sentryLogger, TestLogger, testLogger } from './logger';

// Sentry Event Logger
export type { SentryEventEntry, SentryEventLevel, SentryEventType } from '../../sentry/sentryEventListeners';
export {
  clearSentryEvents,
  generateTestSentryEvents,
  getEventEmoji,
  getSentryEvents,
  SentryEventLogger,
  sentryEventLogger,
  setMaxSentryEvents,
  setupSentryEventListeners,
} from '../../sentry/sentryEventListeners';

// Default sections
export { EnvVarsSection } from './sections/EnvVarsSection';
export { SentryLogDumpSection } from './sections/SentryLogDumpSection';

// Utilities for creating custom sections
export { ExpandableSectionWithModal } from './ExpandableSectionWithModal';
export { EnvVarsModalContent } from './sections/env-vars';
export { LogDumpModalContent, SentryEventLogDumpModalContent } from './sections/log-dump';

// Legacy/deprecated (for backward compatibility)
export { LogDumpSection } from './sections/LogDumpSection';

// Examples
export { ExampleCustomSection } from './ExampleCustomSection';
export { CustomSentryLogViewer, SentryIntegrationExample } from './SentryIntegrationExample';

// Usage examples
export {
  BasicFloatingStatusBubble,
  CustomOrderFloatingStatusBubble,
  MultiSectionFloatingStatusBubble,
  NoSentryLogsFloatingStatusBubble,
  NPMPackageUsageExample,
  ProductionFloatingStatusBubble,
} from './FloatingStatusBubbleUsageExample';
