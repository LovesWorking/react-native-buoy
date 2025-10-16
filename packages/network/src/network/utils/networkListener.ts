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
  type: "request" | "response" | "error";
  timestamp: Date;
  duration?: number;
  request: {
    id: string;
    url: string;
    method: string;
    headers?: Record<string, string>;
    data?: unknown;
    params?: Record<string, string>;
    client?: "fetch" | "axios";
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

/**
 * Network traffic interceptor for React Native applications
 *
 * This class intercepts both fetch and XMLHttpRequest operations to provide
 * comprehensive network monitoring capabilities. It uses method swizzling to
 * wrap native networking APIs while preserving their original functionality.
 *
 * @example
 * ```typescript
 * // Start monitoring network traffic
 * startNetworkListener();
 *
 * // Add a listener for network events
 * const unsubscribe = addNetworkListener((event) => {
 *   if (event.type === 'response') {
 *     console.log(`${event.request.method} ${event.request.url}: ${event.response?.status}`);
 *   }
 * });
 *
 * // Stop monitoring and cleanup
 * unsubscribe();
 * stopNetworkListener();
 * ```
 *
 * @performance Uses lazy singleton pattern to minimize memory footprint
 * @performance Includes URL filtering to ignore development traffic
 */
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
    /10\.0\.\d+\.\d+:8081/, // Android emulator
  ];

  // Store original methods
  private originalFetch: typeof fetch;
  private originalXHROpen: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend: typeof XMLHttpRequest.prototype.send;
  private originalXHRSetRequestHeader: typeof XMLHttpRequest.prototype.setRequestHeader;
  private originalXHROnLoad: typeof XMLHttpRequest.prototype.onload;
  private originalXHROnError: typeof XMLHttpRequest.prototype.onerror;
  private originalXHROnAbort: typeof XMLHttpRequest.prototype.onabort;

  constructor() {
    // Store original methods
    this.originalFetch = globalThis.fetch.bind(globalThis);
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    this.originalXHRSetRequestHeader =
      XMLHttpRequest.prototype.setRequestHeader;
    this.originalXHROnLoad = XMLHttpRequest.prototype.onload;
    this.originalXHROnError = XMLHttpRequest.prototype.onerror;
    this.originalXHROnAbort = XMLHttpRequest.prototype.onabort;
  }

  /**
   * Check if URL should be ignored from network monitoring
   *
   * Filters out development-related URLs like Metro bundler, debugger proxy,
   * and symbolication requests to reduce noise in the network logs.
   *
   * @param url - The URL to check
   * @returns True if the URL should be ignored
   */
  private shouldIgnoreUrl(url: string): boolean {
    return this.ignoredUrls.some((pattern) => pattern.test(url));
  }

  // Emit event to all listeners
  private emit(event: NetworkingEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.warn("[NetworkListener] Error in event listener:", error);
      }
    });
  }

  /**
   * Parse URL to extract query parameters and clean URL
   *
   * @param url - The URL to parse
   * @returns Object containing cleaned URL and parsed query parameters
   *
   * @performance Uses manual parsing instead of URL constructor for better performance
   */
  private parseUrl(url: string): {
    url: string;
    params: Record<string, string> | null;
  } {
    let params: Record<string, string> | null = null;
    const queryParamIdx = url.indexOf("?");

    if (queryParamIdx > -1) {
      params = {};
      url
        .substr(queryParamIdx + 1)
        .split("&")
        .forEach((pair) => {
          const [key, value] = pair.split("=");
          if (key && value !== undefined) {
            params![key] = decodeURIComponent(value.replace(/\+/g, " "));
          }
        });
    }

    return {
      url: queryParamIdx > -1 ? url.substr(0, queryParamIdx) : url,
      params,
    };
  }

  // Get response body size
  private getResponseSize(body: unknown): number {
    if (!body) return 0;
    if (typeof body === "string") return body.length;
    if (typeof body === "object") {
      try {
        return JSON.stringify(body).length;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  /**
   * Handle XMLHttpRequest response processing
   * This method processes the response and emits appropriate events
   */
  private handleXHRResponse(
    xhr: XMLHttpRequest,
    requestId: string,
    cleanUrl: string,
    method: string,
    requestHeaders: Record<string, string>,
    requestData: unknown,
    params: Record<string, string> | null,
    startTime: number,
    isError = false
  ) {
    const duration = startTime ? Date.now() - startTime : 0;

    if (isError || xhr.status === 0) {
      // Network error or aborted request
      this.emit({
        type: "error",
        timestamp: new Date(),
        duration,
        request: {
          id: requestId || "unknown",
          url: cleanUrl,
          method,
          headers: requestHeaders,
          data: requestData,
          params: params || undefined,
          client: "axios",
        },
        error: {
          message: isError ? "Request failed" : "Network error or request aborted",
        },
      });
      return;
    }

    // Parse response
    let body;
    let responseSize = 0;

    try {
      // Try different ways to get response
      if (xhr.responseType === "json" && xhr.response) {
        body = xhr.response;
        responseSize = JSON.stringify(xhr.response).length;
      } else if (
        xhr.responseType === "" ||
        xhr.responseType === "text"
      ) {
        // Only access responseText when responseType allows it
        if (xhr.responseText) {
          responseSize = xhr.responseText.length;
          try {
            body = JSON.parse(xhr.responseText);
          } catch {
            body = xhr.responseText;
          }
        }
      } else if (
        xhr.responseType === "blob" ||
        xhr.responseType === "arraybuffer"
      ) {
        // For blob/arraybuffer responses, just note the type
        body = `[${xhr.responseType} response]`;
        responseSize =
          xhr.response?.size || xhr.response?.byteLength || 0;
      } else if (xhr.response) {
        if (typeof xhr.response === "string") {
          body = xhr.response;
          responseSize = xhr.response.length;
        } else {
          body = xhr.response;
          responseSize = JSON.stringify(xhr.response).length;
        }
      }
    } catch (error) {
      console.warn(
        "[NetworkListener] Failed to parse response:",
        error
      );
      body = "~~~ unable to read body ~~~";
    }

    // Parse response headers
    const responseHeaders: Record<string, string> = {};
    try {
      const headerString = xhr.getAllResponseHeaders();
      if (headerString) {
        headerString.split("\r\n").forEach((line) => {
          if (line) {
            const colonIndex = line.indexOf(": ");
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
    if (xhr.status >= 200 && xhr.status < 400) {
      this.emit({
        type: "response",
        timestamp: new Date(),
        duration,
        request: {
          id: requestId || "unknown",
          url: cleanUrl,
          method,
          headers: requestHeaders,
          data: requestData,
          params: params || undefined,
          client: "axios",
        },
        response: {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: responseHeaders,
          body,
          size: responseSize,
        },
      });
    } else {
      this.emit({
        type: "error",
        timestamp: new Date(),
        duration,
        request: {
          id: requestId || "unknown",
          url: cleanUrl,
          method,
          headers: requestHeaders,
          data: requestData,
          params: params || undefined,
          client: "axios",
        },
        response: {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: responseHeaders,
          body,
          size: responseSize,
        },
        error: {
          message: `HTTP ${xhr.status}: ${xhr.statusText}`,
        },
      });
    }
  }

  /**
   * Start intercepting network operations by swizzling fetch and XMLHttpRequest
   *
   * This method replaces the global fetch function and XMLHttpRequest methods
   * with instrumented versions that emit events while preserving original functionality.
   *
   * @throws Will log warnings if already listening
   *
   * @performance Uses method swizzling for minimal runtime overhead
   * @performance Includes request deduplication through ignored URL patterns
   */
  startListening() {
    if (this.isListening) {
      console.warn("[NetworkListener] Already listening");
      return;
    }

    const self = this;

    // Swizzle fetch
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.href
          : (input as Request).url;

      // Skip ignored URLs
      if (self.shouldIgnoreUrl(url)) {
        return self.originalFetch(input as RequestInfo, init);
      }

      const startTime = Date.now();
      const requestId = `fetch_${++self.requestCounter}`;
      const method = init?.method || "GET";
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
        if (typeof init.body === "string") {
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
        type: "request",
        timestamp: new Date(),
        request: {
          id: requestId || "unknown",
          url: cleanUrl,
          method,
          headers: requestHeaders,
          data: requestData,
          params: params || undefined,
          client: "fetch",
        },
      });

      try {
        const response = await this.originalFetch(input as RequestInfo, init);
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
          body = "~~~ unable to read body ~~~";
        }

        // Parse response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key.toLowerCase()] = value;
        });

        // Emit response event
        self.emit({
          type: "response",
          timestamp: new Date(),
          duration,
          request: {
            id: requestId || "unknown",
            url: cleanUrl,
            method,
            headers: requestHeaders,
            data: requestData,
            params: params || undefined,
            client: "fetch",
          },
          response: {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body,
            size: responseSize,
          },
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;

        // Emit error event
        self.emit({
          type: "error",
          timestamp: new Date(),
          duration,
          request: {
            id: requestId || "unknown",
            url: cleanUrl,
            method,
            headers: requestHeaders,
            data: requestData,
            params: params || undefined,
            client: "fetch",
          },
          error: {
            message: error instanceof Error ? error.message : "Network error",
            stack: error instanceof Error ? error.stack : undefined,
          },
        });

        throw error;
      }
    };

    // Swizzle XMLHttpRequest
    XMLHttpRequest.prototype.open = function (
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

      return self.originalXHROpen.call(
        this,
        method,
        url,
        async,
        user,
        password
      ) as void;
    };

    // Track request headers
    XMLHttpRequest.prototype.setRequestHeader = function (
      header: string,
      value: string
    ) {
      const xhr = this as ExtendedXMLHttpRequest;
      if (xhr._requestHeaders) {
        xhr._requestHeaders[header] = value;
      }

      return self.originalXHRSetRequestHeader.call(this, header, value);
    };

    XMLHttpRequest.prototype.send = function (
      // @ts-ignore - this does exist on native
      data?: Document | XMLHttpRequestBodyInit | null
    ) {
      const xhr = this as ExtendedXMLHttpRequest;
      const requestId = xhr._requestId;
      const method = xhr._method || "GET";
      const url = xhr._url || "";
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
        if (typeof data === "string") {
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
        type: "request",
        timestamp: new Date(),
        request: {
          id: requestId || "unknown",
          url: cleanUrl,
          method,
          headers: requestHeaders,
          data: requestData,
          params: params || undefined,
          client: "axios",
        },
      });

      // Store original event handlers
      const originalOnReadyStateChange = this.onreadystatechange;
      const originalOnLoad = this.onload;
      const originalOnError = this.onerror;
      const originalOnAbort = this.onabort;

      // Track if we've already processed this request to avoid duplicate events
      let processed = false;

      const processResponse = (isError = false) => {
        if (processed) return;
        processed = true;
        self.handleXHRResponse(
          this,
          requestId || "unknown",
          cleanUrl,
          method,
          requestHeaders,
          requestData,
          params,
          startTime || 0,
          isError
        );
      };

      // Handle onreadystatechange (for compatibility with older code)
      this.onreadystatechange = function (this: XMLHttpRequest, ev: Event) {
        if (this.readyState === 4) {
          processResponse();
        }

        // Call original handler if it exists
        if (originalOnReadyStateChange) {
          originalOnReadyStateChange.call(this, ev);
        }
      };

      // Handle onload (used by axios and modern libraries)
      this.onload = function (this: XMLHttpRequest, ev: ProgressEvent) {
        processResponse();

        // Call original handler if it exists
        if (originalOnLoad) {
          originalOnLoad.call(this, ev);
        }
      };

      // Handle onerror (used by axios and modern libraries)
      this.onerror = function (this: XMLHttpRequest, ev: ProgressEvent) {
        processResponse(true);

        // Call original handler if it exists
        if (originalOnError) {
          originalOnError.call(this, ev);
        }
      };

      // Handle onabort (used by axios and modern libraries)
      this.onabort = function (this: XMLHttpRequest, ev: ProgressEvent) {
        processResponse(true);

        // Call original handler if it exists
        if (originalOnAbort) {
          originalOnAbort.call(this, ev);
        }
      };

      return self.originalXHRSend.call(this, data);
    };

    this.isListening = true;
    if (__DEV__) {
      // Network listener has started monitoring fetch and XMLHttpRequest operations
    }
  }

  /**
   * Stop listening and restore original networking methods
   *
   * This method restores the original fetch and XMLHttpRequest implementations,
   * effectively disabling network monitoring.
   */
  stopListening() {
    if (!this.isListening) {
      console.warn("[NetworkListener] Not currently listening");
      return;
    }

    // Restore original methods
    globalThis.fetch = this.originalFetch;
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
    XMLHttpRequest.prototype.setRequestHeader =
      this.originalXHRSetRequestHeader;
    XMLHttpRequest.prototype.onload = this.originalXHROnLoad;
    XMLHttpRequest.prototype.onerror = this.originalXHROnError;
    XMLHttpRequest.prototype.onabort = this.originalXHROnAbort;

    this.isListening = false;
    if (__DEV__) {
      // Network listener has stopped monitoring and restored original methods
    }
  }

  /**
   * Add a listener for network events
   *
   * @param listener - Callback function to handle network events
   * @returns Unsubscribe function to remove the listener
   */
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

/**
 * Lazy singleton instance holder for NetworkListener
 *
 * This pattern ensures only one NetworkListener instance exists throughout
 * the application lifecycle while deferring instantiation until first use.
 */
let _networkListener: NetworkListener | null = null;

/**
 * Get or create the singleton NetworkListener instance
 *
 * @returns The singleton NetworkListener instance
 */
const getNetworkListener = () => {
  if (!_networkListener) {
    _networkListener = new NetworkListener();
  }
  return _networkListener;
};

/**
 * Access function for the singleton NetworkListener instance
 *
 * @returns Function that returns the NetworkListener instance
 */
export const networkListener = getNetworkListener;

/**
 * Start network traffic monitoring
 *
 * @example
 * ```typescript
 * startNetworkListener();
 * console.log('Network monitoring started');
 * ```
 */
export const startNetworkListener = () => getNetworkListener().startListening();

/**
 * Stop network traffic monitoring
 */
export const stopNetworkListener = () => getNetworkListener().stopListening();

/**
 * Add a listener for network events
 *
 * @param listener - Callback function to handle network events
 * @returns Unsubscribe function to remove the listener
 *
 * @example
 * ```typescript
 * const unsubscribe = addNetworkListener((event) => {
 *   console.log(`Network ${event.type}:`, event.request.url);
 * });
 *
 * // Later...
 * unsubscribe();
 * ```
 */
export const addNetworkListener = (listener: NetworkingEventListener) =>
  getNetworkListener().addListener(listener);

/**
 * Remove all registered network event listeners
 */
export const removeAllNetworkListeners = () =>
  getNetworkListener().removeAllListeners();

/**
 * Check if network monitoring is currently active
 *
 * @returns True if currently intercepting network traffic
 */
export const isNetworkListening = () => getNetworkListener().isActive;

/**
 * Get the number of registered network event listeners
 *
 * @returns Number of active listeners
 */
export const getNetworkListenerCount = () => getNetworkListener().listenerCount;
