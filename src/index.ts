// Main FloatingStatusBubble with integrated React Query dev tools
export { FloatingStatusBubble } from "./_components/floating-bubble/admin/FloatingStatusBubble";

// Standalone React Query DevTools bubble
export { ReactQueryDevToolsBubble } from "./_components/floating-bubble/admin/ReactQueryDevToolsBubble";

// Legacy DevToolsBubble (deprecated - use FloatingStatusBubble with queryClient prop instead)
export { DevToolsBubble } from "./DevToolsBubble";

// Sentry event logging functionality
export {
  configureSentryClient,
  setupSentryEventListeners,
  setMaxSentryEvents,
  getSentryEvents,
} from "./_components/floating-bubble/sentry/sentryEventListeners";

// Types
export type { SentryEventEntry } from "./_components/floating-bubble/sentry/sentryEventListeners";
export type { RequiredEnvVar } from "./_components/floating-bubble/admin/sections/EnvVarsSection";
export type {
  Environment,
  UserRole,
} from "./_components/floating-bubble/admin/components";
