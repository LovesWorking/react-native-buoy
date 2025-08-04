/**
 * Main entry point for the Sentry Logs feature
 * This component orchestrates all sentry-related functionality
 */

// Re-export all public APIs from this feature
export * from './utils/sentryEventListeners';
export * from './utils/sentryEventStore';
export * from './utils/SentryEventAdapter';

// Re-export hooks
export { useSentryEvents, useSentryEventCounts } from './hooks/useSentryEvents';
export { useSentrySubtitle } from './hooks/useSentrySubtitle';

// Re-export components
export { SentryLogsSection, SentryLogsContent } from './components/SentryLogsSection';
export { SentryLogsModal } from './components/SentryLogsModal';
export { SentryEventDetailView } from './components/SentryEventDetailView';
export { SentryFilterView } from './components/SentryFilterView';
export { SentryLogsDetailContent } from './components/SentryLogsDetailContent';

// Log dump components
export { SentryEventLogDetailView } from './components/SentryEventLogDetailView';
export { SentryEventLogDumpModalContent } from './components/SentryEventLogDumpModalContent';
export { SentryEventLogEntryItem } from './components/SentryEventLogEntryItem';
export { SentryEventLogEntryItem as SentryEventLogEntryItemCompact } from './components/SentryEventLogEntryItemCompact';
export { SentryEventLogFilters } from './components/SentryEventLogFilters';
export { LogEntrySentryBadge } from './components/LogEntrySentryBadge';

// Logger exports
export * from './logger/index-sentry';