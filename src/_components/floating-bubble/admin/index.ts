// Types
export type { Environment, UserRole } from "./components";

// Main components
export { FloatingStatusBubble } from "./FloatingStatusBubble";

// Logger for Sentry events
export type { ConsoleTransportEntry, LogLevel, LogType } from "./logger";
export { SentryLogger, sentryLogger, TestLogger, testLogger } from "./logger";

// Default sections
export { SentryLogDumpSection } from "./sections/SentryLogDumpSection";
export { EnvVarsSection } from "./sections/EnvVarsSection";

// Utilities for creating custom sections
export { ExpandableSectionWithModal } from "./ExpandableSectionWithModal";
export { LogDumpModalContent } from "./sections/log-dump";
export { EnvVarsModalContent } from "./sections/env-vars";

// Legacy/deprecated (for backward compatibility)
export { LogDumpSection } from "./sections/LogDumpSection";

// Examples
export { ExampleCustomSection } from "./ExampleCustomSection";

// Usage examples
export {
  BasicFloatingStatusBubble,
  CustomOrderFloatingStatusBubble,
  EnvVarsFloatingStatusBubble,
  MultiSectionFloatingStatusBubble,
  NoSentryLogsFloatingStatusBubble,
  NPMPackageUsageExample,
  ProductionFloatingStatusBubble,
} from "./FloatingStatusBubbleUsageExample";
