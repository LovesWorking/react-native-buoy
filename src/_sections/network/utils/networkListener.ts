/**
 * Network listener using Reactotron-style event pattern
 * Simple and reliable network interception for React Native
 */

// Extended XMLHttpRequest interface for monkey-patching
interface ExtendedXMLHttpRequest extends XMLHttpRequest {
  _requestId?: string;
  _method?: string;
  _url?: string;
  _startTime?: number;
  _requestHeaders?: Record<string, string>;
  _requestData?: unknown;
}

// Event types for network operations
export interface NetworkingEvent {
  type: 'request' | 'response' | 'error';
  timestamp: Date;
  duration?: number;
  request: {
    id: string;
    url: string;
    method: string;
    headers?: Record<string, string>;
    data?: unknown;
    params?: Record<string, string>;
  };
  response?: {
    status: number;
    statusText?: string;
    headers?: Record<string, string>;
    body?: unknown;
    size?: number;
  };
  error?: {
    message: string;
    stack?: string;
  };
}

export type NetworkingEventListener = (event: NetworkingEvent) => void;

class NetworkListener {
  private listeners: NetworkingEventListener[] = [];
  private isListening = false;
  private requestCounter = 1000;
  
  // URLs to ignore (Metro bundler, symbolicate, etc.)
  private ignoredUrls = [
    /\/symbolicate$/,
    /\/logs$/,
    /\/debugger-proxy/,
    /\/reload$/,
    /\/launch-js-devtools/,
    /localhost:8081/,
    /100\.64\.\d+\.\d+:8081/, // iOS simulator
    /10\.0\.\d+\.\d+:8081/,   // Android emulator
  ];
  
  // Store original methods
  private originalFetch: typeof fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;
  private originalXHRSetRequestHeader: typeof XMLHttpRequest.prototype.setRequestHeader;

  constructor() {
    // Store original methods
    this.originalFetch = global.fetch;
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    this.originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  }

  // Check if URL should be ignored
  private shouldIgnoreUrl(url: string): boolean {
    return this.ignoredUrls.some(pattern => pattern.test(url));
  }

