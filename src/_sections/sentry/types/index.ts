// Sentry SDK Types - Aligned with @sentry/core
import type { ConsoleTransportEntry } from "../../../_shared/logger/types";

// From @sentry/core/types-hoist/severity.ts
export type SeverityLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

// From @sentry/core/types-hoist/breadcrumb.ts
export interface Breadcrumb {
  type?: string;
  level?: SeverityLevel;
  event_id?: string;
  category?: string;
  message?: string;
  data?: { [key: string]: any };
  timestamp?: number;
}

export interface FetchBreadcrumbData {
  method: string;
  url: string;
  status_code?: number;
  request_body_size?: number;
  response_body_size?: number;
}

export interface XhrBreadcrumbData {
  method?: string;
  url?: string;
  status_code?: number;
  request_body_size?: number;
  response_body_size?: number;
}

export interface FetchBreadcrumbHint {
  input: any[];
  data?: unknown;
  response?: unknown;
  startTimestamp: number;
  endTimestamp?: number;
}

export interface XhrBreadcrumbHint {
  xhr: unknown;
  input: unknown;
  startTimestamp: number;
  endTimestamp: number;
}

// From @sentry/core/types-hoist/span.ts
export type SpanAttributeValue =
  | string
  | number
  | boolean
  | Array<null | undefined | string>
  | Array<null | undefined | number>
  | Array<null | undefined | boolean>;

export type SpanAttributes = Partial<{
  'sentry.origin': string;
  'sentry.op': string;
  'sentry.source': string;
  'sentry.sample_rate': number;
}> & Record<string, SpanAttributeValue | undefined>;

export interface SpanJSON {
  data: SpanAttributes;
  description?: string;
  op?: string;
  parent_span_id?: string;
  span_id: string;
  start_timestamp: number;
  status?: string;
  timestamp?: number;
  trace_id: string;
  origin?: string;
  profile_id?: string;
  exclusive_time?: number;
  measurements?: Record<string, any>;
  is_segment?: boolean;
  segment_id?: string;
}

// HTTP-specific span attributes (from OpenTelemetry semantic conventions)
export interface HttpSpanAttributes extends SpanAttributes {
  'http.request.method'?: string;
  'http.response.status_code'?: number;
  'http.url'?: string;
  'http.target'?: string;
  'http.host'?: string;
  'http.scheme'?: string;
  'http.status_code'?: number; // deprecated, use http.response.status_code
  'http.method'?: string; // deprecated, use http.request.method
  'http.response_content_length'?: number;
  'http.request_content_length'?: number;
  'http.query'?: string;
  'http.fragment'?: string;
  'url.full'?: string;
  'server.address'?: string;
  'server.port'?: number;
}

// Sentry Event types
export interface SentryEvent {
  event_id?: string;
  level?: SeverityLevel;
  logger?: string;
  platform?: string;
  release?: string;
  dist?: string;
  environment?: string;
  fingerprint?: string[];
  culprit?: string;
  message?: string;
  transaction?: string;
  modules?: { [key: string]: string };
  extra?: { [key: string]: any };
  tags?: { [key: string]: string };
  user?: any;
  contexts?: {
    trace?: {
      trace_id?: string;
      span_id?: string;
      parent_span_id?: string;
      op?: string;
      status?: string;
      data?: { [key: string]: any };
    };
    [key: string]: any;
  };
  breadcrumbs?: Breadcrumb[];
  spans?: SpanJSON[];
  start_timestamp?: number;
  timestamp?: number;
  measurements?: Record<string, any>;
  profile?: any;
}

// Extended types for the dev tools
export interface HttpRequestInfo {
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  requestSize?: number;
  responseSize?: number;
  error?: boolean;
  errorMessage?: string;
  timestamp: number;
  headers?: Record<string, string>;
  query?: string;
  fragment?: string;
}

