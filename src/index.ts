// Main FloatingStatusBubble with integrated RN Better dev tools
export { FloatingStatusBubble } from "./_components/floating-bubble/admin/FloatingStatusBubble";

// Standalone RN Better DevTools bubble
export { RnBetterDevToolsBubble } from "./_components/floating-bubble/bubble/RnBetterDevToolsBubble";

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
export type { RequiredEnvVar } from "./_components/floating-bubble/admin/sections/env-vars/types";
export type {
  Environment,
  UserRole,
  BubbleConfig,
} from "./_components/floating-bubble/admin/components";
