import axios, { AxiosRequestConfig } from "axios";

export type RequestMethod = "fetch" | "axios";

interface RequestConfig {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  data?: unknown;
}

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * Unified API client that supports both fetch and axios
 *
 * This abstraction allows seamless switching between fetch and axios
 * for testing the network dev tools interception capabilities.
 *
 * @param config - Request configuration (url, method, headers, data)
 * @param requestMethod - The HTTP client to use ('fetch' or 'axios')
 * @returns Promise with standardized response format
 */
export const makeRequest = async <T = unknown>(
  config: RequestConfig,
  requestMethod: RequestMethod
): Promise<ApiResponse<T>> => {
  const { url, method = "GET", headers = {}, data } = config;

  if (requestMethod === "fetch") {
    // Fetch implementation
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();

    // Parse response headers into object
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      data: responseData as T,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    };
  } else {
    // Axios implementation (uses XHR under the hood in React Native)
    const axiosConfig: AxiosRequestConfig = {
      url,
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      data,
    };

    const response = await axios(axiosConfig);

    return {
      data: response.data as T,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  }
};

/**
 * Convenience method for GET requests
 */
export const get = <T = unknown>(
  url: string,
  requestMethod: RequestMethod,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  return makeRequest<T>({ url, method: "GET", headers }, requestMethod);
};

/**
 * Convenience method for POST requests
 */
export const post = <T = unknown>(
  url: string,
  data: unknown,
  requestMethod: RequestMethod,
  headers?: Record<string, string>
): Promise<ApiResponse<T>> => {
  return makeRequest<T>({ url, method: "POST", headers, data }, requestMethod);
};
