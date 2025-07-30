export enum LogLevel {
  Debug = "debug",
  Info = "info",
  Log = "log",
  Warn = "warn",
  Error = "error",
}

export enum LogType {
  Auth = "Auth",
  Custom = "Custom",
  Debug = "Debug",
  Error = "Error",
  Generic = "Generic",
  HTTPRequest = "HTTP Request",
  Navigation = "Navigation",
  Replay = "Replay",
  State = "State",
  System = "System",
  Touch = "Touch",
  UserAction = "User Action",
}

export type Transport = (
  level: LogLevel,
  message: string | Error,
  metadata: Metadata,
  timestamp: number
) => void;

/**
 * Event object structure that matches Sentry Event format
 */
export interface SentryEvent {
  event_id?: string;
  message?: string | { message?: string; params?: unknown[] };
  level?: string;
  platform?: string;
  logger?: string;
  timestamp?: number;
  environment?: string;
  release?: string;
  dist?: string;
  tags?: Record<string, string | number | boolean>;
  extra?: Record<string, unknown>;
  user?: Record<string, unknown>;
  contexts?: Record<string, unknown>;
  breadcrumbs?: SentryBreadcrumb[];
  fingerprint?: string[];
  exception?: {
    values?: Array<{
      type?: string;
      value?: string;
      stacktrace?: unknown;
    }>;
  };
  [key: string]: unknown;
}

/**
 * Breadcrumb object structure that matches Sentry Breadcrumb format
 */
export interface SentryBreadcrumb {
  timestamp?: number;
  message?: string;
  category?: string;
  level?: string;
  type?: string;
  data?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Metadata type that encompasses breadcrumb properties and capture context
 */
export type Metadata = {
  /**
   * Applied as Sentry breadcrumb types. Defaults to `default`.
   *
   * @see https://develop.sentry.dev/sdk/event-payloads/breadcrumbs/#breadcrumb-types
   */
  type?:
    | "default"
    | "debug"
    | "error"
    | "navigation"
    | "http"
    | "info"
    | "query"
    | "transaction"
    | "ui"
    | "user";

  /**
   * Sentry breadcrumb category - used to determine the LogType
   */
  category?: string;

  /**
   * Tags for categorization
   */
  tags?: {
    [key: string]:
      | number
      | string
      | boolean
      | bigint
      | symbol
      | null
      | undefined;
  };

  /**
   * Any additional data, passed through to Sentry as `extra` param on
   * exceptions, or the `data` param on breadcrumbs.
   */
  [key: string]: unknown;
};

export type ConsoleTransportEntry = {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string | Error;
  metadata: Metadata;
  type: LogType;
};
