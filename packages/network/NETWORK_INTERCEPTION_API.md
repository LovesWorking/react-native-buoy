# React Native Network Interception API Guide

**Complete guide for intercepting and monitoring network requests in React Native applications**

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Interception Points](#interception-points)
   - [JavaScript XHR Interceptor (Official)](#1-javascript-xhr-interceptor-official)
   - [Method Swizzling (Current Implementation)](#2-method-swizzling-current-implementation)
   - [Native Layer Interception](#3-native-layer-interception)
4. [Complete Implementation Examples](#complete-implementation-examples)
5. [API Reference](#api-reference)
6. [Best Practices](#best-practices)
7. [Common Pitfalls](#common-pitfalls)
8. [Testing Your Interceptors](#testing-your-interceptors)
9. [Performance Considerations](#performance-considerations)
10. [Compatibility Notes](#compatibility-notes)

---

## Overview

### What This Guide Covers

This guide explains how to intercept network requests at the **React Native core layer**, which captures ALL HTTP/HTTPS traffic regardless of the library used (fetch, axios, etc.) because they all build on the same primitives.

### What You'll Be Able To Capture

1. **All fetch() Requests** - Modern Promise-based API
2. **All XMLHttpRequest Requests** - Legacy XHR API (used by fetch internally)
3. **Request Details** - URL, method, headers, body, query parameters
4. **Response Details** - Status, headers, body, timing
5. **Errors** - Network failures, timeouts, aborts

### Important Understanding

⚠️ **fetch() is a polyfill implemented on top of XMLHttpRequest**. This means:
- All `fetch()` calls eventually use `XMLHttpRequest`
- Intercepting XHR captures both fetch and direct XHR usage
- Query parameters ARE captured but may get lost in UI rendering (see [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md))

---

## Architecture Summary

```
┌─────────────────────────────────────────────┐
│         User Code Layer                      │
│  fetch() / axios / any HTTP library          │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│         Polyfill Layer                       │
│  whatwg-fetch (implements fetch using XHR)  │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      XMLHttpRequest Layer (Custom RN)        │
│  - State machine (UNSENT → DONE)            │
│  - Event system                              │
│  - Body conversion                           │
│  ┌─────────────────────────────┐            │
│  │ XHR Interceptor Point       │ ← Official │
│  │ __setInterceptor_DO_NOT_USE │   (read-   │
│  └─────────────────────────────┘   only)    │
└─────────────────┬────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│      RCTNetworking (Bridge Layer)            │
│  - Platform-specific wrapper                │
│  - Event emitters                            │
└─────────────────┬────────────────────────────┘
                  │
          ┌───────┴────────┐
          │                │
         iOS            Android
          │                │
          ▼                ▼
   NSURLSession        OkHttp3
```

### Interception Strategy

You have **3 levels** of interception:

**Level 1 (Safest): Official XHR Interceptor**
- Use `XMLHttpRequest.__setInterceptor_DO_NOT_USE()`
- Read-only monitoring (can't modify requests)
- Used by React Native DevTools
- **Recommended for monitoring**

**Level 2 (Most Control): Method Swizzling**
- Replace `globalThis.fetch` and `XMLHttpRequest.prototype.*`
- Full control over requests/responses
- Can modify, block, or redirect
- **Recommended for advanced use cases**

**Level 3 (Most Complete): Native Layer**
- Implement custom handlers in Objective-C/Kotlin
- Captures non-JS network traffic
- Overkill for most use cases

---

## Interception Points

### 1. JavaScript XHR Interceptor (Official)

The official mechanism for read-only network monitoring. Used by React Native DevTools.

#### Location
- File: `packages/react-native/Libraries/Network/XMLHttpRequest.js`
- API: `XMLHttpRequest.__setInterceptor_DO_NOT_USE(interceptor)`

#### What Gets Captured
- Request sent (URL, method, headers)
- Response received (status, headers)
- Response data (body)
- Loading finished/failed events
- **Covers ALL fetch + XHR traffic** (since fetch uses XHR)

#### How To Intercept

```javascript
const interceptor = {
  // Called when request is sent
  requestSent(id, url, method, headers) {
    console.log('[Network] Request:', { id, url, method, headers });

    // Store request details
    myDevTools.onRequestSent({ id, url, method, headers });
  },

  // Called when response headers received
  responseReceived(id, url, status, headers) {
    console.log('[Network] Response:', { id, url, status, headers });

    // Store response details
    myDevTools.onResponseReceived({ id, url, status, headers });
  },

  // Called when response data received
  dataReceived(id, data) {
    console.log('[Network] Data received:', { id, dataLength: data.length });

    // Process response body
    myDevTools.onDataReceived({ id, data });
  },

  // Called when request completes successfully
  loadingFinished(id, encodedDataLength) {
    console.log('[Network] Finished:', { id, size: encodedDataLength });

    myDevTools.onLoadingFinished({ id, size: encodedDataLength });
  },

  // Called when request fails
  loadingFailed(id, error) {
    console.log('[Network] Failed:', { id, error });

    myDevTools.onLoadingFailed({ id, error });
  }
};

// Activate interceptor
XMLHttpRequest.__setInterceptor_DO_NOT_USE(interceptor);

// Deactivate interceptor
XMLHttpRequest.__setInterceptor_DO_NOT_USE(null);
```

#### Query Parameter Handling

**IMPORTANT:** The `url` parameter includes full URL with query string:

```javascript
requestSent(id, url, method, headers) {
  // url = "https://api.example.com/users?id=123&role=admin"

  // Parse URL to extract query params
  const { url: baseUrl, params } = this.parseUrl(url);

  // baseUrl = "https://api.example.com/users"
  // params = { id: "123", role: "admin" }
}

parseUrl(url) {
  const queryIndex = url.indexOf('?');
  if (queryIndex === -1) {
    return { url, params: null };
  }

  const baseUrl = url.substring(0, queryIndex);
  const queryString = url.substring(queryIndex + 1);

  const params = {};
  queryString.split('&').forEach(pair => {
    const [key, value] = pair.split('=');
    if (key && value !== undefined) {
      params[key] = decodeURIComponent(value.replace(/\+/g, ' '));
    }
  });

  return { url: baseUrl, params };
}
```

#### Trade-offs

| Pros | Cons |
|------|------|
| ✅ Official React Native API | ❌ Read-only (can't modify requests) |
| ✅ Used by DevTools (proven) | ❌ Only one interceptor globally |
| ✅ Non-invasive | ❌ Can't capture request body easily |
| ✅ Captures fetch + XHR | ❌ May conflict with Chrome debugger |
| ✅ Safe (can't break XHR) | ❌ Undocumented (may change) |

---

### 2. Method Swizzling (Current Implementation)

Replace global methods to intercept and potentially modify requests. This is what rn-buoy currently uses.

#### Location
- Global: `globalThis.fetch`
- Prototype: `XMLHttpRequest.prototype.open/send/setRequestHeader`

#### What Gets Captured
- Everything from XHR Interceptor, plus:
- Request body (FormData, Blob, JSON, etc.)
- Ability to modify requests
- Ability to block or redirect

#### How To Intercept

**Fetch Swizzling:**

```javascript
class NetworkListener {
  constructor() {
    // Store original (CRITICAL: bind context)
    this.originalFetch = globalThis.fetch.bind(globalThis);
  }

  startListening() {
    const self = this;

    // Replace fetch
    globalThis.fetch = async (input, init) => {
      // Parse URL and params
      const url = typeof input === 'string' ? input
        : input instanceof URL ? input.href
        : input.url;

      const { url: cleanUrl, params } = self.parseUrl(url);
      const method = init?.method || 'GET';
      const requestId = `fetch_${++self.requestCounter}`;

      // Parse headers
      const headers = {};
      if (init?.headers) {
        if (init.headers instanceof Headers) {
          init.headers.forEach((value, key) => {
            headers[key] = value;
          });
        } else {
          Object.assign(headers, init.headers);
        }
      }

      // Parse body
      let body;
      if (init?.body) {
        if (typeof init.body === 'string') {
          try {
            body = JSON.parse(init.body);
          } catch {
            body = init.body;
          }
        }
        // Note: FormData, Blob, ReadableStream harder to capture
      }

      // Emit request event
      self.emit({
        type: 'request',
        timestamp: new Date(),
        request: {
          id: requestId,
          url: cleanUrl,
          method,
          headers,
          data: body,
          params,
          client: 'fetch'
        }
      });

      const startTime = Date.now();

      try {
        // Call original fetch
        const response = await self.originalFetch(input, init);
        const duration = Date.now() - startTime;

        // Clone response to read body without consuming
        const responseClone = response.clone();
        const status = response.status;
        const statusText = response.statusText;

        // Parse response headers
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        // Read body
        let responseBody;
        try {
          const text = await responseClone.text();
          try {
            responseBody = JSON.parse(text);
          } catch {
            responseBody = text;
          }
        } catch (error) {
          responseBody = '[Error reading body]';
        }

        // Emit response event
        self.emit({
          type: 'response',
          timestamp: new Date(),
          duration,
          request: {
            id: requestId,
            url: cleanUrl,
            method,
            params
          },
          response: {
            status,
            statusText,
            headers: responseHeaders,
            body: responseBody,
            size: responseBody?.length || 0
          }
        });

        // Return original response (unmodified)
        return response;

      } catch (error) {
        const duration = Date.now() - startTime;

        // Emit error event
        self.emit({
          type: 'error',
          timestamp: new Date(),
          duration,
          request: {
            id: requestId,
            url: cleanUrl,
            method,
            params
          },
          error: {
            message: error.message,
            name: error.name
          }
        });

        // Re-throw error
        throw error;
      }
    };
  }

  stopListening() {
    // Restore original
    globalThis.fetch = this.originalFetch;
  }
}
```

**XMLHttpRequest Swizzling:**

```javascript
class NetworkListener {
  constructor() {
    // Store originals
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    this.originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  }

  startListening() {
    const self = this;

    // Intercept open()
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      // Store request details on XHR instance
      this._requestId = `xhr_${++self.requestCounter}`;
      this._method = method;
      this._url = url;
      this._startTime = Date.now();
      this._requestHeaders = {};

      // Call original
      return self.originalXHROpen.call(this, method, url, async, user, password);
    };

    // Intercept setRequestHeader()
    XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
      if (this._requestHeaders) {
        this._requestHeaders[header] = value;
      }

      // Call original
      return self.originalXHRSetRequestHeader.call(this, header, value);
    };

    // Intercept send()
    XMLHttpRequest.prototype.send = function(data) {
      const xhr = this;
      const { url: cleanUrl, params } = self.parseUrl(xhr._url);

      // Emit request event
      self.emit({
        type: 'request',
        timestamp: new Date(),
        request: {
          id: xhr._requestId,
          url: cleanUrl,
          method: xhr._method,
          headers: xhr._requestHeaders,
          data: data,
          params,
          client: 'xhr'
        }
      });

      // CRITICAL: Use addEventListener, NOT replace handlers
      // React Native's EventTarget implementation breaks if you replace handlers
      let processed = false;

      const processResponse = (isError = false) => {
        if (processed) return;
        processed = true;

        const duration = Date.now() - xhr._startTime;

        if (isError) {
          self.emit({
            type: 'error',
            timestamp: new Date(),
            duration,
            request: {
              id: xhr._requestId,
              url: cleanUrl,
              method: xhr._method,
              params
            },
            error: {
              message: xhr.statusText || 'Network Error'
            }
          });
        } else {
          // Parse response headers
          const headersString = xhr.getAllResponseHeaders();
          const headers = {};
          headersString.split('\r\n').forEach(line => {
            const [key, value] = line.split(': ');
            if (key && value) {
              headers[key] = value;
            }
          });

          // Parse response body
          let body = xhr.response;
          if (typeof body === 'string') {
            try {
              body = JSON.parse(body);
            } catch {
              // Keep as string
            }
          }

          self.emit({
            type: 'response',
            timestamp: new Date(),
            duration,
            request: {
              id: xhr._requestId,
              url: cleanUrl,
              method: xhr._method,
              params
            },
            response: {
              status: xhr.status,
              statusText: xhr.statusText,
              headers,
              body,
              size: body?.length || 0
            }
          });
        }
      };

      // Add listeners (works alongside user listeners)
      this.addEventListener('load', () => processResponse(false));
      this.addEventListener('error', () => processResponse(true));
      this.addEventListener('abort', () => processResponse(true));
      this.addEventListener('readystatechange', () => {
        if (this.readyState === 4 && !processed) {
          processResponse(false);
        }
      });

      // Call original
      return self.originalXHRSend.call(this, data);
    };
  }

  stopListening() {
    // Restore originals
    XMLHttpRequest.prototype.open = this.originalXHROpen;
    XMLHttpRequest.prototype.send = this.originalXHRSend;
    XMLHttpRequest.prototype.setRequestHeader = this.originalXHRSetRequestHeader;
  }
}
```

#### CRITICAL: Event Handler Fix

⚠️ **DO NOT replace `onload`, `onerror`, etc. directly**. This breaks React Native's EventTarget implementation.

```javascript
// ❌ BAD - Breaks React Native
xhr.onload = function() {
  myHandler();
  originalOnload.call(this);
};

// ✅ GOOD - Use addEventListener
xhr.addEventListener('load', myHandler);
```

#### Trade-offs

| Pros | Cons |
|------|------|
| ✅ Full control | ❌ Complex to implement correctly |
| ✅ Can modify requests | ❌ Can break if multiple libraries swizzle |
| ✅ Captures request body | ❌ Must handle all edge cases |
| ✅ Can block/redirect | ❌ Risk of breaking XHR functionality |
| ✅ Captures everything | ❌ Higher maintenance burden |

---

### 3. Native Layer Interception

Implement custom handlers at the native layer (iOS/Android).

#### iOS: Custom Request Handler

```objc
// MyCustomHandler.h
#import <React/RCTBridgeModule.h>
#import <React/RCTURLRequestHandler.h>

@interface MyCustomHandler : NSObject <RCTURLRequestHandler>
@end

// MyCustomHandler.m
@implementation MyCustomHandler

RCT_EXPORT_MODULE()

- (BOOL)canHandleRequest:(NSURLRequest *)request {
  // Intercept specific URLs
  return [request.URL.host isEqualToString:@"myapi.com"];
}

- (id)sendRequest:(NSURLRequest *)request
     withDelegate:(id<RCTURLRequestDelegate>)delegate {
  // Custom handling
  NSLog(@"[DevTools] Intercepted: %@", request.URL);

  // Forward to default handler or handle custom logic
  return nil;
}

@end
```

#### Android: OkHttp Interceptor

```kotlin
// CustomNetworkInterceptor.kt
package com.myapp

import okhttp3.Interceptor
import okhttp3.Response

class CustomNetworkInterceptor : Interceptor {
  override fun intercept(chain: Interceptor.Chain): Response {
    val request = chain.request()

    // Log request
    Log.d("DevTools", "Request: ${request.url}")

    // Proceed with request
    val response = chain.proceed(request)

    // Log response
    Log.d("DevTools", "Response: ${response.code}")

    return response
  }
}

// Register in NetworkingModule
NetworkingModule.setCustomClientBuilder(object : CustomClientBuilder {
  override fun apply(builder: OkHttpClient.Builder) {
    builder.addInterceptor(CustomNetworkInterceptor())
  }
})
```

#### Trade-offs

| Pros | Cons |
|------|------|
| ✅ Lowest-level control | ❌ Requires native code |
| ✅ Captures non-JS traffic | ❌ Platform-specific |
| ✅ Can implement SSL pinning | ❌ Harder to distribute |
| ✅ No JS overhead | ❌ Overkill for most use cases |

---

## Complete Implementation Examples

### Example 1: Minimal XHR Interceptor

```javascript
// minimalInterceptor.js
class MinimalNetworkInterceptor {
  constructor(onEvent) {
    this.onEvent = onEvent;
    this.events = [];
  }

  start() {
    const self = this;

    const interceptor = {
      requestSent(id, url, method, headers) {
        const event = {
          id,
          type: 'request',
          url,
          method,
          headers,
          timestamp: Date.now()
        };

        self.events.push(event);
        self.onEvent(event);
      },

      responseReceived(id, url, status, headers) {
        const event = {
          id,
          type: 'response',
          url,
          status,
          headers,
          timestamp: Date.now()
        };

        self.events.push(event);
        self.onEvent(event);
      },

      loadingFailed(id, error) {
        const event = {
          id,
          type: 'error',
          error,
          timestamp: Date.now()
        };

        self.events.push(event);
        self.onEvent(event);
      },

      dataReceived(id, data) {
        // Optional: process response body
      },

      loadingFinished(id, size) {
        // Optional: track completion
      }
    };

    XMLHttpRequest.__setInterceptor_DO_NOT_USE(interceptor);
  }

  stop() {
    XMLHttpRequest.__setInterceptor_DO_NOT_USE(null);
  }

  getEvents() {
    return [...this.events];
  }

  clear() {
    this.events = [];
  }
}

// Usage
const interceptor = new MinimalNetworkInterceptor((event) => {
  console.log('[Network]', event);
});

interceptor.start();
```

### Example 2: Hybrid Interceptor (XHR + Swizzling)

```javascript
// hybridInterceptor.js
class HybridNetworkInterceptor {
  constructor(options = {}) {
    this.options = {
      mode: 'auto', // 'xhr' | 'swizzle' | 'auto'
      captureBody: true,
      maxBodySize: 1024 * 1024, // 1MB
      ...options
    };

    this.events = [];
    this.mode = null;
  }

  start() {
    // Auto-detect best mode
    if (this.options.mode === 'auto') {
      this.mode = this.detectBestMode();
    } else {
      this.mode = this.options.mode;
    }

    if (this.mode === 'xhr') {
      this.startXHRInterceptor();
    } else {
      this.startSwizzling();
    }

    console.log(`[Network] Started in ${this.mode} mode`);
  }

  detectBestMode() {
    // Check if debugger is active
    const testInterceptor = {};
    const canUseXHR = XMLHttpRequest.__setInterceptor_DO_NOT_USE(testInterceptor);
    XMLHttpRequest.__setInterceptor_DO_NOT_USE(null);

    // If interceptor already set (debugger active), use swizzling
    // Otherwise use XHR interceptor (safer)
    return canUseXHR ? 'xhr' : 'swizzle';
  }

  startXHRInterceptor() {
    const self = this;
    const pendingRequests = new Map();

    const interceptor = {
      requestSent(id, url, method, headers) {
        const { url: cleanUrl, params } = self.parseUrl(url);

        const event = {
          id: `xhr_${id}`,
          type: 'request',
          url: cleanUrl,
          method,
          headers,
          params,
          timestamp: Date.now()
        };

        pendingRequests.set(id, event);
        self.recordEvent(event);
      },

      responseReceived(id, url, status, headers) {
        const pending = pendingRequests.get(id);
        if (pending) {
          pending.status = status;
          pending.responseHeaders = headers;
        }
      },

      dataReceived(id, data) {
        const pending = pendingRequests.get(id);
        if (pending) {
          pending.responseBody = self.parseBody(data);
        }
      },

      loadingFinished(id, size) {
        const pending = pendingRequests.get(id);
        if (pending) {
          self.recordEvent({
            ...pending,
            type: 'response',
            size,
            timestamp: Date.now()
          });
          pendingRequests.delete(id);
        }
      },

      loadingFailed(id, error) {
        const pending = pendingRequests.get(id);
        if (pending) {
          self.recordEvent({
            ...pending,
            type: 'error',
            error,
            timestamp: Date.now()
          });
          pendingRequests.delete(id);
        }
      }
    };

    XMLHttpRequest.__setInterceptor_DO_NOT_USE(interceptor);
  }

  startSwizzling() {
    // Use method swizzling (see Example 2 in Section 2)
    // ... implementation from Method Swizzling section
  }

  parseUrl(url) {
    const queryIndex = url.indexOf('?');
    if (queryIndex === -1) {
      return { url, params: null };
    }

    const baseUrl = url.substring(0, queryIndex);
    const queryString = url.substring(queryIndex + 1);

    const params = {};
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value !== undefined) {
        params[key] = decodeURIComponent(value.replace(/\+/g, ' '));
      }
    });

    return { url: baseUrl, params };
  }

  parseBody(data) {
    if (!this.options.captureBody) {
      return '[Capture disabled]';
    }

    if (typeof data === 'string') {
      if (data.length > this.options.maxBodySize) {
        return `[Too large: ${data.length} bytes]`;
      }

      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }

    return data;
  }

  recordEvent(event) {
    this.events.push(event);

    if (this.options.onEvent) {
      this.options.onEvent(event);
    }
  }

  getEvents() {
    return [...this.events];
  }

  getStats() {
    const byType = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: this.events.length,
      byType,
      mode: this.mode
    };
  }
}

// Usage
const interceptor = new HybridNetworkInterceptor({
  mode: 'auto',
  captureBody: true,
  onEvent: (event) => {
    console.log('[Network]', event);
  }
});

interceptor.start();
```

### Example 3: Complete rn-buoy Integration

See [networkListener.ts](src/network/utils/networkListener.ts) for the full production implementation with:
- Fetch and XHR swizzling
- Query parameter parsing
- Event store integration
- Request/response correlation
- Error handling
- URL filtering
- Subscription system

---

## API Reference

### NetworkListener

#### Constructor

```typescript
new NetworkListener(options?: ListenerOptions)
```

**Options:**

```typescript
interface ListenerOptions {
  mode?: 'xhr' | 'swizzle' | 'auto';  // Interception mode
  captureBody?: boolean;                // Capture request/response bodies
  maxBodySize?: number;                 // Max body size in bytes (default: 1MB)
  ignoreUrls?: RegExp[];               // URLs to ignore
  onEvent?: (event: NetworkEvent) => void;  // Event callback
}
```

#### Methods

```typescript
// Start listening
start(): void

// Stop listening
stop(): void

// Get all events
getEvents(): NetworkEvent[]

// Clear event history
clearEvents(): void

// Get statistics
getStats(): {
  total: number;
  byType: Record<string, number>;
  mode: string;
}

// Check if listening
isListening(): boolean
```

#### Event Types

```typescript
interface NetworkEvent {
  id: string;
  type: 'request' | 'response' | 'error';
  timestamp: number;
  url: string;
  method?: string;
  params?: Record<string, string>;
  headers?: Record<string, string>;
  body?: any;
  status?: number;
  statusText?: string;
  duration?: number;
  size?: number;
  error?: {
    message: string;
    name: string;
  };
}
```

---

## Best Practices

### ✅ DO

1. **Initialize Before App Starts**
   ```javascript
   // index.js (before imports)
   import './networkInterceptor';
   import App from './App';
   ```

2. **Only Enable in Development**
   ```javascript
   if (__DEV__) {
     networkListener.start();
   }
   ```

3. **Filter Noise**
   ```javascript
   const listener = new NetworkListener({
     ignoreUrls: [
       /metro/, // Metro bundler
       /debugger/, // React Native debugger
       /localhost:8081/ // Dev server
     ]
   });
   ```

4. **Limit Body Size**
   ```javascript
   const listener = new NetworkListener({
     maxBodySize: 1024 * 1024, // 1MB
     captureBody: true
   });
   ```

5. **Handle Errors Gracefully**
   ```javascript
   try {
     networkListener.start();
   } catch (error) {
     console.error('[DevTools] Failed to start interceptor:', error);
     // App should still work
   }
   ```

### ❌ DON'T

1. **Don't Enable in Production**
2. **Don't Forget to Bind Context**
3. **Don't Replace Event Handlers** (use addEventListener)
4. **Don't Capture Sensitive Data** (passwords, tokens)
5. **Don't Block Main Thread** (use async processing)

---

## Common Pitfalls

### Pitfall 1: Query Parameters Lost in UI

**Problem:** Params captured but not displayed.

**Root Cause:** UI re-parses URL instead of using already-parsed params.

**Solution:** See [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md)

### Pitfall 2: Response Body Consumed

**Problem:** Can't read response body after user code consumes it.

**Solution:** Clone response before user code gets it:

```javascript
const response = await originalFetch(input, init);
const clone = response.clone(); // Clone before returning
const body = await clone.text();
return response; // Return original
```

### Pitfall 3: Missing `this` Context

**Problem:** `TypeError: this.originalFetch is not a function`

**Solution:** Always bind context:

```javascript
// ❌ BAD
this.originalFetch = globalThis.fetch;

// ✅ GOOD
this.originalFetch = globalThis.fetch.bind(globalThis);
```

### Pitfall 4: Breaking EventTarget

**Problem:** `TypeError: Cannot read property 'call' of undefined`

**Solution:** Use addEventListener instead of replacing handlers:

```javascript
// ❌ BAD
xhr.onload = myHandler;

// ✅ GOOD
xhr.addEventListener('load', myHandler);
```

### Pitfall 5: Intercepting Too Late

**Problem:** Some requests already sent before interceptor active.

**Solution:** Initialize in index.js before any imports:

```javascript
// index.js
import './networkInterceptor'; // ← First
import {AppRegistry} from 'react-native';
import App from './App';
```

---

## Testing Your Interceptors

### Test Case 1: Simple GET Request

```javascript
async function testSimpleGet() {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
  const data = await response.json();

  // Verify interceptor captured:
  // - Request: GET, URL with params
  // - Response: 200, JSON body
}
```

### Test Case 2: POST with Body

```javascript
async function testPostWithBody() {
  const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Test', body: 'Content', userId: 1 })
  });

  // Verify interceptor captured:
  // - Request: POST, headers, JSON body
  // - Response: 201, created resource
}
```

### Test Case 3: Query Parameters

```javascript
async function testQueryParams() {
  const response = await fetch('https://api.example.com/search?q=test&limit=10');

  // Verify interceptor captured:
  // - URL: https://api.example.com/search
  // - Params: { q: "test", limit: "10" }
}
```

### Test Case 4: Error Handling

```javascript
async function testNetworkError() {
  try {
    await fetch('https://nonexistent-domain-12345.com');
  } catch (error) {
    // Verify interceptor captured error event
  }
}
```

### Test Case 5: XMLHttpRequest

```javascript
function testXHR() {
  const xhr = new XMLHttpRequest();
  xhr.open('GET', 'https://jsonplaceholder.typicode.com/posts/1');
  xhr.onload = () => {
    console.log(xhr.responseText);
  };
  xhr.send();

  // Verify interceptor captured XHR request
}
```

---

## Performance Considerations

### 1. Overhead

- XHR Interceptor: ~0.1ms per request
- Method Swizzling: ~0.5ms per request
- Body parsing: Varies by size

### 2. Memory Management

```javascript
// Limit event history
const MAX_EVENTS = 1000;

recordEvent(event) {
  this.events.push(event);
  if (this.events.length > MAX_EVENTS) {
    this.events = this.events.slice(-MAX_EVENTS);
  }
}
```

### 3. Async Processing

```javascript
// Don't block main thread
recordEvent(event) {
  // Quick logging
  this.events.push(event);

  // Heavy processing in background
  setImmediate(() => {
    this.processEvent(event);
    this.sendToBackend(event);
  });
}
```

### 4. Batch Network Requests

```javascript
// Batch events every 5 seconds
class BatchedSender {
  constructor() {
    this.queue = [];
    setInterval(() => this.flush(), 5000);
  }

  add(event) {
    this.queue.push(event);
  }

  flush() {
    if (this.queue.length === 0) return;

    fetch('/api/events/batch', {
      method: 'POST',
      body: JSON.stringify(this.queue)
    });

    this.queue = [];
  }
}
```

---

## Compatibility Notes

### React Native Versions

| Version | XHR Interceptor | Method Swizzling | Notes |
|---------|----------------|------------------|-------|
| 0.60+ | ✅ | ✅ | Full support |
| 0.50-0.59 | ✅ | ✅ | Minor API differences |
| < 0.50 | ⚠️ | ⚠️ | Test carefully |

### Platform Support

| Platform | Supported | Notes |
|----------|-----------|-------|
| iOS | ✅ | Full support |
| Android | ✅ | Full support |
| Web | ⚠️ | Different fetch implementation |

### HTTP Libraries

| Library | Captured | Notes |
|---------|----------|-------|
| fetch | ✅ | Uses XHR internally |
| axios | ✅ | Uses XHR adapter |
| XMLHttpRequest | ✅ | Direct capture |
| Custom | Varies | Depends on implementation |

---

## Summary

### Key Takeaways

1. ✅ **XHR Interceptor** = Official, safe, read-only
2. ✅ **Method Swizzling** = Full control, higher risk
3. ✅ **Hybrid Approach** = Best of both worlds
4. ✅ **Query Params** = Captured but may need UI fix
5. ✅ **Initialize Early** = Before app code runs

### Recommended Approach

**For rn-buoy DevTools:**

1. **Short-term:** Fix query param display bug
2. **Medium-term:** Implement hybrid interceptor
3. **Long-term:** Add native handlers for advanced features

### File Structure

```
rn-buoy/packages/network/
├── src/
│   ├── network/
│   │   ├── utils/
│   │   │   ├── networkListener.ts        # Method swizzling
│   │   │   ├── xhrInterceptor.ts        # XHR interceptor
│   │   │   ├── hybridInterceptor.ts     # Hybrid approach
│   │   │   └── networkEventStore.ts     # Event storage
│   │   ├── hooks/
│   │   │   └── useNetworkEvents.ts      # React hook
│   │   ├── components/
│   │   │   └── NetworkEventDetailView.tsx
│   │   └── types/
│   │       └── index.ts
│   └── index.ts
└── README.md
```

---

**End of Guide**

For implementation details, see:
- [REACT_NATIVE_NETWORK_ARCHITECTURE.md](REACT_NATIVE_NETWORK_ARCHITECTURE.md) - Deep dive into RN networking
- [QUERY_PARAMS_ISSUE_ANALYSIS.md](QUERY_PARAMS_ISSUE_ANALYSIS.md) - Fix for query parameter display
- [INTERCEPTION_RECOMMENDATIONS.md](INTERCEPTION_RECOMMENDATIONS.md) - Strategic recommendations
