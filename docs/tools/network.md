---
title: Network Monitor
id: tools-network
---

The Network Monitor intercepts and displays all HTTP traffic in your React Native app with zero configuration.

**Supported HTTP Clients:**
- `fetch` API
- `XMLHttpRequest` (Axios, and other XHR-based libraries)
- **GraphQL** — with operation name extraction and variable display
- **gRPC-web**

**GraphQL requests** get special treatment: operation names are extracted from queries/mutations/subscriptions and displayed with variables using arrow notation (e.g., `GetUser › 123`), making it easy to identify requests even when all traffic goes to `/graphql`.

## Installation

<!-- ::PM npm="npm install @react-buoy/network" yarn="yarn add @react-buoy/network" pnpm="pnpm add @react-buoy/network" bun="bun add @react-buoy/network" -->

After installation, the Network Monitor will be auto-detected and appear in your FloatingDevTools menu.

## Custom Configuration

For more control, use `createNetworkTool` to customize the tool:

```tsx
import { createNetworkTool } from "@react-buoy/network";

const networkTool = createNetworkTool({
  name: "REQUESTS",
  description: "API request logger",
  enableSharedModalDimensions: true,
});
```

## `createNetworkTool` Options

```typescript
createNetworkTool({
  name?: string;                    // default: "NET"
  description?: string;             // default: "Network request logger"
  id?: string;                      // default: "network"
  enableSharedModalDimensions?: boolean;
});
```

## Features

- **Automatic Interception** - Monitors both `fetch` and `XMLHttpRequest` (Axios, etc.)
- **Smart Filtering** - Auto-ignores Metro bundler, debugger, and dev server traffic
- **Request Details** - URL, method, headers, body, query params
- **Response Details** - Status, headers, body (with JSON parsing)
- **Timing** - Request duration in milliseconds
- **Client Detection** - Identifies fetch, axios, graphql, grpc-web requests
- **Large Response Handling** - Truncates responses over 1MB to prevent memory issues

## Request Information

For each captured request, you can view:

| Field | Description |
|-------|-------------|
| URL | Full request URL (query params extracted separately) |
| Method | GET, POST, PUT, DELETE, PATCH, etc. |
| Status | Response status code with color coding |
| Duration | Time from request to response |
| Headers | Request and response headers |
| Body | Request payload and response data (auto-parsed JSON) |
| Query Params | Extracted and displayed separately |
| Client | The HTTP client used (fetch, axios, etc.) |

## Automatic Filtering

The following URLs are automatically ignored to reduce noise:

- Metro bundler (`localhost:8081`)
- Symbolication requests
- Debugger proxy
- React Native dev server traffic

## Status Color Coding

- **Green (2xx)** - Successful responses
- **Yellow (3xx)** - Redirects
- **Red (4xx/5xx)** - Client and server errors
