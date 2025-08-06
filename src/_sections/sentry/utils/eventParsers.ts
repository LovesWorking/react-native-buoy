/**
 * Event parsers for extracting key information from different Sentry event types
 */

import type { ConsoleTransportEntry } from "../../../_shared/logger/types";
import type { SentryEvent } from "../types";
import { formatDuration, parseUrl } from "./formatting";

/**
 * Extract formatted message based on event type
 */
export function formatEventMessage(entry: ConsoleTransportEntry): string {
  const { metadata, message } = entry;

  // HTTP Events
  if (
    metadata.category === "xhr" ||
    metadata.category === "fetch" ||
    metadata.category === "http"
  ) {
    const data = (metadata.data || {}) as Record<string, any>;
    const method = metadata.method || data.method || "GET";
    const url = metadata.url || data.url || "";
    const status = metadata.status_code || data.status_code || metadata.status;
    const duration = metadata.duration || data.duration;

    if (url) {
      const urlParts = parseUrl(url);
      const path = urlParts?.pathname || url;
      const statusPart = status ? ` • ${status}` : "";
      const durationPart = duration ? ` • ${formatDuration(duration)}` : "";
      return `${method} ${path}${statusPart}${durationPart}`;
    }
  }

  // Touch Events
  const touchData = metadata.data as Record<string, any> | undefined;
  if (metadata.category === "touch" && touchData?.path) {
    const component =
      touchData.path[0]?.label || touchData.path[0]?.name || "Component";
    const route = touchData.route || metadata.route;
    return `tap ${component}${route ? ` • ${route}` : ""}`;
  }

  // Navigation Events
  if (metadata.category === "navigation") {
    const navData = (metadata.data || {}) as Record<string, any>;
    const from = navData.from || metadata.from;
    const to = navData.to || metadata.to;
    const duration = metadata.duration || navData.duration;

    if (from && to) {
      const durationPart = duration ? ` • ${formatDuration(duration)}` : "";
      return `${from} → ${to}${durationPart}`;
    } else if (to) {
      return `Navigate to ${to}`;
    }
  }

  // Error Events
  if (entry.level === "error" || metadata.sentryEventType === "error") {
    const errorType = metadata.errorType || metadata.name || "Error";
    const errorMessage =
      metadata.errorMessage ||
      (typeof message === "string" ? message : message?.message) ||
      "Unknown error";
    const handled = metadata.handled !== false ? "" : " [unhandled]";

    // Truncate long error messages
    const shortMessage =
      typeof errorMessage === "string" && errorMessage.length > 50
        ? errorMessage.substring(0, 47) + "..."
        : String(errorMessage);

    return `${errorType}: ${shortMessage}${handled}`;
  }

  // Transaction Events
  if (
    metadata.sentryEventType === "transaction" ||
    metadata.source === "transaction"
  ) {
    const name =
      metadata.transactionName || metadata.transaction || "Transaction";
    const duration = metadata.duration;
    const op = metadata.operation || metadata.op;

    if (op === "app.start.cold" || op === "app.start.warm") {
      const type = op.includes("cold") ? "Cold" : "Warm";
      return `${type} start${duration ? ` • ${formatDuration(Number(duration))}` : ""}`;
    }

    return `${name}${duration ? ` • ${formatDuration(Number(duration))}` : ""}`;
  }

  // Span Events
  if (metadata.sentryEventType === "span" || metadata.source === "span") {
    const op = metadata.operation || metadata.op || "span";
    const description = metadata.description || "";
    const duration = metadata.duration;

    return `${op}: ${description}${duration ? ` • ${formatDuration(Number(duration))}` : ""}`;
  }

  // Default to original message
  return typeof message === "string"
    ? message
    : message?.message || "Sentry Event";
}

/**
 * Extract touch event details
 */
export interface TouchEventDetails {
  componentPath: Array<{
    name: string;
    label?: string;
    file?: string;
  }>;
  route?: string;
  timestamp: number;
  customizable: {
    labelName: boolean;
    ignoreNames: boolean;
    breadcrumbCategory: boolean;
  };
}

