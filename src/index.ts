// RN Better DevTools bubble (main component)
export { RnBetterDevToolsBubble } from "./_components/floating-bubble/bubble/RnBetterDevToolsBubble";

// Sentry event logging functionality
export {
  configureSentryClient,
  setupSentryEventListeners,
  setMaxSentryEvents,
  getSentryEvents,
} from "./_sections/sentry/utils/sentryEventListeners";

// Types
export type { SentryEventEntry } from "./_sections/sentry/utils/sentryEventListeners";
export type { 
  RequiredEnvVar,
  EnvVarType 
} from "./_sections/env/types";
export type {
  Environment,
  UserRole,
  BubbleConfig,
} from "./_components/floating-bubble/admin/components";

// Environment variable utilities
export {
  envVar,
  createEnvVarConfig,
  validateEnvVars,
  hasExpectedValue,
  hasExpectedType,
} from "./_sections/env/utils/helpers";
