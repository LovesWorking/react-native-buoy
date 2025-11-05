# React Native Network Architecture - Deep Dive

## Table of Contents
1. [Overview](#overview)
2. [Architecture Layers](#architecture-layers)
3. [Complete Request Flow](#complete-request-flow)
4. [Type System](#type-system)
5. [Interception Points](#interception-points)
6. [Platform-Specific Implementation](#platform-specific-implementation)
7. [Extensibility Mechanisms](#extensibility-mechanisms)
8. [Performance Considerations](#performance-considerations)

---

## Overview

React Native's networking implementation is built on a **multi-layer architecture** that bridges JavaScript fetch/XMLHttpRequest APIs to native platform networking (NSURLSession on iOS, OkHttp on Android).

### Key Insight
**fetch is implemented as a polyfill on top of XMLHttpRequest**, which means all fetch calls eventually go through the XMLHttpRequest implementation. This is critical for understanding interception strategies.

---

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: JavaScript API (User-Facing)                           │
│ - fetch()                                                        │
│ - new XMLHttpRequest()                                           │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: Polyfill Layer                                          │
│ - whatwg-fetch (implements fetch using XHR)                     │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: XMLHttpRequest Implementation (Custom RN)              │
│ - State machine (UNSENT → OPENED → LOADING → DONE)             │
│ - Event system (load, error, progress, etc.)                    │
│ - Request body conversion                                        │
├─────────────────────────────────────────────────────────────────┤
│ Layer 4: Bridge/TurboModule Layer                               │
│ - RCTNetworking (platform wrapper)                              │
│ - Event emitters for async callbacks                            │
├─────────────────────────────────────────────────────────────────┤
│ Layer 5: Native Networking Layer                                │
│ - iOS: NSURLSession via handler system                          │
│ - Android: OkHttp3 with interceptors                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Request Flow

### Detailed Flow Diagram

```
User calls fetch(url, options)
         │
         ▼
whatwg-fetch polyfill
         │
         ├─ Creates new XMLHttpRequest()
         ├─ Calls xhr.open(method, url)
         ├─ Sets headers via xhr.setRequestHeader()
         ├─ Calls xhr.send(body)
         └─ Returns Promise that resolves on xhr.onload
         │
         ▼
XMLHttpRequest.prototype.open()
         │
         ├─ Validates parameters
         ├─ Stores method, url
         └─ Transitions to OPENED state
         │
         ▼
XMLHttpRequest.prototype.send(data)
         │
         ├─ Converts body via convertRequestBody()
         │   ├─ string → {string: body}
         │   ├─ Blob → {blob: {blobId, offset, size}}
         │   ├─ FormData → {formData: [{fieldName, string}]}
         │   └─ ArrayBuffer → {base64: encoded}
         │
         ├─ Subscribes to native events:
         │   - didSendNetworkData (upload progress)
         │   - didReceiveNetworkResponse (headers received)
         │   - didReceiveNetworkData (body chunk)
         │   - didReceiveNetworkDataProgress (download progress)
         │   - didCompleteNetworkResponse (done/error)
         │
         └─ Calls RCTNetworking.sendRequest()
         │
         ▼
RCTNetworking (JavaScript wrapper)
         │
         ├─ Generates unique requestId
         ├─ Converts headers to platform format:
         │   - iOS: Object {key: value}
         │   - Android: Array [[key, value]]
         │
         └─ Calls native module
         │
         ▼
═══════════════════════════════════════════════════════════════════
                        PLATFORM SPLIT
═══════════════════════════════════════════════════════════════════
         │
    ┌────┴────┐
    │         │
   iOS      Android
    │         │
    ▼         ▼

iOS Path:                          Android Path:

RCTNetworking.mm                   NetworkingModule.kt
    │                                  │
    ▼                                  ▼
buildRequest()                     sendRequestInternalReal()
    │                                  │
    ├─ Creates NSMutableURLRequest     ├─ Checks UriHandlers (custom schemes)
    ├─ Sets URL, method, headers       ├─ Builds OkHttp Request
    ├─ Processes data:                 ├─ Processes data:
    │  - string: NSData from UTF8      │  - string: RequestBody
    │  - base64: Decode                │  - base64: Decode to bytes
    │  - uri: Load from path           │  - uri: File/content provider
    │  - formData: Multipart           │  - formData: MultipartBody
    │  - blob: Via BlobModule          │  - Custom RequestBodyHandlers
    ├─ Sets timeout                    ├─ Sets timeout
    └─ Handles cookies                 └─ Cookie jar handling
    │                                  │
    ▼                                  ▼
handlerForRequest()                OkHttpClient.newCall()
    │                                  │
    ├─ Priority-sorted handlers:       ├─ NetworkInterceptorCreators
    │  1. Custom handlers              ├─ ProgressResponseBody wrapper
    │  2. RCTHTTPRequestHandler        └─ Executes async
    │  3. RCTFileRequestHandler        │
    │  4. RCTDataRequestHandler        ▼
    │                              OkHttp Request Execution
    ▼                                  │
RCTHTTPRequestHandler                  ├─ Connection pooling
    │                                  ├─ Retry logic
    ├─ Uses NSURLSession               ├─ Redirect handling
    ├─ Implements NSURLSessionDataDelegate  └─ Certificate validation
    ├─ Custom config via provider      │
    └─ Delegate callbacks:             ▼
       - didReceiveResponse         Callbacks:
       - didReceiveData                │
       - didCompleteWithError          ├─ onResponse:
    │                                  │   - Response handler selection
    ▼                                  │   - Gzip decode if needed
RCTNetworkTask                         │   - Incremental text updates
    │                                  │   - Base64/text conversion
    ├─ State: Pending → InProgress → Finished │
    ├─ Accumulates response data       ├─ onFailure:
    ├─ Progress tracking               │   - Error message extraction
    └─ Calls delegate methods          │
    │                                  ▼
    ▼                              NetworkEventUtil
Emit events to JS                      │
    │                              Emits events to JS
    │                                  │
    └────────────┬───────────────────┘
                 │
                 ▼
═══════════════════════════════════════════════════════════════════
                    EVENTS RETURN TO JAVASCRIPT
═══════════════════════════════════════════════════════════════════
                 │
                 ▼
RCTNetworking event handlers
                 │
                 ├─ didReceiveNetworkResponse
                 │   - Updates xhr.status, xhr.responseHeaders
                 │   - Transitions to HEADERS_RECEIVED
                 │
                 ├─ didReceiveNetworkData (or incremental)
                 │   - Appends to response buffer
                 │   - Transitions to LOADING
                 │   - Fires progress events if listeners attached
                 │
                 └─ didCompleteNetworkResponse
                     │
                     ├─ If error: Fires 'error' event
                     │
                     └─ If success:
                         - Processes response based on responseType:
                           * text/'': String
                           * json: JSON.parse()
                           * arraybuffer: base64 → ArrayBuffer
                           * blob: Creates Blob
                         - Transitions to DONE
                         - Fires 'load' event
                 │
                 ▼
xhr.onload fires
                 │
                 ▼
whatwg-fetch Promise resolves
                 │
                 ▼
User receives Response object
```

---

## Type System

### Core Types

```typescript
// Request Body Types
type RequestBody =
  | string
  | Blob
  | FormData
  | {uri: string}
  | ArrayBuffer
  | ArrayBufferView;

// Native Request Body Format (after conversion)
type NativeRequestBody =
  | {string: string}
  | {blob: BlobData}
  | {formData: FormDataPart[]}
  | {base64: string}
  | {uri: string};

// Response Types
type ResponseType = '' | 'arraybuffer' | 'blob' | 'document' | 'json' | 'text';
type NativeResponseType = 'base64' | 'blob' | 'text';

// Network Events (Native → JS)
type NetworkEvents = {
  didSendNetworkData: [requestId: number, progress: number, total: number];
  didReceiveNetworkResponse: [requestId: number, status: number, headers: Record<string, string>, url: string];
  didReceiveNetworkData: [requestId: number, response: string];
  didReceiveNetworkIncrementalData: [requestId: number, responseText: string, progress: number, total: number];
  didReceiveNetworkDataProgress: [requestId: number, loaded: number, total: number];
  didCompleteNetworkResponse: [requestId: number, error: string, isTimeout: boolean];
};
```

### Platform-Specific Types

```typescript
// iOS TurboModule Interface
interface NativeNetworkingIOS extends TurboModule {
  sendRequest: (
    query: {
      method: string;
      url: string;
      data: Object;
      headers: Object; // Object format: {key: value}
      responseType: string;
      incrementalUpdates: boolean;
      timeout: number;
      withCredentials: boolean;
      unstable_devToolsRequestId?: string;
    },
    callback: (requestId: number) => void
  ) => void;
  abortRequest: (requestId: number) => void;
  clearCookies: (callback: (result: boolean) => void) => void;
}

// Android TurboModule Interface
interface NativeNetworkingAndroid extends TurboModule {
  sendRequest: (
    method: string,
    url: string,
    requestId: number,
    headers: Array<[string, string]>, // Array format for Android
    data: Object,
    responseType: string,
    useIncrementalUpdates: boolean,
    timeout: number,
    withCredentials: boolean
  ) => void;
  abortRequest: (requestId: number) => void;
  clearCookies: (callback: (result: boolean) => void) => void;
}
```

---

## Interception Points

### 1. JavaScript Layer (Highest Level)

**XMLHttpRequest Interceptor (Official Mechanism)**
```typescript
interface XHRInterceptor {
  requestSent(id: number, url: string, method: string, headers: Object): void;
  responseReceived(id: number, url: string, status: number, headers: Object): void;
  dataReceived(id: number, data: string): void;
  loadingFinished(id: number, encodedDataLength: number): void;
  loadingFailed(id: number, error: string): void;
}

XMLHttpRequest.__setInterceptor_DO_NOT_USE(myInterceptor);
```

**Pros:**
- Sees ALL network traffic (fetch + XHR)
- Read-only monitoring (doesn't break functionality)
- Used by React Native DevTools

**Cons:**
- Read-only (can't modify requests)
- Undocumented internal API
- Can only have one interceptor at a time

---

**Global Method Swizzling (What rn-buoy uses)**
```typescript
const originalFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  // Pre-request logic
  const response = await originalFetch(input, init);
  // Post-response logic
  return response;
};

const originalXHRSend = XMLHttpRequest.prototype.send;
XMLHttpRequest.prototype.send = function(data) {
  // Pre-request logic
  return originalXHRSend.call(this, data);
};
```

**Pros:**
- Full control over requests/responses
- Can modify, block, or redirect
- Can capture all request details including body

**Cons:**
- Must preserve `this` context carefully
- Can break if multiple libraries swizzle
- Must use `addEventListener` instead of replacing handlers
- Edge cases with Request objects, FormData, etc.

---

### 2. Native Layer (Platform-Specific)

#### iOS Interception Points

**A. Request Handlers (Protocol-based)**
```objc
@protocol RCTURLRequestHandler <RCTBridgeModule>
- (BOOL)canHandleRequest:(NSURLRequest *)request;
- (id)sendRequest:(NSURLRequest *)request
     withDelegate:(id<RCTURLRequestDelegate>)delegate;
- (void)cancelRequest:(id)requestToken;
- (float)handlerPriority; // Higher = checked first
@end

// Example: Handle custom URL schemes
@interface MyCustomHandler : NSObject <RCTURLRequestHandler>
@end

@implementation MyCustomHandler
RCT_EXPORT_MODULE()

- (BOOL)canHandleRequest:(NSURLRequest *)request {
  return [request.URL.scheme isEqualToString:@"myapp"];
}

- (id)sendRequest:(NSURLRequest *)request
     withDelegate:(id<RCTURLRequestDelegate>)delegate {
  // Custom handling
  return requestToken;
}
@end
```

**B. Request Body Handlers**
```objc
@protocol RCTNetworkingRequestHandler <NSObject>
- (BOOL)canHandleNetworkingRequest:(NSDictionary *)data;
- (NSDictionary *)handleNetworkingRequest:(NSDictionary *)data;
@end

// Example: Custom data encoding
id<RCTNetworkingRequestHandler> handler = ...;
[networkingModule addRequestHandler:handler];
```

**C. Response Handlers**
```objc
@protocol RCTNetworkingResponseHandler <NSObject>
- (BOOL)canHandleNetworkingResponse:(NSString *)responseType;
- (id)handleNetworkingResponse:(NSURLResponse *)response
                          data:(NSData *)data;
@end
```

**D. NSURLSession Configuration**
```objc
RCTSetCustomNSURLSessionConfigurationProvider(^{
  NSURLSessionConfiguration *config =
    [NSURLSessionConfiguration defaultSessionConfiguration];

  // SSL pinning
  config.URLCredentialStorage = ...;

  // Custom protocols
  config.protocolClasses = @[MyProtocol.class];

  return config;
});
```

#### Android Interception Points

**A. UriHandler (Custom Schemes)**
```kotlin
interface UriHandler {
  fun supports(uri: Uri, responseType: String): Boolean
  fun fetch(uri: Uri): Pair<WritableMap, ByteArray>
}

val handler = object : UriHandler {
  override fun supports(uri: Uri, responseType: String) =
    uri.scheme == "myapp"

  override fun fetch(uri: Uri): Pair<WritableMap, ByteArray> {
    // Custom handling
  }
}

networkingModule.addUriHandler(handler)
```

**B. RequestBodyHandler**
```kotlin
interface RequestBodyHandler {
  fun supports(map: ReadableMap): Boolean
  fun toRequestBody(map: ReadableMap, contentType: String?): RequestBody?
}
```

**C. OkHttp Interceptors**
```kotlin
NetworkingModule.setCustomClientBuilder(object : CustomClientBuilder {
  override fun apply(builder: OkHttpClient.Builder) {
    builder.addInterceptor { chain ->
      val request = chain.request()

      // Inspect/modify request
      val newRequest = request.newBuilder()
        .addHeader("X-Custom", "value")
        .build()

      val response = chain.proceed(newRequest)

      // Inspect/modify response
      response
    }
  }
})
```

**D. Network Interceptor Creators**
```kotlin
val module = NetworkingModule(
  context,
  listOf(
    NetworkInterceptorCreator { MyInterceptor() }
  )
)
```

---

## Platform-Specific Implementation

### iOS: Handler-Based Architecture

**File Structure:**
- `RCTNetworking.mm` - Main module with handler registry
- `RCTNetworkTask.mm` - Encapsulates individual requests
- `RCTHTTPRequestHandler.mm` - NSURLSession-based HTTP handler
- `RCTFileRequestHandler.mm` - Handles file:// URLs
- `RCTDataRequestHandler.mm` - Handles data:// URLs

**Handler Selection Process:**
```objc
- (id<RCTURLRequestHandler>)handlerForRequest:(NSURLRequest *)request {
  // 1. Check custom handlers first (by priority)
  for (id<RCTURLRequestHandler> handler in _handlers) {
    if ([handler canHandleRequest:request]) {
      return handler;
    }
  }

  // 2. Fallback to built-in handlers
  // HTTP/HTTPS → RCTHTTPRequestHandler
  // file:// → RCTFileRequestHandler
  // data:// → RCTDataRequestHandler
}
```

**Request Lifecycle:**
```
sendRequest called
     ↓
buildRequest() - Creates NSURLRequest
     ↓
networkTaskWithRequest() - Creates RCTNetworkTask
     ↓
handlerForRequest() - Selects handler
     ↓
[handler sendRequest:withDelegate:]
     ↓
RCTNetworkTask manages state (Pending → InProgress → Finished)
     ↓
Delegate callbacks fire
     ↓
RCTNetworkTask accumulates data
     ↓
sendEventWithName: dispatches to JS
```

**NSURLSession Integration:**
```objc
// RCTHTTPRequestHandler.mm
- (id)sendRequest:(NSURLRequest *)request
     withDelegate:(id<RCTURLRequestDelegate>)delegate {

  NSURLSessionConfiguration *config = [self sessionConfiguration];
  NSURLSession *session = [NSURLSession sessionWithConfiguration:config
                                                        delegate:self
                                                   delegateQueue:nil];

  NSURLSessionDataTask *task = [session dataTaskWithRequest:request];
  [task resume];

  return task;
}

// NSURLSessionDataDelegate methods
- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)task
didReceiveResponse:(NSURLResponse *)response
 completionHandler:(void (^)(NSURLSessionResponseDisposition))handler {

  [delegate URLRequest:task didReceiveResponse:response];
  handler(NSURLSessionResponseAllow);
}

- (void)URLSession:(NSURLSession *)session
          dataTask:(NSURLSessionDataTask *)task
    didReceiveData:(NSData *)data {

  [delegate URLRequest:task didReceiveData:data];
}
```

---

### Android: OkHttp-Based Architecture

**File Structure:**
- `NetworkingModule.kt` - Main module with OkHttp integration
- `NetworkEventUtil.kt` - Event emission helpers
- `ProgressResponseBody.kt` - Wraps response for progress tracking

**Request Execution:**
```kotlin
internal fun sendRequestInternalReal(
  method: String,
  url: String,
  requestId: Int,
  headers: ReadableArray,
  data: ReadableMap?,
  responseType: String,
  useIncrementalUpdates: Boolean,
  timeout: Int,
  withCredentials: Boolean
) {
  // 1. Check UriHandlers for custom schemes
  val uri = Uri.parse(url)
  uriHandlers.forEach { handler ->
    if (handler.supports(uri, responseType)) {
      // Handle via custom handler
      return
    }
  }

  // 2. Build OkHttp request
  val requestBuilder = Request.Builder().url(url)

  // 3. Add headers
  for (i in 0 until headers.size()) {
    val header = headers.getArray(i)!!
    requestBuilder.addHeader(header.getString(0)!!, header.getString(1)!!)
  }

  // 4. Add request body
  data?.let { body ->
    val requestBody = when {
      body.hasKey("string") -> {
        val string = body.getString("string")!!
        val gzip = body.getBoolean("gzip")
        if (gzip) {
          GzipRequestBody(string.toRequestBody())
        } else {
          string.toRequestBody()
        }
      }
      body.hasKey("base64") -> {
        val base64 = body.getString("base64")!!
        Base64.decode(base64, Base64.DEFAULT).toRequestBody()
      }
      body.hasKey("uri") -> {
        val uri = Uri.parse(body.getString("uri")!!)
        createRequestBody(uri)
      }
      body.hasKey("formData") -> {
        createMultipartBody(body.getArray("formData")!!)
      }
      else -> {
        // Check custom RequestBodyHandlers
        requestBodyHandlers.find { it.supports(body) }
          ?.toRequestBody(body, contentType)
      }
    }
    requestBuilder.method(method, requestBody)
  }

  // 5. Execute async
  val client = okHttpClient.newBuilder()
    .connectTimeout(timeout.toLong(), TimeUnit.MILLISECONDS)
    .readTimeout(timeout.toLong(), TimeUnit.MILLISECONDS)
    .build()

  client.newCall(requestBuilder.build()).enqueue(object : Callback {
    override fun onResponse(call: Call, response: Response) {
      // Process response with ResponseHandlers
      val responseBody = response.body!!

      // Gzip handling
      val isGzipped = response.header("Content-Encoding") == "gzip"
      val inputStream = if (isGzipped) {
        GZIPInputStream(responseBody.byteStream())
      } else {
        responseBody.byteStream()
      }

      // Read data
      val data = inputStream.readBytes()

      // Convert based on responseType
      val responseData = when (responseType) {
        "text" -> Arguments.createMap().apply {
          putString("text", String(data, Charsets.UTF_8))
        }
        "base64" -> Arguments.createMap().apply {
          putString("base64", Base64.encodeToString(data, Base64.NO_WRAP))
        }
        else -> {
          responseHandlers.find { it.supports(responseType) }
            ?.toResponseData(data)
        }
      }

      // Emit events
      NetworkEventUtil.onResponseReceived(...)
      NetworkEventUtil.onDataReceived(...)
      NetworkEventUtil.onRequestSuccess(...)
    }

    override fun onFailure(call: Call, e: IOException) {
      NetworkEventUtil.onRequestError(...)
    }
  })
}
```

---

## Extensibility Mechanisms

### Summary Table

| Layer | iOS Mechanism | Android Mechanism | Use Case |
|-------|---------------|-------------------|----------|
| **URL Scheme** | RCTURLRequestHandler protocol | UriHandler interface | Custom schemes (myapp://) |
| **Request Body** | RCTNetworkingRequestHandler | RequestBodyHandler | Custom data formats |
| **Response Body** | RCTNetworkingResponseHandler | ResponseHandler | Custom response parsing |
| **Network Config** | NSURLSessionConfiguration provider | CustomClientBuilder | SSL pinning, timeouts |
| **Middleware** | NSURLProtocol subclass | OkHttp Interceptor | Request/response transformation |
| **JS Interception** | XMLHttpRequest.__setInterceptor | Same | Read-only monitoring |

---

## Performance Considerations

### 1. Incremental Updates

**When to use:**
- Large file downloads/uploads
- Streaming responses
- Progress indicators

**Cost:**
- Each chunk triggers bridge event
- Higher memory usage for buffering
- More complex state management

**Recommendation:** Only enable for requests with progress listeners attached.

### 2. Response Type Optimization

**Base64 vs Text:**
- `text`: Direct string transfer (efficient)
- `base64`: Encoding overhead (~33% larger)
- Use `text` for JSON/text responses
- Use `base64` only for binary data

### 3. Request Tracking

**Performance Logging:**
```typescript
const xhr = new XMLHttpRequest();
xhr.setTrackingName('UserProfileAPI'); // Groups in profiler
xhr.setPerformanceLogger(customLogger);
```

**Benefits:**
- Chrome DevTools timeline integration
- requestId-based correlation
- GlobalPerformanceLogger integration

### 4. Bridge Traffic Reduction

**Avoid:**
- Incremental updates for small responses
- Excessive header logging
- Redundant event emissions

**Optimize:**
- Batch events where possible
- Filter URLs before logging (Metro bundler, assets)
- Use direct event listeners instead of polling

---

## Critical Insights for rn-buoy

### 1. Why Query Parameters Get Lost

**Root Cause:** The UI re-parses URLs with `new URL()` instead of using already-parsed params.

**Solution:** Use the `event.query` field directly:
```typescript
// Instead of:
const urlObj = new URL(event.url);
const params = Object.fromEntries(urlObj.searchParams);

// Do:
const params = event.query ?
  Object.fromEntries(new URLSearchParams(event.query)) :
  null;
```

### 2. Swizzling Best Practices

**Current Implementation Issues:**
- ✅ FIXED: `this` context in fetch wrapper
- ✅ FIXED: Event handler replacement (now uses addEventListener)
- ⚠️ Edge case: Request objects not fully handled
- ⚠️ Edge case: FormData parsing incomplete

**Recommended Approach:**
```typescript
// For fetch
const originalFetch = globalThis.fetch.bind(globalThis);

// For XHR, use addEventListener instead of replacing handlers
xhr.addEventListener('load', handler); // ✅ Correct
xhr.onload = handler; // ❌ Breaks React Native EventTarget
```

### 3. Alternative: Use XHR Interceptor

**Simpler, safer approach for read-only monitoring:**
```typescript
XMLHttpRequest.__setInterceptor_DO_NOT_USE({
  requestSent(id, url, method, headers) {
    const { url: cleanUrl, params } = parseUrl(url);
    emit({ type: 'request', url: cleanUrl, params, ... });
  },

  responseReceived(id, url, status, headers) {
    const { url: cleanUrl, params } = parseUrl(url);
    emit({ type: 'response', url: cleanUrl, params, status, headers });
  },

  dataReceived(id, data) {
    // Response body
  },

  loadingFinished(id, encodedDataLength) {
    // Complete
  },

  loadingFailed(id, error) {
    // Error
  }
});
```

**Pros:**
- No risk of breaking XHR functionality
- Official (though undocumented) mechanism
- Used by React Native DevTools (proven reliability)
- Captures ALL requests (fetch + direct XHR)

**Cons:**
- Read-only (can't modify requests)
- Only one interceptor globally
- Can't access request body easily
- May conflict with debugger

---

## Conclusion

React Native's networking is a sophisticated multi-layer system with numerous extensibility points. The key to successful interception is choosing the right layer:

- **JavaScript XHR Interceptor**: Best for read-only monitoring
- **Global swizzling**: Best for full control (with care)
- **Native handlers**: Best for custom protocols/schemes
- **OkHttp/NSURLSession**: Best for low-level networking (SSL, certs)

For rn-buoy's use case (DevTools network monitoring), the **XHR Interceptor** approach is recommended as a safer alternative to method swizzling, with the current swizzling approach as a fallback for request body capture.