export function extractTouchEventDetails(
  entry: ConsoleTransportEntry
): TouchEventDetails | null {
  if (entry.metadata.category !== "touch") return null;

  const data = (entry.metadata.data || {}) as Record<string, any>;

  return {
    componentPath: data.path || [],
    route: data.route,
    timestamp: entry.timestamp,
    customizable: {
      labelName: true,
      ignoreNames: true,
      breadcrumbCategory: true,
    },
  };
}

/**
 * Extract component file location from touch event path
 * Looks for components with file extensions like .tsx, .jsx, .js, .ts
 */
export function extractComponentFileFromPath(
  path: Array<{ name: string; label?: string; file?: string }> | undefined
): string | null {
  if (!path || !Array.isArray(path)) return null;

  // Look for a component with a file property that has a known extension
  const fileExtensions = [".tsx", ".jsx", ".js", ".ts"];

  for (const component of path) {
    if (component.file) {
      // Check if it has a valid file extension
      const hasValidExtension = fileExtensions.some((ext) =>
        component.file?.endsWith(ext)
      );
      if (hasValidExtension) {
        // Format as ComponentName(file-path)
        return `${component.name}(${component.file})`;
      }
    }

    // Sometimes the file might be embedded in the name itself
    // e.g., "SignInScreen(./auth/sign-in.tsx)"
    if (component.name && component.name.includes("(")) {
      const match = component.name.match(/([^(]+)\(([^)]+\.(tsx?|jsx?))\)/);
      if (match) {
        return component.name; // Already formatted correctly
      }
    }
  }

  // If no file found, return the first component with a label or just the first component
  const firstWithLabel = path.find((c) => c.label);
  if (firstWithLabel) {
    return `${firstWithLabel.name}${firstWithLabel.label ? ` (${firstWithLabel.label})` : ""}`;
  }

  return path[0]?.name || null;
}

/**
 * Extract navigation event details
 */
export interface NavigationEventDetails {
  from?: string;
  to: string;
  duration?: number;
  routeKey?: string;
  hasBeenSeen?: boolean;
  actionType?: string;
  ttid?: number; // Time to initial display
  customizable: {
    routeNames: boolean;
    ignorePatterns: boolean;
    enableTTID: boolean;
  };
}

export function extractNavigationEventDetails(
  entry: ConsoleTransportEntry
): NavigationEventDetails | null {
  if (
    entry.metadata.category !== "navigation" &&
    entry.metadata.operation !== "navigation" &&
    entry.metadata.op !== "navigation"
  ) {
    return null;
  }

  const data = (entry.metadata.data || entry.metadata) as Record<string, any>;

  return {
    from: data.from || data["previous_route.name"],
    to: data.to || data["route.name"] || data.routeName || "Unknown",
    duration: data.duration,
    routeKey: data["route.key"] || data.routeKey,
    hasBeenSeen: data["route.has_been_seen"],
    actionType: data.actionType,
    ttid: data.ttid || data.time_to_initial_display,
    customizable: {
      routeNames: true,
      ignorePatterns: true,
      enableTTID: true,
    },
  };
}

/**
 * Extract error event details
 */
export interface ErrorEventDetails {
  type: string;
  message: string;
  stackTrace?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  handled: boolean;
  mechanism?: string;
  isNative?: boolean;
  customizable: {
    message: boolean;
    level: boolean;
    fingerprint: boolean;
    tags: boolean;
    user: boolean;
  };
}

export function extractErrorEventDetails(
  entry: ConsoleTransportEntry
): ErrorEventDetails | null {
  if (entry.level !== "error" && entry.metadata.sentryEventType !== "error") {
    return null;
  }

  const metadata = entry.metadata;
  const rawData = metadata._sentryRawData as SentryEvent | undefined;

  // Try to extract from exception data
  const exception = (rawData as any)?.exception?.values?.[0];

  return {
    type: metadata.errorType || exception?.type || metadata.name || "Error",
    message: metadata.errorMessage || exception?.value || entry.message,
    stackTrace:
      metadata.stackTrace ||
      exception?.stacktrace?.frames
        ?.map(
          (f: any) =>
            `  at ${f.function || "anonymous"} (${f.filename}:${f.lineno}:${f.colno})`
        )
        .join("\n"),
    fileName: (metadata.fileName || metadata.file) as string | undefined,
    lineNumber: (metadata.lineNumber || metadata.line) as number | undefined,
    columnNumber: (metadata.columnNumber || metadata.column) as
      | number
      | undefined,
    handled:
      metadata.handled !== false && exception?.mechanism?.handled !== false,
    mechanism: exception?.mechanism?.type,
    isNative:
      metadata.platform === "native" ||
      exception?.mechanism?.type === "onerror",
    customizable: {
      message: true,
      level: true,
      fingerprint: true,
      tags: true,
      user: true,
    },
  };
}