export interface PerformanceMetrics {
  duration?: number;
  statusCode?: number;
  method?: string;
  url?: string;
  size?: number;
  responseSize?: number;
  requestSize?: number;
  route?: string;
  transitionDuration?: number;
  fromRoute?: string;
}

export interface ErrorDetails {
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  fileName?: string;
  lineNumber?: number;
  columnNumber?: number;
  fatal: boolean;
}

export interface SentryEventInsight {
  type: 'error' | 'performance' | 'security' | 'quality';
  severity: 'high' | 'medium' | 'low';
  message: string;
  details?: string;
  suggestion?: string;
}

// Helper function to extract HTTP data from various Sentry structures
export function extractHttpDataFromSentryEvent(entry: ConsoleTransportEntry): HttpRequestInfo | null {
  const { metadata, message, timestamp } = entry;
  
  // Try to extract from breadcrumb data (most common for HTTP)
  if (metadata.category === 'xhr' || metadata.category === 'fetch' || metadata.category === 'http') {
    const data = (metadata.data || metadata) as Record<string, any>;
    const statusCode = data.status_code || data.status || data.statusCode;
    return {
      method: data.method || 'GET',
      url: data.url || '',
      statusCode: statusCode as number | undefined,
      duration: data.duration || data.responseTime || (data.endTimestamp && data.startTimestamp ? (Number(data.endTimestamp) - Number(data.startTimestamp)) : undefined),
      requestSize: data.request_body_size || data.requestSize,
      responseSize: data.response_body_size || data.responseSize || data.size,
      error: Number(statusCode || 0) >= 400,
      errorMessage: Number(statusCode || 0) >= 400 ? (typeof message === 'string' ? message : message?.message || 'HTTP Error') : undefined,
      timestamp
    };
  }
  
  // Try to extract from span data
  const rawData = metadata._sentryRawData as SentryEvent | undefined;
  if (rawData?.spans && Array.isArray(rawData.spans)) {
    for (const span of rawData.spans as SpanJSON[]) {
      if (span.op === 'http.client' || span.op === 'http' || span.description?.startsWith('HTTP')) {
        const attrs = span.data as HttpSpanAttributes;
        const statusCode = attrs['http.response.status_code'] || attrs['http.status_code'];
        const method = attrs['http.request.method'] || attrs['http.method'] || 'GET';
        const url = attrs['url.full'] || attrs['http.url'] || span.description || '';
        
        return {
          method,
          url,
          statusCode,
          duration: span.timestamp && span.start_timestamp ? (span.timestamp - span.start_timestamp) * 1000 : undefined,
          requestSize: attrs['http.request_content_length'],
          responseSize: attrs['http.response_content_length'],
          error: statusCode ? statusCode >= 400 : false,
          errorMessage: statusCode && statusCode >= 400 ? `HTTP ${statusCode}` : undefined,
          timestamp: span.start_timestamp ? span.start_timestamp * 1000 : timestamp
        };
      }
    }
  }
  
  // Try to extract from event contexts
  const rawEventData = metadata._sentryRawData as SentryEvent | undefined;
  const trace = rawEventData?.contexts?.trace as any;
  if (trace?.op === 'http.client') {
    const traceData = trace.data || {};
    return {
      method: traceData['http.request.method'] || traceData['http.method'] || 'GET',
      url: traceData['url.full'] || traceData['http.url'] || '',
      statusCode: traceData['http.response.status_code'] || traceData['http.status_code'],
      duration: metadata.duration as number | undefined,
      timestamp
    };
  }
  
  // Fallback to old extraction logic
  if (metadata.sentryEventType === 'http' || metadata.method) {
    const statusCode = metadata.status || metadata.statusCode;
    return {
      method: (metadata.method as string) || 'GET',
      url: (metadata.url as string) || '',
      statusCode: statusCode as number | undefined,
      duration: (metadata.duration || metadata.responseTime) as number | undefined,
      responseSize: (metadata.responseSize || metadata.size) as number | undefined,
      error: Number(statusCode || 0) >= 400,
      timestamp
    };
  }
  
  return null;
}