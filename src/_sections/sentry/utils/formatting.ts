/**
 * Utility functions for formatting Sentry event data
 */

/**
 * Format duration from milliseconds to human-readable format
 * @param ms Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined || ms === null) return 'N/A';
  
  // For very small durations (< 1ms), show microseconds
  if (ms < 1) {
    return `${Math.round(ms * 1000)}μs`;
  }
  
  // Less than 1 second: show milliseconds
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  
  // 1-60 seconds: show seconds with 1 decimal
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  
  // 1-60 minutes: show minutes and seconds
  if (ms < 3600000) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  
  // Over 1 hour: show hours and minutes
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

/**
 * Format byte size to human-readable format
 * @param bytes Size in bytes
 * @returns Formatted size string
 */
export function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || bytes === null) return 'N/A';
  
  if (bytes === 0) return '0B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)}${units[i]}`;
}

/**
 * URL components for structured display
 */
export interface UrlComponents {
  protocol: string;
  host: string;
  port?: string;
  pathname: string;
  search?: string;
  hash?: string;
  params?: Record<string, string>;
  isSecure: boolean;
  domain: string; // Just the domain without subdomain
  subdomain?: string;
  path: string[]; // Path segments
}

/**
 * Parse URL into components for better display
 * @param urlString URL to parse
 * @returns Parsed URL components
 */
export function parseUrl(urlString: string): UrlComponents | null {
  if (!urlString) return null;
  
  try {
    // Handle relative URLs by prepending a base
    const url = urlString.startsWith('http') 
      ? new URL(urlString)
      : new URL(urlString, 'http://example.com');
    
    // Extract domain parts
    const hostParts = url.hostname.split('.');
    const domain = hostParts.length >= 2 
      ? hostParts.slice(-2).join('.') 
      : url.hostname;
    const subdomain = hostParts.length > 2 
      ? hostParts.slice(0, -2).join('.') 
      : undefined;
    
    // Parse query parameters
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    // Split pathname into segments
    const pathSegments = url.pathname
      .split('/')
      .filter(segment => segment.length > 0);
    
    return {
      protocol: url.protocol.replace(':', ''),
      host: url.hostname,
      port: url.port || undefined,
      pathname: url.pathname,
      search: url.search || undefined,
      hash: url.hash || undefined,
      params: Object.keys(params).length > 0 ? params : undefined,
      isSecure: url.protocol === 'https:',
      domain,
      subdomain,
      path: pathSegments,
    };
  } catch {
    // For malformed URLs, return basic info
    return {
      protocol: 'http',
      host: 'unknown',
      pathname: urlString,
      isSecure: false,
      domain: 'unknown',
      path: [urlString],
    };
  }
}

/**
 * Format HTTP status code with semantic color/meaning
 * @param status HTTP status code
 * @returns Status info with color and meaning
 */
export function formatHttpStatus(status: number | undefined): {
  text: string;
  color: string;
  meaning: string;
} {
  if (!status) {
    return { text: 'N/A', color: '#6B7280', meaning: 'Unknown' };
  }
  
  if (status >= 200 && status < 300) {
    return { 
      text: `${status}`, 
      color: '#10B981', 
      meaning: 'Success' 
    };
  }
  
  if (status >= 300 && status < 400) {
    return { 
      text: `${status}`, 
      color: '#3B82F6', 
      meaning: 'Redirect' 
    };
  }
  
  if (status >= 400 && status < 500) {
    const meanings: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Rate Limited',
    };
    return { 
      text: `${status}`, 
      color: '#F59E0B', 
      meaning: meanings[status] || 'Client Error' 
    };
  }
  
  if (status >= 500) {
    const meanings: Record<number, string> = {
      500: 'Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };
    return { 
      text: `${status}`, 
      color: '#EF4444', 
      meaning: meanings[status] || 'Server Error' 
    };
  }
  
  return { text: `${status}`, color: '#6B7280', meaning: 'Unknown' };
}

/**
 * Truncate string in the middle to preserve start and end
 * @param str String to truncate
 * @param maxLength Maximum length
 * @returns Truncated string
 */
export function truncateMiddle(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  
  const start = Math.ceil(maxLength / 2) - 2;
  const end = Math.floor(maxLength / 2) - 2;
  
  return `${str.slice(0, start)}...${str.slice(-end)}`;
}

/**
 * Format timestamp to relative time
 * @param timestamp Unix timestamp (ms)
 * @returns Relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 1000) return 'just now';
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  
  return new Date(timestamp).toLocaleTimeString();
}