/**
 * Extract performance/transaction details
 */
export interface PerformanceEventDetails {
  name: string;
  operation: string;
  duration?: number;
  status?: string;
  measurements?: Record<string, { value: number; unit: string }>;
  spans?: Array<{
    op: string;
    description: string;
    duration?: number;
  }>;
  appStart?: {
    type: "cold" | "warm";
    duration: number;
    breakdown?: Record<string, number>;
  };
  customizable: {
    name: boolean;
    sampling: boolean;
    measurements: boolean;
  };
}

export function extractPerformanceEventDetails(
  entry: ConsoleTransportEntry
): PerformanceEventDetails | null {
  const metadata = entry.metadata;

  if (
    metadata.sentryEventType !== "transaction" &&
    metadata.source !== "transaction" &&
    !metadata.transactionName
  ) {
    return null;
  }

  const rawData = metadata._sentryRawData as SentryEvent | undefined;
  const op =
    metadata.operation || metadata.op || rawData?.contexts?.trace?.op || "";

  // Check for app start
  let appStart: PerformanceEventDetails["appStart"];
  if (typeof op === "string" && op.includes("app.start")) {
    appStart = {
      type: op.includes("cold") ? "cold" : "warm",
      duration: Number(metadata.duration) || 0,
      breakdown: rawData?.measurements,
    };
  }

  return {
    name:
      ((metadata.transactionName ||
        metadata.transaction ||
        rawData?.transaction) as string) || "Transaction",
    operation: String(op),
    duration: metadata.duration as number | undefined,
    status: (metadata.status || (rawData?.contexts?.trace as any)?.status) as
      | string
      | undefined,
    measurements: rawData?.measurements,
    spans: rawData?.spans?.map((span) => ({
      op: span.op || "",
      description: span.description || "",
      duration:
        span.timestamp && span.start_timestamp
          ? (span.timestamp - span.start_timestamp) * 1000
          : undefined,
    })),
    appStart,
    customizable: {
      name: true,
      sampling: true,
      measurements: false, // Auto-captured
    },
  };
}

/**
 * Extract device context information
 */
export interface DeviceContextInfo {
  app: {
    name?: string;
    version?: string;
    build?: string;
    inForeground?: boolean;
  };
  device: {
    model?: string;
    manufacturer?: string;
    os?: string;
    osVersion?: string;
    isEmulator?: boolean;
    memory?: number;
  };
  runtime: {
    name?: string;
    version?: string;
    engine?: string;
  };
  customizable: boolean; // Generally not customizable
}

export function extractDeviceContext(
  entry: ConsoleTransportEntry
): DeviceContextInfo | null {
  const rawData = entry.metadata._sentryRawData as SentryEvent | undefined;
  if (!rawData?.contexts) return null;

  const contexts = rawData.contexts;

  return {
    app: {
      name: contexts.app?.app_name,
      version: contexts.app?.app_version,
      build: contexts.app?.app_build,
      inForeground: contexts.app?.in_foreground,
    },
    device: {
      model: contexts.device?.model,
      manufacturer: contexts.device?.manufacturer,
      os: contexts.os?.name,
      osVersion: contexts.os?.version,
      isEmulator: contexts.device?.simulator,
      memory: contexts.device?.memory_size,
    },
    runtime: {
      name: contexts.runtime?.name,
      version: contexts.runtime?.version,
      engine: contexts.runtime?.engine,
    },
    customizable: false,
  };
}
