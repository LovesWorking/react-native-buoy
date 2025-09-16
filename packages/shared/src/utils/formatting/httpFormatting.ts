/**
 * HTTP-specific formatting utilities
 */

import { gameUIColors } from "../../ui/gameUI/constants/gameUIColors";

/**
 * Format HTTP status code with color and meaning
 * @param status HTTP status code
 * @returns Object with formatted text, color, and meaning
 */
export function formatHttpStatus(status: number): {
  text: string;
  color: string;
  meaning: string;
} {
  // 1xx Informational
  if (status >= 100 && status < 200) {
    return {
      text: String(status),
      color: gameUIColors.info,
      meaning: "Informational",
    };
  }

  // 2xx Success
  if (status >= 200 && status < 300) {
    const meanings: Record<number, string> = {
      200: "OK",
      201: "Created",
      202: "Accepted",
      204: "No Content",
      206: "Partial Content",
    };
    return {
      text: String(status),
      color: gameUIColors.success,
      meaning: meanings[status] || "Success",
    };
  }

  // 3xx Redirection
  if (status >= 300 && status < 400) {
    const meanings: Record<number, string> = {
      301: "Moved Permanently",
      302: "Found",
      303: "See Other",
      304: "Not Modified",
      307: "Temporary Redirect",
      308: "Permanent Redirect",
    };
    return {
      text: String(status),
      color: gameUIColors.warning,
      meaning: meanings[status] || "Redirect",
    };
  }

  // 4xx Client Error
  if (status >= 400 && status < 500) {
    const meanings: Record<number, string> = {
      400: "Bad Request",
      401: "Unauthorized",
      402: "Payment Required",
      403: "Forbidden",
      404: "Not Found",
      405: "Method Not Allowed",
      408: "Request Timeout",
      409: "Conflict",
      410: "Gone",
      422: "Unprocessable Entity",
      429: "Too Many Requests",
    };
    return {
      text: String(status),
      color: gameUIColors.error,
      meaning: meanings[status] || "Client Error",
    };
  }

  // 5xx Server Error
  if (status >= 500) {
    const meanings: Record<number, string> = {
      500: "Internal Server Error",
      501: "Not Implemented",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
      505: "HTTP Version Not Supported",
    };
    return {
      text: String(status),
      color: gameUIColors.error,
      meaning: meanings[status] || "Server Error",
    };
  }

  return {
    text: String(status),
    color: gameUIColors.muted,
    meaning: "Unknown",
  };
}

/**
 * Get color for HTTP method
 * @param method HTTP method (GET, POST, etc.)
 * @returns Color string for the method
 */
export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: gameUIColors.success,
    POST: gameUIColors.info,
    PUT: gameUIColors.warning,
    DELETE: gameUIColors.error,
    PATCH: gameUIColors.network,
    HEAD: gameUIColors.muted,
    OPTIONS: gameUIColors.secondary,
    CONNECT: gameUIColors.critical,
    TRACE: gameUIColors.env,
  };

  return colors[method.toUpperCase()] || gameUIColors.muted;
}

/**
 * Parse URL into components for display
 * @param url The URL to parse
 * @returns URL components
 */
export interface UrlComponents {
  protocol: string;
  host: string;
  port?: string;
  pathname: string;
  search?: string;
  hash?: string;
}

export function parseUrl(url: string): UrlComponents | null {
  try {
    const parsed = new URL(url);
    return {
      protocol: parsed.protocol.replace(":", ""),
      host: parsed.hostname,
      port: parsed.port || undefined,
      pathname: parsed.pathname,
      search: parsed.search || undefined,
      hash: parsed.hash || undefined,
    };
  } catch {
    return null;
  }
}
