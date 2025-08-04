declare module "@sentry/react-native" {
  export function getClient(): import("./sentryEventListeners").SentryClient;
}
