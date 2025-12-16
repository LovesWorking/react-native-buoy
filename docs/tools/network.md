---
title: Network Monitor
id: tools-network
---

The Network Monitor tool intercepts and displays all network requests made by your app.

## Installation

```bash
npm install @react-buoy/network
```

## Features

- View all HTTP requests and responses
- Filter by URL, method, or status
- Inspect request headers and body
- View response data
- Copy cURL commands

## Usage

The tool automatically intercepts `fetch` requests. No additional setup required.

```tsx
import "@react-buoy/network"; // Import to enable interception

// Your fetch calls are now monitored
fetch("https://api.example.com/users")
  .then(res => res.json());
```

## Request Details

For each request, you can view:

- **URL**: Full request URL
- **Method**: GET, POST, PUT, DELETE, etc.
- **Status**: Response status code
- **Duration**: Time taken for request
- **Headers**: Request and response headers
- **Body**: Request payload and response data

## Filtering

Filter requests by:
- URL pattern
- HTTP method
- Status code range (2xx, 4xx, 5xx)

## Export

Export requests as:
- cURL command
- JSON
- HAR format
