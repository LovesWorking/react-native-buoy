declare module "@sentry/react-native" {
  export function getClient(): import("../utils/sentryEventListeners").SentryClient;
}
