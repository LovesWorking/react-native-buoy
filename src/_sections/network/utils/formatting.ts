/**
 * Formatting utilities for network events
 */

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function formatHttpStatus(status: number): { text: string; color: string; meaning: string } {
  // 1xx Informational
  if (status >= 100 && status < 200) {
    return {
      text: String(status),
      color: '#3B82F6',
      meaning: 'Informational',
    };
  }
  
  // 2xx Success
  if (status >= 200 && status < 300) {
    const meanings: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'No Content',
    };
    return {
      text: String(status),
      color: '#10B981',
      meaning: meanings[status] || 'Success',
    };
  }
  
  // 3xx Redirection
  if (status >= 300 && status < 400) {
    const meanings: Record<number, string> = {
      301: 'Moved Permanently',
      302: 'Found',
      304: 'Not Modified',
    };
    return {
      text: String(status),
      color: '#F59E0B',
      meaning: meanings[status] || 'Redirect',
    };
  }
  
  // 4xx Client Error
  if (status >= 400 && status < 500) {
    const meanings: Record<number, string> = {
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
    };
    return {
      text: String(status),
      color: '#EF4444',
      meaning: meanings[status] || 'Client Error',
    };
  }
  
  // 5xx Server Error
  if (status >= 500) {
    const meanings: Record<number, string> = {
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };
    return {
      text: String(status),
      color: '#DC2626',
      meaning: meanings[status] || 'Server Error',
    };
  }
  
  return {
    text: String(status),
    color: '#6B7280',
    meaning: 'Unknown',
  };
}

export function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    'GET': '#10B981',
    'POST': '#3B82F6',
    'PUT': '#F59E0B',
    'DELETE': '#EF4444',
    'PATCH': '#8B5CF6',
    'HEAD': '#6B7280',
    'OPTIONS': '#9CA3AF',
  };
  
  return colors[method.toUpperCase()] || '#6B7280';
}