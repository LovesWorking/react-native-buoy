/**
 * Network monitoring types for React Native dev tools
 */

export interface NetworkEvent {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | string;
  url: string;
  status?: number;
  statusText?: string;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestData?: unknown;
  responseData?: unknown;
  responseSize?: number;
  requestSize?: number;
  timestamp: number;
  duration?: number;
  error?: string;
  // Additional metadata
  host?: string;
  path?: string;
  query?: string;
  responseType?: string;
  cached?: boolean;
}

export interface NetworkStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  pendingRequests: number;
  totalDataSent: number;
  totalDataReceived: number;
  averageDuration: number;
}

export interface NetworkFilter {
  method?: string[];
  status?: 'success' | 'error' | 'pending' | 'all';
  contentType?: string[];
  searchText?: string;
  host?: string;
}

export type NetworkEventStatus = 'pending' | 'success' | 'error' | 'timeout';

export interface NetworkInsight {
  type: 'performance' | 'error' | 'security' | 'optimization';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details?: string;
  eventId: string;
}