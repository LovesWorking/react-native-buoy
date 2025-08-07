/**
 * Network interceptor for capturing XMLHttpRequest and fetch API calls
 */

import { networkEventStore } from './networkEventStore';
import type { NetworkEvent } from '../types';

class NetworkInterceptor {
  private isEnabled = false;
  private requestCounter = 0;
  
  // Store original methods
  private originalXHROpen?: typeof XMLHttpRequest.prototype.open;
  private originalXHRSend?: typeof XMLHttpRequest.prototype.send;
  private originalXHRSetRequestHeader?: typeof XMLHttpRequest.prototype.setRequestHeader;
  private originalFetch?: typeof global.fetch;

  /**
   * Enable network interception
   */
  enable(): void {
    if (this.isEnabled) return;
    
    this.interceptXHR();
    this.interceptFetch();
    this.isEnabled = true;
  }

  /**
   * Disable network interception
   */
  disable(): void {
    if (!this.isEnabled) return;
    
    this.restoreXHR();
    this.restoreFetch();
    this.isEnabled = false;
  }

  /**
   * Intercept XMLHttpRequest
   */
  private interceptXHR(): void {
    const self = this;
    
    // Store originals
    this.originalXHROpen = XMLHttpRequest.prototype.open;
    this.originalXHRSend = XMLHttpRequest.prototype.send;
    this.originalXHRSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;

    // Override open
    XMLHttpRequest.prototype.open = function(
      method: string,
      url: string | URL,
      async?: boolean,
      username?: string | null,
      password?: string | null
    ) {
      const urlString = url.toString();
      const requestId = `xhr_${++self.requestCounter}_${Date.now()}`;
      
      // Parse URL
      let host = '';
      let path = '';
      let query = '';
      try {
        const urlObj = new URL(urlString, typeof window !== 'undefined' ? window.location.href : undefined);
        host = urlObj.hostname;
        path = urlObj.pathname;
        query = urlObj.search;
      } catch {
        // Relative URL or invalid URL
        path = urlString;
      }

      // Store request info on XHR instance
      (this as any).__networkEvent = {
        id: requestId,
        method: method.toUpperCase(),
        url: urlString,
        host,
        path,
        query,
        timestamp: Date.now(),
        requestHeaders: {},
        responseHeaders: {},
      } as Partial<NetworkEvent>;

      // Call original
      return self.originalXHROpen!.apply(this, arguments as any);
    };

    // Override setRequestHeader
    XMLHttpRequest.prototype.setRequestHeader = function(header: string, value: string) {
      const networkEvent = (this as any).__networkEvent;
      if (networkEvent) {
        networkEvent.requestHeaders[header] = value;
      }
      
      return self.originalXHRSetRequestHeader!.apply(this, arguments as any);
    };

    // Override send
    XMLHttpRequest.prototype.send = function(data?: Document | XMLHttpRequestBodyInit | null) {
      const networkEvent = (this as any).__networkEvent as Partial<NetworkEvent>;
      
      if (networkEvent) {
        // Store request data and size
        if (data) {
          networkEvent.requestData = this.parseRequestData(data);
          networkEvent.requestSize = this.getDataSize(data);
        }
        
        // Add initial event
        networkEventStore.addEvent(networkEvent as Omit<NetworkEvent, 'id'>);
        
        // Add event listeners
        this.addEventListener('readystatechange', () => {
          if (this.readyState === XMLHttpRequest.HEADERS_RECEIVED) {
            // Parse response headers
            const headerString = this.getAllResponseHeaders();
            const headers: Record<string, string> = {};
            if (headerString) {
              headerString.split('\r\n').forEach(line => {
                const [key, value] = line.split(': ');
                if (key && value) {
                  headers[key.toLowerCase()] = value;
                }
              });
            }
            networkEvent.responseHeaders = headers;
          }
          
          if (this.readyState === XMLHttpRequest.DONE) {
            // Update event with response
            const updates: Partial<NetworkEvent> = {
              status: this.status,
              statusText: this.statusText,
              duration: Date.now() - networkEvent.timestamp!,
              responseHeaders: networkEvent.responseHeaders,
            };
            
            // Handle response data
            try {
              if (this.responseType === 'json' || 
                  (this.response && typeof this.response === 'object')) {
                updates.responseData = this.response;
              } else if (this.responseText) {
                try {
                  updates.responseData = JSON.parse(this.responseText);
                } catch {
                  updates.responseData = this.responseText;
                }
              }
              
              // Calculate response size
              if (this.responseText) {
                updates.responseSize = new Blob([this.responseText]).size;
              }
              
              // Get response type from Content-Type header
              updates.responseType = networkEvent.responseHeaders?.['content-type'];
            } catch (error) {
              updates.error = error instanceof Error ? error.message : 'Unknown error';
            }

            networkEventStore.updateEvent(networkEvent.id!, updates);
          }
        });

        // Handle errors
        this.addEventListener('error', () => {
          networkEventStore.updateEvent(networkEvent.id!, {
            error: 'Network error',
            duration: Date.now() - networkEvent.timestamp!,
          });
        });

        // Handle timeout
        this.addEventListener('timeout', () => {
          networkEventStore.updateEvent(networkEvent.id!, {
            error: 'Request timeout',
            duration: Date.now() - networkEvent.timestamp!,
          });
        });

        // Handle abort
        this.addEventListener('abort', () => {
          networkEventStore.updateEvent(networkEvent.id!, {
            error: 'Request aborted',
            duration: Date.now() - networkEvent.timestamp!,
          });
        });
      }

      // Call original send
      return self.originalXHRSend!.apply(this, arguments as any);
    };
  }