  // Emit event to all listeners
  private emit(event: NetworkingEvent) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.warn('[NetworkListener] Error in event listener:', error);
      }
    });
  }

  // Parse URL to extract query parameters
  private parseUrl(url: string): { url: string; params: Record<string, string> | null } {
    let params: Record<string, string> | null = null;
    const queryParamIdx = url.indexOf('?');
    
    if (queryParamIdx > -1) {
      params = {};
      url
        .substr(queryParamIdx + 1)
        .split('&')
        .forEach((pair) => {
          const [key, value] = pair.split('=');
          if (key && value !== undefined) {
            params![key] = decodeURIComponent(value.replace(/\+/g, ' '));
          }
        });
    }
    
    return { 
      url: queryParamIdx > -1 ? url.substr(0, queryParamIdx) : url, 
      params 
    };
  }

  // Get response body size
  private getResponseSize(body: unknown): number {
    if (!body) return 0;
    if (typeof body === 'string') return body.length;
    if (typeof body === 'object') {
      try {
        return JSON.stringify(body).length;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  // Start listening to network operations
  startListening() {
    if (this.isListening) {
      console.warn('[NetworkListener] Already listening');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    // Swizzle fetch
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
      
      // Skip ignored URLs
      if (self.shouldIgnoreUrl(url)) {
        return self.originalFetch(input, init);
      }
      
      const startTime = Date.now();
      const requestId = `fetch_${++self.requestCounter}`;
      const method = init?.method || 'GET';
      const { url: cleanUrl, params } = self.parseUrl(url);

      // Parse request headers
      let requestHeaders: Record<string, string> = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            requestHeaders[key] = value;
          });
        } else if (Array.isArray(init.headers)) {
          init.headers.forEach(([key, value]) => {
            requestHeaders[key] = value;
          });
        } else {
          requestHeaders = init.headers as Record<string, string>;
        }
      }

      // Parse request body
      let requestData;
      if (init?.body) {
        if (typeof init.body === 'string') {
          try {
            requestData = JSON.parse(init.body);
          } catch {
            requestData = init.body;
          }
        } else {
          requestData = init.body;
        }
      }

      // Emit request event
      self.emit({
        type: 'request',
        timestamp: new Date(),
        request: {
          id: requestId || 'unknown',
          url: cleanUrl,
          method,
          headers: requestHeaders,
          data: requestData,
          params: params || undefined
        }
      });

      try {
        const response = await this.originalFetch(input, init);
        const duration = Date.now() - startTime;

        // Clone response to read body
        const responseClone = response.clone();
        let body;
        let responseSize = 0;
        
        try {
          const text = await responseClone.text();
          responseSize = text.length;
          try {
            body = JSON.parse(text);
          } catch {
            body = text;
          }
        } catch {
          body = '~~~ unable to read body ~~~';
        }

        // Parse response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key.toLowerCase()] = value;
        });

        // Emit response event
        self.emit({
          type: 'response',
          timestamp: new Date(),
          duration,
          request: {
            id: requestId || 'unknown',
            url: cleanUrl,
            method,
            headers: requestHeaders,
            data: requestData,
            params: params || undefined
          },
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body,
            size: responseSize
          }
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;

        // Emit error event
        self.emit({
          type: 'error',
          timestamp: new Date(),
          duration,
          request: {
            id: requestId || 'unknown',
            url: cleanUrl,
            method,
            headers: requestHeaders,
            data: requestData,
            params: params || undefined
          },
          error: {
            message: error instanceof Error ? error.message : 'Network error',
            stack: error instanceof Error ? error.stack : undefined
          }
        });

        throw error;
      }
    };

    // Swizzle XMLHttpRequest
    XMLHttpRequest.prototype.open = function(
      method: string, 
      url: string, 
      async?: boolean, 
      user?: string, 
      password?: string
    ) {
      // Store request info on the xhr instance
      const xhr = this as ExtendedXMLHttpRequest;
      xhr._requestId = `xhr_${++self.requestCounter}`;
      xhr._method = method;
      xhr._url = url;
      xhr._startTime = Date.now();
      xhr._requestHeaders = {};

      return self.originalXHROpen.call(this, method, url, async, user, password) as void;
    };

    // Track request headers
    XMLHttpRequest.prototype.setRequestHeader = function(header: string, value: string) {
      const xhr = this as ExtendedXMLHttpRequest;
      if (xhr._requestHeaders) {
        xhr._requestHeaders[header] = value;
      }
      
      return self.originalXHRSetRequestHeader.call(this, header, value);
    };

    XMLHttpRequest.prototype.send = function(data?: Document | XMLHttpRequestBodyInit | null) {
      const xhr = this as ExtendedXMLHttpRequest;
      const requestId = xhr._requestId;
      const method = xhr._method || 'GET';
      const url = xhr._url || '';
      const startTime = xhr._startTime;
      const requestHeaders = xhr._requestHeaders || {};
      
      // Skip ignored URLs
      if (self.shouldIgnoreUrl(url)) {
        return self.originalXHRSend.call(this, data);
      }
      
      const { url: cleanUrl, params } = self.parseUrl(url);

      // Parse request data
      let requestData: unknown;
      if (data) {
        if (typeof data === 'string') {
          try {
            requestData = JSON.parse(data);
          } catch {
            requestData = data;
          }
        } else {
          requestData = data;
        }
      }

      // Emit request event
      self.emit({
        type: 'request',
        timestamp: new Date(),
        request: {
          id: requestId || 'unknown',
          url: cleanUrl,
          method,
          headers: requestHeaders,
          data: requestData,
          params: params || undefined
        }
      });

      // Store original onreadystatechange
      const originalOnReadyStateChange = this.onreadystatechange;

      this.onreadystatechange = function(this: XMLHttpRequest, ev: Event) {
        if (this.readyState === 4) { // DONE
          const duration = startTime ? Date.now() - startTime : 0;

          if (this.status === 0) {
            // Network error
            self.emit({
              type: 'error',
              timestamp: new Date(),
              duration,
              request: {
                id: requestId || 'unknown',
                url: cleanUrl,
                method,
                headers: requestHeaders,
                data: requestData,
                params: params || undefined
              },
              error: {
                message: 'Network error or request aborted'
              }
            });
          } else {
            // Parse response
            let body;
            let responseSize = 0;
            
            try {
              // Try different ways to get response
              if (this.responseType === 'json' && this.response) {
                body = this.response;
                responseSize = JSON.stringify(this.response).length;
              } else if (this.responseType === '' || this.responseType === 'text') {
                // Only access responseText when responseType allows it
                if (this.responseText) {
                  responseSize = this.responseText.length;
                  try {
                    body = JSON.parse(this.responseText);
                  } catch {
                    body = this.responseText;
                  }
                }
              } else if (this.responseType === 'blob' || this.responseType === 'arraybuffer') {
                // For blob/arraybuffer responses, just note the type
                body = `[${this.responseType} response]`;
                responseSize = this.response?.size || this.response?.byteLength || 0;
              } else if (this.response) {
                if (typeof this.response === 'string') {
                  body = this.response;
                  responseSize = this.response.length;
                } else {
                  body = this.response;
                  responseSize = JSON.stringify(this.response).length;
                }
              }
            } catch (error) {
              console.warn('[NetworkListener] Failed to parse response:', error);
              body = '~~~ unable to read body ~~~';
            }

            // Parse response headers
            const responseHeaders: Record<string, string> = {};
            try {
              const headerString = this.getAllResponseHeaders();
              if (headerString) {
                headerString.split('\r\n').forEach(line => {
                  if (line) {
                    const colonIndex = line.indexOf(': ');
                    if (colonIndex > 0) {
                      const key = line.substring(0, colonIndex).toLowerCase();
                      const value = line.substring(colonIndex + 2);
                      responseHeaders[key] = value;
                    }
                  }
                });
              }
            } catch {
              // Ignore header parsing errors
            }

            // Emit response or error based on status
            if (this.status >= 200 && this.status < 400) {
              self.emit({
                type: 'response',
                timestamp: new Date(),
                duration,
                request: {
                  id: requestId || 'unknown',
                  url: cleanUrl,
                  method,
                  headers: requestHeaders,
                  data: requestData,
                  params: params || undefined
                },
                response: {
                  status: this.status,
                  statusText: this.statusText,
                  headers: responseHeaders,
                  body,
                  size: responseSize
                }
              });
            } else {
              self.emit({
                type: 'error',
                timestamp: new Date(),
                duration,
                request: {
                  id: requestId || 'unknown',
                  url: cleanUrl,
                  method,
                  headers: requestHeaders,
                  data: requestData,
                  params: params || undefined
                },
                response: {
                  status: this.status,
                  statusText: this.statusText,
                  headers: responseHeaders,
                  body,
                  size: responseSize
                },
                error: {
                  message: `HTTP ${this.status}: ${this.statusText}`
                }
              });
            }
          }
        }

        // Call original handler if it exists
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.call(this, ev);
        }
      };

      return self.originalXHRSend.call(this, data);
    };

    this.isListening = true;
    if (__DEV__) {
      console.log('[NetworkListener] Started listening');
    }
  }

  // Stop listening and restore original methods
  stopListening() {
    if (!this.isListening) {
      console.warn('[NetworkListener] Not currently listening');
      return;
    }

    // Restore original methods
    global.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
    XMLHttpRequest.prototype.setRequestHeader = this.originalXHRSetRequestHeader;

    this.isListening = false;
    if (__DEV__) {
      console.log('[NetworkListener] Stopped listening');
    }
  }

  // Add event listener
  addListener(listener: NetworkingEventListener) {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Remove all listeners
  removeAllListeners() {
    this.listeners = [];
  }

  // Check if currently listening
  get isActive() {
    return this.isListening;
  }

  // Get number of active listeners
  get listenerCount() {
    return this.listeners.length;
  }
}

// Create singleton instance
export const networkListener = new NetworkListener();

// Simple API functions
export const startNetworkListener = () => networkListener.startListening();
export const stopNetworkListener = () => networkListener.stopListening();
export const addNetworkListener = (listener: NetworkingEventListener) => networkListener.addListener(listener);
export const removeAllNetworkListeners = () => networkListener.removeAllListeners();
export const isNetworkListening = () => networkListener.isActive;
export const getNetworkListenerCount = () => networkListener.listenerCount;