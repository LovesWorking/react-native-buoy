import type {
  Breadcrumb,
  SentryEvent,
  SpanJSON,
  FetchBreadcrumbHint,
  XhrBreadcrumbHint,
} from "../types";

interface SentryClient extends Record<string, unknown> {
  on?: (event: string, callback: (arg: unknown) => unknown) => void;
}

// Safe import for optional Sentry dependency
let getSentryClient: (() => SentryClient | null) | null = null;
let userProvidedGetClient: (() => SentryClient | null) | null = null;

try {
  // Dynamic import to avoid bundling if not installed
  import("@sentry/react-native").then(
    (sentry: { getClient: () => SentryClient }) => {
      getSentryClient = sentry.getClient;
    }
  );
} catch {
  // Sentry not installed - will gracefully degrade
  getSentryClient = null;
}

/**
 * Configure Sentry client provider for dependency injection approach
 * Use this if you prefer to manually provide the Sentry getClient function
 * @param getClientFn - Function that returns the Sentry client instance
 */
export function configureSentryClient(
  getClientFn: () => SentryClient | null
): void {
  userProvidedGetClient = getClientFn;
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

/**
 * Sentry event entry stored in memory for admin display
 */
export type SentryEventEntry = {
  id: string;
  timestamp: number;
  source: "envelope" | "span" | "transaction" | "breadcrumb" | "native";
  eventType: SentryEventType;
  level: SentryEventLevel;
  message: string;
  data: Record<string, unknown>;
  rawData: unknown;
};

/**
 * Event types for categorization
 */
export enum SentryEventType {
  Error = "Error",
  Transaction = "Transaction",
  Span = "Span",
  Session = "Session",
  UserFeedback = "User Feedback",
  Profile = "Profile",
  Replay = "Replay",
  Attachment = "Attachment",
  ClientReport = "Client Report",
  Log = "Log",
  Breadcrumb = "Breadcrumb",
  Native = "Native",
  Unknown = "Unknown",
}

/**
 * Event levels for severity
 */
export enum SentryEventLevel {
  Debug = "debug",
  Info = "info",
  Warning = "warning",
  Error = "error",
  Fatal = "fatal",
}

// Sentry envelope types - confirmed from codebase analysis
type SentryEnvelopeHeader = {
  event_id?: string;
  dsn?: string;
  sdk?: {
    name: string;
    version: string;
  };
  sent_at?: string;
};

type SentryEnvelopeItemHeader = {
  type:
    | "event" // Error events
    | "transaction" // Performance transactions
    | "session" // Session tracking
    | "attachment" // File attachments
    | "user_feedback" // User feedback
    | "profile" // Performance profiling
    | "replay_event" // Session replay events
    | "replay_recording" // Session replay recordings
    | "client_report" // SDK health reports
    | "log"; // Log events (experimental)
  length?: number;
  content_type?: string;
  filename?: string;
};

type SentryEnvelopeItem = [SentryEnvelopeItemHeader, unknown];
type SentryEnvelope = [SentryEnvelopeHeader, SentryEnvelopeItem[]];

// Import the reactive store instead of creating a local one
import { reactiveSentryEventStore as eventStore } from "./sentryEventStore";

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const mapItemTypeToEventType = (itemType: string): SentryEventType => {
  switch (itemType) {
    case "event":
      return SentryEventType.Error;
    case "transaction":
      return SentryEventType.Transaction;
    case "session":
      return SentryEventType.Session;
    case "user_feedback":
      return SentryEventType.UserFeedback;
    case "profile":
      return SentryEventType.Profile;
    case "replay_event":
    case "replay_recording":
      return SentryEventType.Replay;
    case "attachment":
      return SentryEventType.Attachment;
    case "client_report":
      return SentryEventType.ClientReport;
    case "log":
      return SentryEventType.Log;
    default:
      return SentryEventType.Unknown;
  }
};

const mapLevelToEventLevel = (level?: string): SentryEventLevel => {
  switch (level) {
    case "fatal":
      return SentryEventLevel.Fatal;
    case "error":
      return SentryEventLevel.Error;
    case "warning":
    case "warn":
      return SentryEventLevel.Warning;
    case "info":
      return SentryEventLevel.Info;
    case "debug":
      return SentryEventLevel.Debug;
    default:
      return SentryEventLevel.Info;
  }
};

const parseEnvelope = (envelope: SentryEnvelope): SentryEventEntry[] => {
  const [header, items] = envelope;
  const results: SentryEventEntry[] = [];

  items.forEach(([itemHeader, payload]) => {
    const eventType = mapItemTypeToEventType(itemHeader.type);
    const level = mapLevelToEventLevel(
      (payload as Record<string, unknown>)?.level as string
    );

    let message = "Sentry Event";
    if (payload && typeof payload === "object") {
      const payloadObj = payload as Record<string, unknown>;
      message = String(
        payloadObj.message || payloadObj.transaction || `${eventType} Event`
      );
    }

    // Check if this envelope contains our own dev tools logging
    const isDevToolsLog =
      message.includes("[RN-DevTools]") ||
      message.includes("__rn_dev_tools_internal_log");

    const event: SentryEventEntry = {
      id: generateId(),
      timestamp: Date.now(),
      source: "envelope",
      eventType,
      level,
      message,
      data: {
        envelopeId: header.event_id,
        dsn: header.dsn,
        sdk: header.sdk,
        itemType: itemHeader.type,
        header: itemHeader,
        // Add safeguard marker if this is from our dev tools logging
        ...(isDevToolsLog && { __rn_dev_tools_internal_log: true }),
      },
      rawData: payload,
    };

    results.push(event);
  });

  return results;
};

// =============================================================================
// SENTRY EVENT LOGGER
// =============================================================================

/**
 * Main logger class for capturing and storing Sentry events
 */
export class SentryEventLogger {
  private isSetup: boolean = false;

  /**
   * Set maximum number of events to store
   */
  setMaxEvents(max: number): void {
    eventStore.setMaxEvents(max);
  }

  /**
   * Get all stored events
   */
  getEvents(): SentryEventEntry[] {
    return eventStore.getEvents();
  }

  /**
   * Clear all stored events
   */
  clearEvents(): void {
    eventStore.clear();
  }

  /**
   * Get events filtered by type
   */
  getEventsByType(type: SentryEventType): SentryEventEntry[] {
    return eventStore.getEventsByType(type);
  }

  /**
   * Get events filtered by level
   */
  getEventsByLevel(level: SentryEventLevel): SentryEventEntry[] {
    return eventStore.getEventsByLevel(level);
  }

  /**
   * Get event count
   */
  getEventCount(): number {
    return eventStore.getCount();
  }

  /**
   * Setup Sentry event listeners
   */
  setup(): boolean {
    if (this.isSetup) {
      return true;
    }

    try {
      // Use user-provided client function or auto-detected one
      const clientGetter = userProvidedGetClient || getSentryClient;

      if (!clientGetter) {
        console.warn(
          "Sentry SDK not available - event logging disabled. Either install @sentry/react-native or use configureSentryClient()"
        );
        return false;
      }

      const client = clientGetter();

      if (!client) {
        console.warn("Sentry client not available for event logging");
        return false;
      }

      // Type assertion to access the on method safely
      const clientWithEvents = client as SentryClient;

      if (!clientWithEvents.on || typeof clientWithEvents.on !== "function") {
        console.warn("Sentry client does not support event listeners");
        return false;
      }

      // Setup envelope interception
      this.setupEnvelopeListeners(clientWithEvents);

      // Setup span listeners
      this.setupSpanListeners(clientWithEvents);

      // Setup transaction listeners
      this.setupTransactionListeners(clientWithEvents);

      // Setup breadcrumb listeners
      this.setupBreadcrumbListeners(clientWithEvents);

      // Setup native bridge interception
      this.setupNativeBridgeInterception();

      this.isSetup = true;
      console.log("✅ Sentry event logger configured successfully");
      return true;
    } catch (error) {
      console.error("Failed to setup Sentry event logger:", error);
      return false;
    }
  }

  /**
   * Setup envelope event listeners
   */
  private setupEnvelopeListeners(client: Record<string, unknown>): void {
    try {
      (client as SentryClient).on?.("beforeEnvelope", (envelope: unknown) => {
        if (!Array.isArray(envelope) || envelope.length !== 2) return;
        const typedEnvelope = envelope as unknown as SentryEnvelope;
        const events = parseEnvelope(typedEnvelope);
        events.forEach((event) => {
          eventStore.add(event);
        });
      });
    } catch (error) {
      console.warn("Failed to setup envelope listeners:", error);
    }
  }

  /**
   * Setup span event listeners
   */
  private setupSpanListeners(client: Record<string, unknown>): void {
    try {
      (client as SentryClient).on?.("spanEnd", (span: unknown) => {
        const spanData = span as SpanJSON;

        // Extract HTTP-specific information if this is an HTTP span
        let httpInfo = {};
        if (
          spanData.op === "http.client" ||
          spanData.op === "http" ||
          spanData.op?.startsWith("http.")
        ) {
          const attrs = spanData.data;
          httpInfo = {
            method: attrs["http.request.method"] || attrs["http.method"],
            url: attrs["url.full"] || attrs["http.url"],
            statusCode:
              attrs["http.response.status_code"] || attrs["http.status_code"],
            requestSize: attrs["http.request_content_length"],
            responseSize: attrs["http.response_content_length"],
            query: attrs["http.query"],
            fragment: attrs["http.fragment"],
          };
        }

        const event: SentryEventEntry = {
          id: generateId(),
          timestamp: Date.now(),
          source: "span",
          eventType: SentryEventType.Span,
          level: SentryEventLevel.Info,
          message: `Span ended: ${spanData.description || spanData.op || "Unknown"}`,
          data: {
            spanId: spanData.span_id,
            traceId: spanData.trace_id,
            operation: spanData.op,
            description: spanData.description,
            status: spanData.status,
            duration:
              spanData.timestamp && spanData.start_timestamp
                ? (spanData.timestamp - spanData.start_timestamp) * 1000
                : undefined,
            ...httpInfo,
          },
          rawData: spanData,
        };
        eventStore.add(event);
      });

      (client as SentryClient).on?.("spanStart", (span: unknown) => {
        const spanData = span as SpanJSON;
        const event: SentryEventEntry = {
          id: generateId(),
          timestamp: Date.now(),
          source: "span",
          eventType: SentryEventType.Span,
          level: SentryEventLevel.Debug,
          message: `Span started: ${spanData.description || spanData.op || "Unknown"}`,
          data: {
            spanId: spanData.span_id,
            traceId: spanData.trace_id,
            operation: spanData.op,
            description: spanData.description,
          },
          rawData: spanData,
        };
        eventStore.add(event);
      });
    } catch (error) {
      console.warn("Failed to setup span listeners:", error);
    }
  }

  /**
   * Setup transaction event listeners
   */
  private setupTransactionListeners(client: Record<string, unknown>): void {
    try {
      (client as SentryClient).on?.(
        "transactionStart",
        (transaction: unknown) => {
          const transactionData = transaction as Record<string, unknown>;
          const event: SentryEventEntry = {
            id: generateId(),
            timestamp: Date.now(),
            source: "transaction",
            eventType: SentryEventType.Transaction,
            level: SentryEventLevel.Info,
            message: `Transaction started: ${transactionData.name || "Unknown"}`,
            data: {
              transactionName: transactionData.name,
              operation: transactionData.op,
              traceId: transactionData.traceId,
            },
            rawData: transactionData,
          };
          eventStore.add(event);
        }
      );

      (client as SentryClient).on?.(
        "transactionFinish",
        (transaction: unknown) => {
          const transactionData = transaction as SentryEvent;
          const duration =
            transactionData.timestamp && transactionData.start_timestamp
              ? (transactionData.timestamp - transactionData.start_timestamp) *
                1000
              : null;

          const event: SentryEventEntry = {
            id: generateId(),
            timestamp: Date.now(),
            source: "transaction",
            eventType: SentryEventType.Transaction,
            level: SentryEventLevel.Info,
            message: `Transaction finished: ${transactionData.transaction || "Unknown"}${
              duration ? ` (${Math.round(duration)}ms)` : ""
            }`,
            data: {
              transactionName: transactionData.transaction,
              operation: transactionData.contexts?.trace?.op,
              traceId: transactionData.contexts?.trace?.trace_id,
              status: transactionData.contexts?.trace?.status,
              duration,
              spans: transactionData.spans?.length || 0,
            },
            rawData: transactionData,
          };
          eventStore.add(event);
        }
      );
    } catch (error) {
      console.warn("Failed to setup transaction listeners:", error);
    }
  }

  /**
   * Setup breadcrumb event listeners with enhanced HTTP data capture
   */
  private setupBreadcrumbListeners(client: Record<string, unknown>): void {
    try {
      (client as SentryClient).on?.(
        "beforeAddBreadcrumb",
        (breadcrumb: unknown, hint?: unknown) => {
          const breadcrumbData = breadcrumb as Breadcrumb;
          const breadcrumbHint = hint as
            | FetchBreadcrumbHint
            | XhrBreadcrumbHint
            | undefined;
          const category = String(breadcrumbData.category || "unknown");
          const message = String(breadcrumbData.message || "no message");

          // Skip breadcrumbs from our own logging to prevent infinite loops
          if (
            category === "console" &&
            (message.includes("Sentry") ||
              message.includes("event logger") ||
              message.includes("[RN-DevTools]") ||
              message.includes("__rn_dev_tools_internal_log") ||
              message.includes("✅") ||
              message.includes("📦") ||
              message.includes("⚡") ||
              message.includes("🍞"))
          ) {
            return null; // Don't log our own breadcrumbs
          }

          // Filter out breadcrumbs with "ignore" in the message (for admin components)
          if (message.toLowerCase().includes("ignore")) {
            return null;
          }

          // Enhanced HTTP breadcrumb processing
          const enhancedData = { ...breadcrumbData.data };
          if (
            category === "xhr" ||
            category === "fetch" ||
            category === "http"
          ) {
            // Extract timing information from hint
            if (
              breadcrumbHint &&
              "startTimestamp" in breadcrumbHint &&
              "endTimestamp" in breadcrumbHint
            ) {
              const duration = breadcrumbHint.endTimestamp
                ? (breadcrumbHint.endTimestamp -
                    breadcrumbHint.startTimestamp) *
                  1000
                : undefined;
              enhancedData.duration = duration;
              enhancedData.startTimestamp = breadcrumbHint.startTimestamp;
              enhancedData.endTimestamp = breadcrumbHint.endTimestamp;
            }

            // For fetch breadcrumbs, extract response information
            if (
              category === "fetch" &&
              breadcrumbHint &&
              "response" in breadcrumbHint
            ) {
              const response = breadcrumbHint.response as Response | undefined;
              if (
                response &&
                typeof response === "object" &&
                "status" in response
              ) {
                enhancedData.status_code =
                  enhancedData.status_code || response.status;

                // Try to extract response size from headers
                const contentLength = response.headers?.get?.("content-length");
                if (contentLength) {
                  enhancedData.response_body_size = parseInt(contentLength, 10);
                }
              }
            }
          }

          const event: SentryEventEntry = {
            id: generateId(),
            timestamp: Date.now(),
            source: "breadcrumb",
            eventType: SentryEventType.Breadcrumb,
            level: mapLevelToEventLevel(breadcrumbData.level),
            message: message,
            data: {
              category,
              type: breadcrumbData.type,
              data: enhancedData,
            },
            rawData: { breadcrumb: breadcrumbData, hint: breadcrumbHint },
          };
          eventStore.add(event);

          return breadcrumb;
        }
      );
    } catch (error) {
      console.warn("Failed to setup breadcrumb listeners:", error);
    }
  }

  /**
   * Setup native bridge interception
   * Note: This feature is disabled due to Metro bundler compatibility issues
   * Native bridge events will not be captured, but all other Sentry events will work normally
   */
  private setupNativeBridgeInterception(): void {
    // Disabled: Dynamic requires cause Metro bundler issues
    // Native bridge interception is optional functionality
    // All other Sentry event capture (errors, transactions, spans, breadcrumbs) will work normally
  }
}

// =============================================================================
// PUBLIC API
// =============================================================================

// Create default instance
export const sentryEventLogger = new SentryEventLogger();

/**
 * Setup Sentry event listeners (convenience function)
 */
export function setupSentryEventListeners(): boolean {
  return sentryEventLogger.setup();
}

/**
 * Configure max events to store
 */
export function setMaxSentryEvents(max: number): void {
  sentryEventLogger.setMaxEvents(max);
}

/**
 * Get all stored Sentry events
 */
export function getSentryEvents(): SentryEventEntry[] {
  return sentryEventLogger.getEvents();
}

/**
 * Clear all stored Sentry events
 */
export function clearSentryEvents(): void {
  sentryEventLogger.clearEvents();
}

/**
 * Generate test Sentry events for testing the logger
 */
export function generateTestSentryEvents(): void {
  const now = Date.now();

  // Create comprehensive sample events to test all possible types and mappings
  const testEvents: SentryEventEntry[] = [
    // HTTP Request Test Events - These will show insights
    {
      id: generateId(),
      timestamp: now,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "HTTP GET /api/users",
      data: {
        category: "xhr",
        method: "GET",
        url: "/api/users",
        status_code: 200,
        duration: 1250,
        request_body_size: 0,
        response_body_size: 4567,
        test: true,
      },
      rawData: {
        category: "xhr",
        message: "HTTP GET /api/users",
        data: {
          method: "GET",
          url: "/api/users",
          status_code: 200,
        },
      },
    },
    {
      id: generateId(),
      timestamp: now - 100,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Error,
      message: "HTTP POST /api/auth/login failed",
      data: {
        category: "fetch",
        method: "POST",
        url: "/api/auth/login",
        status_code: 401,
        duration: 350,
        request_body_size: 125,
        response_body_size: 89,
        test: true,
      },
      rawData: {
        category: "fetch",
        message: "HTTP POST /api/auth/login failed",
        data: {
          method: "POST",
          url: "/api/auth/login",
          status_code: 401,
        },
      },
    },
    {
      id: generateId(),
      timestamp: now - 200,
      source: "span",
      eventType: SentryEventType.Span,
      level: SentryEventLevel.Info,
      message: "Span ended: HTTP GET /api/data/large",
      data: {
        spanId: "span123",
        traceId: "trace456",
        operation: "http.client",
        description: "GET /api/data/large",
        status: "ok",
        duration: 4500,
        method: "GET",
        url: "/api/data/large",
        statusCode: 200,
        responseSize: 2048000,
        test: true,
      },
      rawData: {
        span_id: "span123",
        trace_id: "trace456",
        op: "http.client",
        description: "GET /api/data/large",
        start_timestamp: (now - 4700) / 1000,
        timestamp: (now - 200) / 1000,
        data: {
          "http.request.method": "GET",
          "url.full": "/api/data/large",
          "http.response.status_code": 200,
          "http.response_content_length": 2048000,
        },
      } as SpanJSON,
    },
    {
      id: generateId(),
      timestamp: now - 300,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Error,
      message: "HTTP POST /api/process failed",
      data: {
        category: "http",
        method: "POST",
        url: "/api/process",
        status_code: 500,
        duration: 892,
        test: true,
      },
      rawData: {
        category: "http",
        message: "HTTP POST /api/process failed",
        data: {
          method: "POST",
          url: "/api/process",
          status_code: 500,
        },
      },
    },
    {
      id: generateId(),
      timestamp: now - 400,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Warning,
      message: "HTTP GET /api/slow-endpoint",
      data: {
        category: "xhr",
        method: "GET",
        url: "/api/slow-endpoint",
        status_code: 200,
        duration: 3567,
        response_body_size: 12345,
        test: true,
      },
      rawData: {
        category: "xhr",
        message: "HTTP GET /api/slow-endpoint",
        data: {
          method: "GET",
          url: "/api/slow-endpoint",
          status_code: 200,
        },
      },
    },
    {
      id: generateId(),
      timestamp: now - 500,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Error,
      message: "HTTP POST /api/upload rate limited",
      data: {
        category: "fetch",
        method: "POST",
        url: "/api/upload",
        status_code: 429,
        duration: 125,
        response_body_size: 234,
        test: true,
      },
      rawData: {
        category: "fetch",
        message: "HTTP POST /api/upload rate limited",
        data: {
          method: "POST",
          url: "/api/upload",
          status_code: 429,
        },
      },
    },
    // Error events with insights
    {
      id: generateId(),
      timestamp: now - 600,
      source: "envelope",
      eventType: SentryEventType.Error,
      level: SentryEventLevel.Error,
      message: "Network request failed: timeout",
      data: {
        category: "error",
        errorType: "NetworkError",
        errorMessage: "Network request failed",
        test: true,
      },
      rawData: {
        message: "Network request failed: timeout",
        level: "error",
        exception: { type: "NetworkError" },
      },
    },
    {
      id: generateId(),
      timestamp: now - 700,
      source: "envelope",
      eventType: SentryEventType.Error,
      level: SentryEventLevel.Error,
      message: "AsyncStorage.getItem failed: null reference",
      data: {
        category: "error",
        errorType: "TypeError",
        errorMessage: "Cannot read property 'data' of undefined",
        stackTrace:
          "at AsyncStorage.getItem (/node_modules/@react-native-async-storage/async-storage/lib/AsyncStorage.js:123:15)",
        test: true,
      },
      rawData: {
        message: "AsyncStorage.getItem failed: null reference",
        level: "error",
        exception: { type: "TypeError" },
      },
    },
    // Transaction with HTTP spans
    {
      id: generateId(),
      timestamp: now - 800,
      source: "transaction",
      eventType: SentryEventType.Transaction,
      level: SentryEventLevel.Info,
      message: "Transaction finished: /api/checkout (2345ms)",
      data: {
        transactionName: "/api/checkout",
        operation: "http.server",
        traceId: "trace789",
        status: "ok",
        duration: 2345,
        spans: 5,
        test: true,
      },
      rawData: {
        transaction: "/api/checkout",
        start_timestamp: (now - 3145) / 1000,
        timestamp: (now - 800) / 1000,
        contexts: {
          trace: {
            trace_id: "trace789",
            op: "http.server",
            status: "ok",
          },
        },
        spans: [
          {
            op: "http.client",
            description: "POST /api/payment",
            span_id: "span123",
            trace_id: "trace789",
            start_timestamp: (now - 2900) / 1000,
            timestamp: (now - 1400) / 1000,
            data: {
              "http.request.method": "POST",
              "url.full": "/api/payment",
              "http.response.status_code": 200,
            },
          },
          {
            op: "http.client",
            description: "GET /api/inventory",
            span_id: "span124",
            trace_id: "trace789",
            start_timestamp: (now - 2800) / 1000,
            timestamp: (now - 1900) / 1000,
            data: {
              "http.request.method": "GET",
              "url.full": "/api/inventory",
              "http.response.status_code": 200,
            },
          },
        ] as SpanJSON[],
      } as SentryEvent,
    },
    // Additional event types
    {
      id: generateId(),
      timestamp: now - 1000,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "User navigated to Messages",
      data: {
        category: "navigation",
        from: "/dashboard",
        to: "/messages",
        test: true,
      },
      rawData: {
        category: "navigation",
        message: "User navigated to Messages",
      },
    },
    {
      id: generateId(),
      timestamp: now - 1100,
      source: "envelope",
      eventType: SentryEventType.Session,
      level: SentryEventLevel.Info,
      message: "User session started",
      data: { sessionId: "sess789", platform: "ios", test: true },
      rawData: { status: "ok", started: now - 1100 },
    },
  ];

  testEvents.forEach((event) => eventStore.add(event));
  console.log(
    `Generated ${testEvents.length} test Sentry events with enhanced HTTP data and insights`
  );
}