  /**
   * Intercept fetch API
   */
  private interceptFetch(): void {
    const self = this;
    this.originalFetch = global.fetch;

    global.fetch = async function(
      input: RequestInfo | URL,
      init?: RequestInit
    ): Promise<Response> {
      const requestId = `fetch_${++self.requestCounter}_${Date.now()}`;
      const timestamp = Date.now();
      
      // Parse URL
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      let host = '';
      let path = '';
      let query = '';
      
      try {
        const urlObj = new URL(url, typeof window !== 'undefined' ? window.location.href : undefined);
        host = urlObj.hostname;
        path = urlObj.pathname;
        query = urlObj.search;
      } catch {
        path = url;
      }

      // Create network event
      const networkEvent: Partial<NetworkEvent> = {
        id: requestId,
        method: (init?.method || 'GET').toUpperCase(),
        url,
        host,
        path,
        query,
        timestamp,
        requestHeaders: init?.headers as Record<string, string> || {},
        responseHeaders: {},
      };

      // Store request data
      if (init?.body) {
        networkEvent.requestData = self.parseRequestData(init.body);
        networkEvent.requestSize = self.getDataSize(init.body);
      }

      // Add initial event
      networkEventStore.addEvent(networkEvent as Omit<NetworkEvent, 'id'>);

      try {
        // Make the actual request
        const response = await self.originalFetch!(input, init);
        
        // Clone response to read it without consuming
        const clonedResponse = response.clone();
        
        // Parse response headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key.toLowerCase()] = value;
        });

        // Try to get response data
        let responseData;
        let responseSize = 0;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const text = await clonedResponse.text();
            responseData = JSON.parse(text);
            responseSize = new Blob([text]).size;
          } else if (contentType?.includes('text')) {
            responseData = await clonedResponse.text();
            responseSize = new Blob([responseData]).size;
          } else {
            // For other types, just get the size
            const blob = await clonedResponse.blob();
            responseSize = blob.size;
          }
        } catch {
          // Couldn't parse response
        }

        // Update event with response
        networkEventStore.updateEvent(requestId, {
          status: response.status,
          statusText: response.statusText,
          responseHeaders,
          responseData,
          responseSize,
          responseType: response.headers.get('content-type') || undefined,
          duration: Date.now() - timestamp,
        });

        return response;
      } catch (error) {
        // Update event with error
        networkEventStore.updateEvent(requestId, {
          error: error instanceof Error ? error.message : 'Network error',
          duration: Date.now() - timestamp,
        });
        
        throw error;
      }
    };
  }

  /**
   * Restore original XMLHttpRequest
   */
  private restoreXHR(): void {
    if (this.originalXHROpen) {
      XMLHttpRequest.prototype.open = this.originalXHROpen;
    }
    if (this.originalXHRSend) {
      XMLHttpRequest.prototype.send = this.originalXHRSend;
    }
    if (this.originalXHRSetRequestHeader) {
      XMLHttpRequest.prototype.setRequestHeader = this.originalXHRSetRequestHeader;
    }
  }

  /**
   * Restore original fetch
   */
  private restoreFetch(): void {
    if (this.originalFetch) {
      global.fetch = this.originalFetch;
    }
  }

  /**
   * Parse request data to a serializable format
   */
  private parseRequestData(data: any): any {
    if (!data) return undefined;
    
    if (typeof data === 'string') {
      try {
        return JSON.parse(data);
      } catch {
        return data;
      }
    }
    
    if (data instanceof FormData) {
      const formDataObj: Record<string, any> = {};
      data.forEach((value, key) => {
        formDataObj[key] = value;
      });
      return formDataObj;
    }
    
    if (data instanceof Blob) {
      return `[Blob: ${data.size} bytes, type: ${data.type}]`;
    }
    
    if (data instanceof ArrayBuffer) {
      return `[ArrayBuffer: ${data.byteLength} bytes]`;
    }
    
    return data;
  }

  /**
   * Get size of request/response data
   */
  private getDataSize(data: any): number {
    if (!data) return 0;
    
    if (typeof data === 'string') {
      return new Blob([data]).size;
    }
    
    if (data instanceof Blob) {
      return data.size;
    }
    
    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }
    
    if (data instanceof FormData) {
      // Estimate FormData size
      let size = 0;
      data.forEach((value) => {
        if (typeof value === 'string') {
          size += new Blob([value]).size;
        } else if (value instanceof Blob) {
          size += value.size;
        }
      });
      return size;
    }
    
    // For objects, stringify and measure
    try {
      return new Blob([JSON.stringify(data)]).size;
    } catch {
      return 0;
    }
  }
}

// Export singleton instance
export const networkInterceptor = new NetworkInterceptor();