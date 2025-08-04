// Safe import for optional Sentry dependency
let sentryClient: any = null;
let getSentryClient: (() => any) | null = null;
let userProvidedGetClient: (() => any) | null = null;

try {
  // Dynamic import to avoid bundling if not installed
  const sentry = require("@sentry/react-native");
  getSentryClient = sentry.getClient;
} catch (error) {
  // Sentry not installed - will gracefully degrade
  getSentryClient = null;
}

/**
 * Configure Sentry client provider for dependency injection approach
 * Use this if you prefer to manually provide the Sentry getClient function
 * @param getClientFn - Function that returns the Sentry client instance
 */
export function configureSentryClient(getClientFn: () => any): void {
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

export const getEventEmoji = (eventType: SentryEventType): string => {
  switch (eventType) {
    case SentryEventType.Error:
      return "🚨";
    case SentryEventType.Transaction:
      return "📊";
    case SentryEventType.Span:
      return "⚡";
    case SentryEventType.Session:
      return "👤";
    case SentryEventType.UserFeedback:
      return "💬";
    case SentryEventType.Profile:
      return "📈";
    case SentryEventType.Replay:
      return "🎬";
    case SentryEventType.Attachment:
      return "📎";
    case SentryEventType.ClientReport:
      return "📋";
    case SentryEventType.Log:
      return "📝";
    case SentryEventType.Breadcrumb:
      return "🍞";
    case SentryEventType.Native:
      return "🌉";
    default:
      return "📄";
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
      const clientWithEvents = client as {
        on?: (event: string, callback: (...args: any[]) => void) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
      };

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).on("beforeEnvelope", (envelope: SentryEnvelope) => {
        const events = parseEnvelope(envelope);
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).on("spanEnd", (span: Record<string, unknown>) => {
        const event: SentryEventEntry = {
          id: generateId(),
          timestamp: Date.now(),
          source: "span",
          eventType: SentryEventType.Span,
          level: SentryEventLevel.Info,
          message: `Span ended: ${span.description || span.op || "Unknown"}`,
          data: {
            spanId: span.span_id,
            traceId: span.trace_id,
            operation: span.op || span.operation,
            description: span.description,
            status: span.status,
          },
          rawData: span,
        };
        eventStore.add(event);
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).on("spanStart", (span: Record<string, unknown>) => {
        const event: SentryEventEntry = {
          id: generateId(),
          timestamp: Date.now(),
          source: "span",
          eventType: SentryEventType.Span,
          level: SentryEventLevel.Debug,
          message: `Span started: ${span.description || span.op || "Unknown"}`,
          data: {
            spanId: span.span_id,
            traceId: span.trace_id,
            operation: span.op || span.operation,
            description: span.description,
          },
          rawData: span,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).on(
        "transactionStart",
        (transaction: Record<string, unknown>) => {
          const event: SentryEventEntry = {
            id: generateId(),
            timestamp: Date.now(),
            source: "transaction",
            eventType: SentryEventType.Transaction,
            level: SentryEventLevel.Info,
            message: `Transaction started: ${transaction.name || "Unknown"}`,
            data: {
              transactionName: transaction.name,
              operation: transaction.op,
              traceId: transaction.traceId,
            },
            rawData: transaction,
          };
          eventStore.add(event);
        }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).on(
        "transactionFinish",
        (transaction: Record<string, unknown>) => {
          const duration =
            typeof transaction.endTimestamp === "number" &&
            typeof transaction.startTimestamp === "number"
              ? transaction.endTimestamp - transaction.startTimestamp
              : null;

          const event: SentryEventEntry = {
            id: generateId(),
            timestamp: Date.now(),
            source: "transaction",
            eventType: SentryEventType.Transaction,
            level: SentryEventLevel.Info,
            message: `Transaction finished: ${transaction.name || "Unknown"}${
              duration ? ` (${duration}ms)` : ""
            }`,
            data: {
              transactionName: transaction.name,
              operation: transaction.op,
              traceId: transaction.traceId,
              status: transaction.status,
              duration,
            },
            rawData: transaction,
          };
          eventStore.add(event);
        }
      );
    } catch (error) {
      console.warn("Failed to setup transaction listeners:", error);
    }
  }

  /**
   * Setup breadcrumb event listeners
   */
  private setupBreadcrumbListeners(client: Record<string, unknown>): void {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).on(
        "beforeAddBreadcrumb",
        (breadcrumb: Record<string, unknown>) => {
          const category = String(breadcrumb.category || "unknown");
          const message = String(breadcrumb.message || "no message");

          // Skip breadcrumbs from our own logging to prevent infinite loops
          if (
            category === "console" &&
            (message.includes("Sentry") ||
              message.includes("event logger") ||
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

          const event: SentryEventEntry = {
            id: generateId(),
            timestamp: Date.now(),
            source: "breadcrumb",
            eventType: SentryEventType.Breadcrumb,
            level: mapLevelToEventLevel(String(breadcrumb.level)),
            message: message,
            data: {
              category,
              type: breadcrumb.type,
              data: breadcrumb.data,
            },
            rawData: breadcrumb,
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
    // Error events (maps to LogType.Error)
    {
      id: generateId(),
      timestamp: now,
      source: "envelope",
      eventType: SentryEventType.Error,
      level: SentryEventLevel.Error,
      message: "Network request failed",
      data: {
        category: "error",
        endpoint: "/api/users",
        statusCode: 500,
        test: true,
      },
      rawData: {
        message: "Network request failed",
        level: "error",
        exception: { type: "NetworkError" },
      },
    },
    {
      id: generateId(),
      timestamp: now - 500,
      source: "envelope",
      eventType: SentryEventType.Error,
      level: SentryEventLevel.Fatal,
      message: "Critical application crash",
      data: {
        category: "error",
        component: "App",
        crashType: "fatal",
        test: true,
      },
      rawData: { message: "Critical application crash", level: "fatal" },
    },

    // Auth events (maps to LogType.Auth)
    {
      id: generateId(),
      timestamp: now - 1000,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "User logged in successfully",
      data: {
        category: "auth",
        action: "login",
        userId: "user123",
        test: true,
      },
      rawData: { category: "auth", message: "User logged in successfully" },
    },
    {
      id: generateId(),
      timestamp: now - 1200,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Warning,
      message: "Authentication token expired",
      data: { category: "auth", action: "token_expire", test: true },
      rawData: { category: "auth", message: "Authentication token expired" },
    },

    // Custom events (maps to LogType.Custom)
    {
      id: generateId(),
      timestamp: now - 1500,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "Payment processing initiated",
      data: { category: "payment", amount: 99.99, currency: "USD", test: true },
      rawData: { category: "payment", message: "Payment processing initiated" },
    },
    {
      id: generateId(),
      timestamp: now - 1700,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "Analytics event tracked",
      data: {
        category: "analytics",
        event: "page_view",
        page: "/dashboard",
        test: true,
      },
      rawData: { category: "analytics", message: "Analytics event tracked" },
    },

    // Debug events (maps to LogType.Debug)
    {
      id: generateId(),
      timestamp: now - 2000,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Debug,
      message: "Debug checkpoint reached",
      data: { category: "debug", checkpoint: "user_validation", test: true },
      rawData: { category: "debug", message: "Debug checkpoint reached" },
    },

    // Generic/Log events (maps to LogType.Generic)
    {
      id: generateId(),
      timestamp: now - 2500,
      source: "envelope",
      eventType: SentryEventType.Log,
      level: SentryEventLevel.Info,
      message: "Application log entry",
      data: { category: "log", module: "core", test: true },
      rawData: { message: "Application log entry", level: "info" },
    },
    {
      id: generateId(),
      timestamp: now - 2700,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "Generic system message",
      data: { category: "generic", test: true },
      rawData: { category: "generic", message: "Generic system message" },
    },

    // HTTP Request events (maps to LogType.HTTPRequest)
    {
      id: generateId(),
      timestamp: now - 3000,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "HTTP GET /api/messages",
      data: {
        category: "xhr",
        method: "GET",
        url: "/api/messages",
        status: 200,
        test: true,
      },
      rawData: { category: "xhr", message: "HTTP GET /api/messages" },
    },
    {
      id: generateId(),
      timestamp: now - 3200,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Warning,
      message: "HTTP POST /api/broadcasts failed",
      data: {
        category: "fetch",
        method: "POST",
        url: "/api/broadcasts",
        status: 429,
        test: true,
      },
      rawData: {
        category: "fetch",
        message: "HTTP POST /api/broadcasts failed",
      },
    },

    // Navigation events (maps to LogType.Navigation)
    {
      id: generateId(),
      timestamp: now - 3500,
      source: "transaction",
      eventType: SentryEventType.Transaction,
      level: SentryEventLevel.Info,
      message: "Screen navigation to Messages",
      data: { transactionName: "MessagesScreen", op: "navigation", test: true },
      rawData: { name: "MessagesScreen", op: "navigation" },
    },
    {
      id: generateId(),
      timestamp: now - 3700,
      source: "span",
      eventType: SentryEventType.Span,
      level: SentryEventLevel.Info,
      message: "Navigation transition completed",
      data: {
        operation: "navigation",
        description: "screen_transition",
        test: true,
      },
      rawData: { op: "navigation", description: "screen_transition" },
    },
    {
      id: generateId(),
      timestamp: now - 3900,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "Route changed to /inbox",
      data: {
        category: "navigation",
        from: "/dashboard",
        to: "/inbox",
        test: true,
      },
      rawData: { category: "navigation", message: "Route changed to /inbox" },
    },

    // Replay events (maps to LogType.Replay)
    {
      id: generateId(),
      timestamp: now - 4000,
      source: "envelope",
      eventType: SentryEventType.Replay,
      level: SentryEventLevel.Info,
      message: "Session replay started",
      data: { replayId: "replay123", duration: 0, test: true },
      rawData: { type: "replay_event", replay_id: "replay123" },
    },
    {
      id: generateId(),
      timestamp: now - 4200,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "Replay segment captured",
      data: { category: "replay.segment", segmentId: "seg456", test: true },
      rawData: {
        category: "replay.segment",
        message: "Replay segment captured",
      },
    },

    // State events (maps to LogType.State)
    {
      id: generateId(),
      timestamp: now - 4500,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "Redux state updated",
      data: {
        category: "redux",
        action: "USER_LOGIN",
        state: "authenticated",
        test: true,
      },
      rawData: { category: "redux", message: "Redux state updated" },
    },
    {
      id: generateId(),
      timestamp: now - 4700,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Debug,
      message: "Component state changed",
      data: {
        category: "state",
        component: "MessagesList",
        property: "loading",
        test: true,
      },
      rawData: { category: "state", message: "Component state changed" },
    },

    // System events (maps to LogType.System)
    {
      id: generateId(),
      timestamp: now - 5000,
      source: "envelope",
      eventType: SentryEventType.Session,
      level: SentryEventLevel.Info,
      message: "User session started",
      data: { sessionId: "sess789", platform: "ios", test: true },
      rawData: { status: "ok", started: now - 5000 },
    },
    {
      id: generateId(),
      timestamp: now - 5200,
      source: "envelope",
      eventType: SentryEventType.Profile,
      level: SentryEventLevel.Info,
      message: "Performance profile collected",
      data: { profileId: "prof456", duration: 150, test: true },
      rawData: { type: "profile", duration: 150 },
    },
    {
      id: generateId(),
      timestamp: now - 5400,
      source: "envelope",
      eventType: SentryEventType.Attachment,
      level: SentryEventLevel.Info,
      message: "Debug attachment uploaded",
      data: { filename: "crash_log.txt", size: 2048, test: true },
      rawData: { filename: "crash_log.txt", content_type: "text/plain" },
    },
    {
      id: generateId(),
      timestamp: now - 5600,
      source: "envelope",
      eventType: SentryEventType.ClientReport,
      level: SentryEventLevel.Info,
      message: "SDK health report",
      data: { discardedEvents: 5, reason: "rate_limit", test: true },
      rawData: {
        timestamp: now - 5600,
        discarded_events: [{ reason: "rate_limit", quantity: 5 }],
      },
    },
    {
      id: generateId(),
      timestamp: now - 5800,
      source: "native",
      eventType: SentryEventType.Native,
      level: SentryEventLevel.Info,
      message: "Native bridge event",
      data: { bridge: "iOS", method: "sendEnvelope", test: true },
      rawData: { platform: "ios", method: "sendEnvelope" },
    },
    {
      id: generateId(),
      timestamp: now - 6000,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "Console log captured",
      data: { category: "console", level: "info", test: true },
      rawData: { category: "console", message: "Console log captured" },
    },

    // Touch events (maps to LogType.Touch)
    {
      id: generateId(),
      timestamp: now - 6500,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "User tapped send button",
      data: {
        category: "touch",
        element: "send_button",
        coordinates: { x: 150, y: 300 },
        test: true,
      },
      rawData: { category: "touch", message: "User tapped send button" },
    },

    // User Action events (maps to LogType.UserAction)
    {
      id: generateId(),
      timestamp: now - 7000,
      source: "envelope",
      eventType: SentryEventType.UserFeedback,
      level: SentryEventLevel.Info,
      message: "User submitted feedback",
      data: { feedbackId: "fb123", rating: 5, test: true },
      rawData: {
        name: "John Doe",
        email: "john@example.com",
        comments: "Great app!",
      },
    },
    {
      id: generateId(),
      timestamp: now - 7200,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Info,
      message: "User created new broadcast",
      data: { category: "ui.action", action: "create_broadcast", test: true },
      rawData: { category: "ui.action", message: "User created new broadcast" },
    },

    // Unknown/Unhandled event type
    {
      id: generateId(),
      timestamp: now - 7500,
      source: "envelope",
      eventType: SentryEventType.Unknown,
      level: SentryEventLevel.Warning,
      message: "Unknown event type received",
      data: { unknownField: "mysterious_value", test: true },
      rawData: { type: "unknown", data: "mysterious_value" },
    },

    // Additional breadcrumb variations with different levels
    {
      id: generateId(),
      timestamp: now - 8000,
      source: "breadcrumb",
      eventType: SentryEventType.Breadcrumb,
      level: SentryEventLevel.Warning,
      message: "API rate limit approaching",
      data: { category: "http", remaining: 10, limit: 1000, test: true },
      rawData: { category: "http", message: "API rate limit approaching" },
    },

    // COMPREHENSIVE DATA EXPLORER TEST EVENT - Shows ALL supported data types
    (() => {
      const testEventData: any = {
        id: generateId(),
        timestamp: now - 100,
        source: "envelope",
        eventType: SentryEventType.Error,
        level: SentryEventLevel.Error,
        message: "🔍 DataExplorer Test Event - All Data Types Showcase",
        data: {
          category: "dataexplorer_test",
          test: true,
          // All primitive types
          stringValue: "Hello DataExplorer! 🚀",
          numberValue: 42.125,
          booleanTrue: true,
          booleanFalse: false,
          nullValue: null,
          undefinedValue: undefined,
          bigintValue: BigInt(9007199254740991),
          symbolValue: Symbol("dataexplorer_test"),

          // Date objects
          dateISO: new Date("2023-12-25T10:30:00Z"),
          dateNow: new Date(),

          // Function
          exampleFunction: function testFunction(x: number) {
            return x * 2;
          },
          arrowFunction: (x: string) => `processed: ${x}`,

          // RegExp
          emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          phoneRegex: /^\+?[\d\s-()]+$/,

          // Error objects
          networkError: new Error("Network connection failed"),
          validationError: new TypeError("Invalid parameter type"),
          customError: (() => {
            const err = new Error("Custom validation failed");
            (err as any).code = "VALIDATION_ERROR";
            (err as any).statusCode = 400;
            (err as any).details = { field: "email", reason: "invalid_format" };
            return err;
          })(),

          // Arrays with mixed types
          mixedArray: [
            "string",
            123,
            true,
            null,
            { nested: "object" },
            [1, 2, 3],
            new Date(),
            /regex/,
          ],

          // Large array for range testing
          largeDataSet: Array.from({ length: 150 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            category:
              i % 3 === 0 ? "primary" : i % 3 === 1 ? "secondary" : "tertiary",
            active: i % 2 === 0,
            metadata: {
              created: new Date(now - i * 1000 * 60),
              tags: [`tag${i % 5}`, `category${i % 3}`],
              score: Math.round(Math.random() * 100),
            },
          })),

          // Maps
          userPermissions: (() => {
            const map = new Map();
            map.set("read", true);
            map.set("write", false);
            map.set("admin", true);
            map.set(Symbol("special"), "secret_access");
            map.set(123, "numeric_key");
            return map;
          })(),

          // Sets
          uniqueCategories: new Set([
            "error",
            "warning",
            "info",
            "debug",
            "trace",
          ]),

          // Nested objects with various depths
          deeplyNested: {
            level1: {
              level2: {
                level3: {
                  level4: {
                    level5: {
                      treasure: "Found at level 5! 💎",
                      coordinates: { x: 42, y: 128, z: -15 },
                      timestamp: Date.now(),
                    },
                  },
                },
              },
            },
            metadata: {
              version: "1.0.0",
              author: "DataExplorer Team",
              features: [
                "circular_detection",
                "smart_ranges",
                "custom_renderers",
              ],
              stats: {
                totalTypes: 15,
                edgeCases: 8,
                performance: "excellent",
              },
            },
          },

          // Object with various property types
          complexObject: {
            "string-key": "value1",
            123: "numeric-key-value",
            [Symbol("symbol-key")]: "symbol-value",
            "special chars!@#$%": "special-key-value",
            "unicode-🌟": "unicode-value",
            very_long_property_name_that_should_test_wrapping: "long-key-value",
          },

          // Iterable objects
          iterableObject: {
            *[Symbol.iterator]() {
              yield "first";
              yield "second";
              yield "third";
            },
          },

          // Custom objects with prototypes
          customInstance: (() => {
            class CustomClass {
              public name: string = "CustomInstance";
              public type: string = "test";
              public getValue() {
                return 42;
              }
            }
            return new CustomClass();
          })(),

          // Performance test data
          performanceMetrics: {
            renderTime: 16.7,
            memoryUsage: "45.2 MB",
            fps: 60,
            bundleSize: "2.4 MB",
            loadTime: new Date(now - 1500),
            benchmarks: Array.from({ length: 50 }, (_, i) => ({
              test: `performance_test_${i}`,
              duration: Math.random() * 1000,
              passed: Math.random() > 0.1,
              metrics: {
                cpu: Math.random() * 100,
                memory: Math.random() * 512,
                network: Math.random() * 1024,
              },
            })),
          },

          // Edge cases
          edgeCases: {
            emptyString: "",
            emptyArray: [],
            emptyObject: {},
            emptyMap: new Map(),
            emptySet: new Set(),
            zeroNumber: 0,
            negativeNumber: -42,
            infinityValue: Infinity,
            negativeInfinity: -Infinity,
            nanValue: NaN,
            veryLongString:
              "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(
                10
              ),
            specialCharacters:
              "Special chars: \n\t\r\\ \"'`~!@#$%^&*()_+-={}[]|;:,.<>?",
          },
        },
        rawData: (() => {
          // Create circular reference for testing circular detection
          const rawData: any = {
            message: "🔍 DataExplorer Test Event - All Data Types Showcase",
            level: "error",
            environment: "development",
            platform: "react-native",
            sdk: {
              name: "sentry.javascript.react-native",
              version: "5.0.0",
            },
            user: {
              id: "dataexplorer_tester",
              username: "test_user",
              email: "test@dataexplorer.com",
              ip_address: "127.0.0.1",
            },
            tags: {
              component: "DataExplorer",
              test_type: "comprehensive",
              data_types: "all",
            },
            extra: {
              test_metadata: {
                created_at: new Date(now),
                purpose: "Showcase all DataExplorer capabilities",
                coverage: "100%",
                features_tested: [
                  "Type detection",
                  "Circular reference handling",
                  "Large array ranges",
                  "Custom renderers",
                  "Object key sorting",
                  "Deep nesting",
                  "Edge cases",
                ],
              },
            },
            breadcrumbs: Array.from({ length: 25 }, (_, i) => ({
              timestamp: now - i * 1000,
              level: ["info", "warning", "error", "debug"][i % 4],
              category: ["navigation", "xhr", "user", "system"][i % 4],
              message: `Breadcrumb ${i + 1}: Testing data explorer`,
              data: {
                index: i,
                type: "test_breadcrumb",
                metadata: { step: `step_${i}` },
              },
            })),
            contexts: {
              app: {
                app_name: "DataExplorer Test App",
                app_version: "1.0.0",
                app_build: "123",
              },
              device: {
                model: "iPhone 15 Pro",
                orientation: "portrait",
                memory_size: 8589934592,
                battery_level: 85,
              },
              os: {
                name: "iOS",
                version: "17.0",
                build: "21A329",
              },
            },
          };

          // Add circular reference to test circular detection
          rawData.circularRef = rawData;
          rawData.extra.circular_test = rawData;

          return rawData;
        })(),
      };

      // Add circular references to test circular detection in main data
      testEventData.data.circularSelf = testEventData.data;
      testEventData.data.circularParent = testEventData;
      testEventData.data.deeplyNested.circularRef = testEventData.data;

      return testEventData;
    })(),
  ];

  testEvents.forEach((event) => eventStore.add(event));
  console.log(
    `Generated ${testEvents.length} comprehensive test Sentry events covering all event types and log categories, including a COMPREHENSIVE DataExplorer showcase event with ALL supported data types!`
  );
}
