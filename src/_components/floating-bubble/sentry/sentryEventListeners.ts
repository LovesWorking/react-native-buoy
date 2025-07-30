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

// =============================================================================
// STORAGE SYSTEM
// =============================================================================

/**
 * In-memory storage for Sentry events with configurable limits
 */
class SentryEventStore {
  private events: SentryEventEntry[] = [];
  private maxEvents: number = 500;

  /**
   * Set maximum number of events to store
   */
  setMaxEvents(max: number): void {
    this.maxEvents = max;
    this.trimEvents();
  }

  /**
   * Add a new event to storage
   */
  add(event: SentryEventEntry): void {
    this.events.unshift(event);
    this.trimEvents();
  }

  /**
   * Get all stored events
   */
  getEvents(): SentryEventEntry[] {
    return [...this.events];
  }

  /**
   * Clear all stored events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Get events filtered by type
   */
  getEventsByType(type: SentryEventType): SentryEventEntry[] {
    return this.events.filter((event) => event.eventType === type);
  }

  /**
   * Get events filtered by level
   */
  getEventsByLevel(level: SentryEventLevel): SentryEventEntry[] {
    return this.events.filter((event) => event.level === level);
  }

  /**
   * Get event count
   */
  getCount(): number {
    return this.events.length;
  }

  /**
   * Trim events to max limit
   */
  private trimEvents(): void {
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }
  }
}

// Global store instance
const eventStore = new SentryEventStore();

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
    if (__DEV__) {
      console.log("Native bridge interception skipped for Metro compatibility");
    }
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
 * Get Sentry events by type
 */
export function getSentryEventsByType(
  type: SentryEventType
): SentryEventEntry[] {
  return sentryEventLogger.getEventsByType(type);
}

/**
 * Get Sentry events by level
 */
export function getSentryEventsByLevel(
  level: SentryEventLevel
): SentryEventEntry[] {
  return sentryEventLogger.getEventsByLevel(level);
}

/**
 * Get count of stored Sentry events
 */
export function getSentryEventCount(): number {
  return sentryEventLogger.getEventCount();
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
  ];

  testEvents.forEach((event) => eventStore.add(event));
  console.log(
    `Generated ${testEvents.length} comprehensive test Sentry events covering all event types and log categories`
  );
}
