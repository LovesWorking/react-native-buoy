import { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConsoleTransportEntry } from "../../../_shared/logger/types";
import { DataViewer } from "../../react-query/components/shared/DataViewer";
import {
  getLevelDotStyle,
  getLevelTextColor,
  getTypeColor,
  getTypeIcon,
} from "../../log-dump/utils";
import { 
  Clock, 
  AlertCircle, 
  CheckCircle,
  Copy,
  Edit3,
  Info,
  ChevronDown,
  ChevronUp,
  Globe,
  Lock,
  Unlock,
  Server,
  Smartphone,
  Layers,
  Navigation,
  TouchpadIcon,
  Zap,
} from "lucide-react-native";
import { 
  extractHttpDataFromSentryEvent, 
  HttpRequestInfo,
  SentryEvent,
  HttpSpanAttributes,
  SentryEventInsight 
} from "../types";
import {
  formatDuration,
  formatBytes,
  parseUrl,
  formatHttpStatus,
  truncateMiddle,
  formatRelativeTime as formatTime,
} from "../utils/formatting";
import {
  formatEventMessage,
  extractTouchEventDetails,
  extractNavigationEventDetails,
  extractErrorEventDetails,
  extractPerformanceEventDetails,
  extractDeviceContext,
  extractComponentFileFromPath,
} from "../utils/eventParsers";

// Stable constants
const MAX_EXPLORER_DEPTH = 15;

// Tab types for the toggle
type TabType = "details" | "insights" | "rawData" | "deviceContext";

// Extended JsonValue type to handle Sentry event data
type SentryJsonValue =
  | string
  | number
  | boolean
  | null
  | SentryJsonValue[]
  | { [key: string]: SentryJsonValue }
  | Date
  | Error
  | undefined
  | symbol
  | bigint;

interface SentryEventDetailViewProps {
  entry: ConsoleTransportEntry;
  _onBack: () => void;
}

// Component for displaying URL breakdown
const UrlBreakdown: React.FC<{ url: string }> = ({ url }) => {
  const urlParts = parseUrl(url);
  
  if (!urlParts) {
    return <Text style={styles.urlText}>{url}</Text>;
  }
  
  const handleCopy = (text: string) => {
    // TODO: Implement clipboard functionality
    // Clipboard functionality temporarily disabled due to deprecated API
    console.log('Copy to clipboard:', text);
  };
  
  return (
    <View style={styles.urlBreakdown}>
      <View style={styles.urlRow}>
        {urlParts.isSecure ? (
          <Lock size={12} color="#10B981" />
        ) : (
          <Unlock size={12} color="#F59E0B" />
        )}
        <Text style={styles.urlDomain}>{urlParts.host}</Text>
        <Text style={styles.urlProtocol}>({urlParts.protocol.toUpperCase()})</Text>
        <TouchableOpacity
          sentry-label="ignore url copy button"
          onPress={() => handleCopy(url)}
          style={styles.copyButton}
        >
          <Copy size={12} color="#6B7280" />
        </TouchableOpacity>
      </View>
      <View style={styles.urlPathRow}>
        <Text style={styles.urlPath}>{urlParts.pathname}</Text>
      </View>
      {urlParts.params && (
        <View style={styles.urlParams}>
          <Text style={styles.urlParamsTitle}>Query Parameters:</Text>
          {Object.entries(urlParts.params).map(([key, value]) => (
            <Text key={key} style={styles.urlParam}>
              {key}: {value}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

// Component for collapsible sections
const CollapsibleSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <View style={styles.collapsibleSection}>
      <TouchableOpacity
        sentry-label="ignore collapsible section"
        style={styles.collapsibleHeader}
        onPress={() => setIsOpen(!isOpen)}
      >
        <View style={styles.collapsibleTitle}>
          {icon}
          <Text style={styles.collapsibleTitleText}>{title}</Text>
        </View>
        {isOpen ? (
          <ChevronUp size={16} color="#9CA3AF" />
        ) : (
          <ChevronDown size={16} color="#9CA3AF" />
        )}
      </TouchableOpacity>
      {isOpen && <View style={styles.collapsibleContent}>{children}</View>}
    </View>
  );
};

// Component for editable field indicator
const EditableIndicator: React.FC<{ field: string; editable: boolean }> = ({ field, editable }) => (
  <View style={styles.fieldIndicator}>
    <Text style={styles.fieldName}>{field}</Text>
    {editable ? (
      <View style={styles.editableTag}>
        <Edit3 size={10} color="#8B5CF6" />
        <Text style={styles.editableText}>Editable</Text>
      </View>
    ) : (
      <View style={styles.autoTag}>
        <Info size={10} color="#6B7280" />
        <Text style={styles.autoText}>Auto</Text>
      </View>
    )}
  </View>
);

// Enhanced HTTP request display
const HttpRequestDetails: React.FC<{ request: HttpRequestInfo }> = ({ request }) => {
  const status = formatHttpStatus(request.statusCode);
  
  return (
    <View style={styles.httpRequestCard}>
      <View style={styles.httpHeader}>
        <View style={styles.httpMethodBadge}>
          <Text style={styles.httpMethod}>{request.method}</Text>
        </View>
        {request.statusCode && (
          <View style={[styles.httpStatusBadge, { backgroundColor: `${status.color}20` }]}>
            <Text style={[styles.httpStatusText, { color: status.color }]}>
              {status.text} {status.meaning}
            </Text>
          </View>
        )}
        {request.duration && (
          <View style={styles.httpDuration}>
            <Clock size={10} color="#6B7280" />
            <Text style={styles.httpDurationText}>{formatDuration(request.duration)}</Text>
          </View>
        )}
      </View>
      
      <UrlBreakdown url={request.url} />
      
      {(request.requestSize || request.responseSize) && (
        <View style={styles.httpSizes}>
          {request.requestSize !== undefined && (
            <View style={styles.sizeItem}>
              <Text style={styles.sizeLabel}>Request:</Text>
              <Text style={styles.sizeValue}>↑ {formatBytes(request.requestSize)}</Text>
            </View>
          )}
          {request.responseSize !== undefined && (
            <View style={styles.sizeItem}>
              <Text style={styles.sizeLabel}>Response:</Text>
              <Text style={styles.sizeValue}>↓ {formatBytes(request.responseSize)}</Text>
            </View>
          )}
        </View>
      )}
      
      <View style={styles.customizableNote}>
        <EditableIndicator field="beforeBreadcrumb" editable={true} />
        <Text style={styles.customizableText}>
          Modify via beforeBreadcrumb hook
        </Text>
      </View>
    </View>
  );
};

// Extract all HTTP requests from the event
const extractAllHttpRequests = (entry: ConsoleTransportEntry): HttpRequestInfo[] => {
  const requests: HttpRequestInfo[] = [];
  const { metadata } = entry;
  
  // First try the main extraction
  const mainRequest = extractHttpDataFromSentryEvent(entry);
  if (mainRequest) {
    requests.push(mainRequest);
  }
  
  // Check raw data for additional HTTP info
  const rawData = metadata._sentryRawData as SentryEvent | undefined;
  
  // Extract from breadcrumbs
  if (rawData?.breadcrumbs) {
    for (const breadcrumb of rawData.breadcrumbs) {
      if (breadcrumb.category === 'xhr' || breadcrumb.category === 'fetch' || breadcrumb.category === 'http') {
        const data = breadcrumb.data || {};
        const httpInfo: HttpRequestInfo = {
          method: data.method || 'GET',
          url: data.url || '',
          statusCode: data.status_code,
          duration: data.duration,
          requestSize: data.request_body_size,
          responseSize: data.response_body_size,
          error: (data.status_code || 0) >= 400,
          errorMessage: (data.status_code || 0) >= 400 ? breadcrumb.message : undefined,
          timestamp: breadcrumb.timestamp ? breadcrumb.timestamp * 1000 : entry.timestamp
        };
        
        // Avoid duplicates
        if (!requests.some(r => r.url === httpInfo.url && r.method === httpInfo.method && Math.abs(r.timestamp - httpInfo.timestamp) < 100)) {
          requests.push(httpInfo);
        }
      }
    }
  }
  
  // Extract from spans
  if (rawData?.spans) {
    for (const span of rawData.spans) {
      if (span.op === 'http.client' || span.op === 'http' || span.op?.startsWith('http.')) {
        const attrs = span.data as HttpSpanAttributes;
        const statusCode = attrs['http.response.status_code'] || attrs['http.status_code'];
        const method = attrs['http.request.method'] || attrs['http.method'] || 'GET';
        const url = attrs['url.full'] || attrs['http.url'] || span.description || '';
        
        if (url) {
          const httpInfo: HttpRequestInfo = {
            method,
            url,
            statusCode,
            duration: span.timestamp && span.start_timestamp ? (span.timestamp - span.start_timestamp) * 1000 : undefined,
            requestSize: attrs['http.request_content_length'],
            responseSize: attrs['http.response_content_length'],
            error: statusCode ? statusCode >= 400 : false,
            errorMessage: statusCode && statusCode >= 400 ? `HTTP ${statusCode}` : undefined,
            timestamp: span.start_timestamp ? span.start_timestamp * 1000 : entry.timestamp,
            query: attrs['http.query'],
            fragment: attrs['http.fragment']
          };
          
          // Avoid duplicates
          if (!requests.some(r => r.url === httpInfo.url && r.method === httpInfo.method && Math.abs(r.timestamp - httpInfo.timestamp) < 100)) {
            requests.push(httpInfo);
          }
        }
      }
    }
  }
  
  return requests;
};

// Enhanced insights generator
const generateInsights = (entry: ConsoleTransportEntry): SentryEventInsight[] => {
  const insights: SentryEventInsight[] = [];
  const { metadata } = entry;
  const httpRequests = extractAllHttpRequests(entry);
  const rawData = metadata._sentryRawData as SentryEvent | undefined;
  
  // Error insights
  if (entry.level === "error") {
    const errorDetails = extractErrorEventDetails(entry);
    
    if (errorDetails?.stackTrace?.includes("AsyncStorage")) {
      insights.push({
        type: 'error',
        severity: 'medium',
        message: "Storage-related error detected",
        details: "Error occurred in AsyncStorage operations",
        suggestion: "Check if storage is available and has sufficient space. Consider implementing error boundaries for storage operations."
      });
    }
    
    if (errorDetails?.message?.includes("Network")) {
      insights.push({
        type: 'error',
        severity: 'high',
        message: "Network error detected",
        details: "Network request failed or timed out",
        suggestion: "Implement retry logic with exponential backoff. Consider offline support."
      });
    }
    
    if (!errorDetails?.handled) {
      insights.push({
        type: 'error',
        severity: 'high',
        message: "Unhandled error",
        details: "This error was not caught by any error boundary",
        suggestion: "Add error boundaries to catch and handle errors gracefully"
      });
    }
  }
  
  // HTTP insights
  for (const request of httpRequests) {
    // Performance insights
    if (request.duration && request.duration > 3000) {
      insights.push({
        type: 'performance',
        severity: 'high',
        message: `Slow HTTP request (${formatDuration(request.duration)})`,
        details: `${request.method} ${request.url}`,
        suggestion: "Consider implementing request caching, pagination, or optimizing the endpoint"
      });
    } else if (request.duration && request.duration > 1000) {
      insights.push({
        type: 'performance',
        severity: 'medium',
        message: `Moderately slow request (${formatDuration(request.duration)})`,
        details: `${request.method} ${request.url}`,
        suggestion: "Monitor this endpoint for performance degradation"
      });
    }
    
    // Status code insights
    if (request.statusCode) {
      if (request.statusCode >= 500) {
        insights.push({
          type: 'error',
          severity: 'high',
          message: `Server error: HTTP ${request.statusCode}`,
          details: `${request.method} ${request.url}`,
          suggestion: "Check server logs. Implement circuit breaker pattern for repeated failures."
        });
      } else if (request.statusCode === 401) {
        insights.push({
          type: 'security',
          severity: 'high',
          message: "Authentication failed",
          details: `${request.method} ${request.url}`,
          suggestion: "Implement token refresh logic. Check if auth tokens are properly stored and sent."
        });
      } else if (request.statusCode === 429) {
        insights.push({
          type: 'quality',
          severity: 'high',
          message: "Rate limit exceeded",
          details: `${request.method} ${request.url}`,
          suggestion: "Implement request throttling and queueing. Consider caching responses."
        });
      }
    }
    
    // Response size insights
    if (request.responseSize && request.responseSize > 1024 * 1024) { // > 1MB
      insights.push({
        type: 'performance',
        severity: 'medium',
        message: `Large response (${formatBytes(request.responseSize)})`,
        details: `${request.method} ${request.url}`,
        suggestion: "Implement pagination, lazy loading, or request data compression"
      });
    }
  }
  
  // Missing data insights
  if (httpRequests.length > 0) {
    const hasHeaders = httpRequests.some(r => r.headers);
    if (!hasHeaders) {
      insights.push({
        type: 'quality',
        severity: 'low',
        message: "HTTP headers not captured",
        details: "Request/response headers could provide valuable debugging info",
        suggestion: "Enable header capture in Sentry SDK configuration for better debugging"
      });
    }
  }
  
  // User context insight
  if (!rawData?.user) {
    insights.push({
      type: 'quality',
      severity: 'medium',
      message: "No user context",
      details: "User information not attached to event",
      suggestion: "Call Sentry.setUser() to correlate errors with users"
    });
  }
  
  // Touch event insights
  const touchDetails = extractTouchEventDetails(entry);
  if (touchDetails && (!touchDetails.componentPath[0]?.label && !touchDetails.componentPath[0]?.file)) {
    insights.push({
      type: 'quality',
      severity: 'low',
      message: "Touch events lack component labels",
      details: "Components don't have sentry-label attributes",
      suggestion: "Add sentry-label props to key interactive components for better tracking"
    });
  }
  
  // Performance insights
  const perfDetails = extractPerformanceEventDetails(entry);
  if (perfDetails?.appStart && perfDetails.appStart.duration > 3000) {
    insights.push({
      type: 'performance',
      severity: 'high',
      message: `Slow app start (${formatDuration(perfDetails.appStart.duration)})`,
      details: `${perfDetails.appStart.type} start took longer than 3 seconds`,
      suggestion: "Optimize app initialization, lazy load modules, reduce bundle size"
    });
  }
  
  return insights;
};

/**
 * Enhanced detail view for individual Sentry events
 */
export function SentryEventDetailView({
  entry,
  _onBack: _unusedOnBack,
}: SentryEventDetailViewProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>("details");

  // Filter out Sentry-specific metadata (eventData currently unused but may be used in future)
  const { _sentryRawData, ..._eventData } = entry.metadata;

  // Extract data
  const httpRequests = extractAllHttpRequests(entry);
  const insights = generateInsights(entry);
  const deviceContext = extractDeviceContext(entry);
  
  // Extract event-specific details
  const touchDetails = extractTouchEventDetails(entry);
  const navDetails = extractNavigationEventDetails(entry);
  const errorDetails = extractErrorEventDetails(entry);
  const perfDetails = extractPerformanceEventDetails(entry);

  const IconComponent = getTypeIcon(entry.type);
  const typeColor = getTypeColor(entry.type);

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "details":
        return (
          <ScrollView
            sentry-label="ignore details scroll"
            style={styles.detailsContainer}
          >
            {/* HTTP Requests */}
            {httpRequests.length > 0 && (
              <CollapsibleSection
                title={`HTTP Requests (${httpRequests.length})`}
                icon={<Globe size={14} color="#8B5CF6" />}
                defaultOpen={true}
              >
                {httpRequests.map((request, index) => (
                  <HttpRequestDetails key={index} request={request} />
                ))}
              </CollapsibleSection>
            )}
            
            {/* Touch Event Details */}
            {touchDetails && (
              <CollapsibleSection
                title="Touch Event"
                icon={<TouchpadIcon size={14} color="#8B5CF6" />}
                defaultOpen={true}
              >
                <View style={styles.touchDetails}>
                  {/* Display the touch event message (e.g., "Sign In") */}
                  <Text style={styles.detailLabel}>Action:</Text>
                  <Text style={styles.touchActionText}>{formatEventMessage(entry)}</Text>
                  
                  <Text style={styles.detailLabel}>Component Path:</Text>
                  {(() => {
                    const componentFile = extractComponentFileFromPath(touchDetails.componentPath);
                    if (componentFile) {
                      return (
                        <View style={styles.componentPathItem}>
                          <Text style={styles.componentName}>{componentFile}</Text>
                        </View>
                      );
                    }
                    // Fallback to showing full path if extraction fails
                    return touchDetails.componentPath.map((comp, idx) => (
                      <View key={idx} style={styles.componentPathItem}>
                        <Text style={styles.componentName}>{comp.name}</Text>
                        {comp.label && <Text style={styles.componentLabel}> ({comp.label})</Text>}
                        {comp.file && (
                          <Text style={styles.componentFile}>{truncateMiddle(comp.file, 40)}</Text>
                        )}
                      </View>
                    ));
                  })()}
                  {touchDetails.route && (
                    <>
                      <Text style={styles.detailLabel}>Route:</Text>
                      <Text style={styles.detailValue}>{touchDetails.route}</Text>
                    </>
                  )}
                  <View style={styles.customizableNote}>
                    <EditableIndicator field="labelName prop" editable={true} />
                    <EditableIndicator field="ignoreNames filter" editable={true} />
                  </View>
                </View>
              </CollapsibleSection>
            )}
            
            {/* Navigation Details */}
            {navDetails && (
              <CollapsibleSection
                title="Navigation Event"
                icon={<Navigation size={14} color="#8B5CF6" />}
                defaultOpen={true}
              >
                <View style={styles.navDetails}>
                  {navDetails.from && (
                    <>
                      <Text style={styles.detailLabel}>From:</Text>
                      <Text style={styles.detailValue}>{navDetails.from}</Text>
                    </>
                  )}
                  <Text style={styles.detailLabel}>To:</Text>
                  <Text style={styles.detailValue}>{navDetails.to}</Text>
                  {navDetails.duration && (
                    <>
                      <Text style={styles.detailLabel}>Duration:</Text>
                      <Text style={styles.detailValue}>{formatDuration(navDetails.duration)}</Text>
                    </>
                  )}
                  {navDetails.ttid && (
                    <>
                      <Text style={styles.detailLabel}>Time to Initial Display:</Text>
                      <Text style={styles.detailValue}>{formatDuration(navDetails.ttid)}</Text>
                    </>
                  )}
                  <View style={styles.customizableNote}>
                    <EditableIndicator field="Route names" editable={true} />
                    <Text style={styles.customizableText}>
                      Customize route names in navigation integration
                    </Text>
                  </View>
                </View>
              </CollapsibleSection>
            )}
            
            {/* Error Details */}
            {errorDetails && (
              <CollapsibleSection
                title="Error Details"
                icon={<AlertCircle size={14} color="#EF4444" />}
                defaultOpen={true}
              >
                <View style={styles.errorDetails}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.errorType}>{errorDetails.type}</Text>
                  
                  <Text style={styles.detailLabel}>Message:</Text>
                  <Text style={styles.errorMessage}>{errorDetails.message}</Text>
                  
                  {errorDetails.fileName && (
                    <>
                      <Text style={styles.detailLabel}>Location:</Text>
                      <Text style={styles.errorLocation}>
                        {errorDetails.fileName}:{errorDetails.lineNumber}:{errorDetails.columnNumber}
                      </Text>
                    </>
                  )}
                  
                  <View style={styles.errorMeta}>
                    <View style={styles.errorMetaItem}>
                      <Text style={styles.errorMetaLabel}>Handled:</Text>
                      <Text style={[styles.errorMetaValue, errorDetails.handled ? styles.success : styles.error]}>
                        {errorDetails.handled ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    {errorDetails.mechanism && (
                      <View style={styles.errorMetaItem}>
                        <Text style={styles.errorMetaLabel}>Mechanism:</Text>
                        <Text style={styles.errorMetaValue}>{errorDetails.mechanism}</Text>
                      </View>
                    )}
                  </View>
                  
                  {errorDetails.stackTrace && (
                    <View style={styles.stackTraceContainer}>
                      <Text style={styles.detailLabel}>Stack Trace:</Text>
                      <ScrollView
                        sentry-label="ignore stack trace scroll"
                        horizontal
                        style={styles.stackTrace}
                      >
                        <Text style={styles.stackTraceText} selectable>
                          {errorDetails.stackTrace}
                        </Text>
                      </ScrollView>
                    </View>
                  )}
                  
                  <View style={styles.customizableNote}>
                    <EditableIndicator field="beforeSend" editable={true} />
                    <Text style={styles.customizableText}>
                      Modify error data, add tags, set fingerprint
                    </Text>
                  </View>
                </View>
              </CollapsibleSection>
            )}
            
            {/* Performance Details */}
            {perfDetails && (
              <CollapsibleSection
                title="Performance Event"
                icon={<Zap size={14} color="#8B5CF6" />}
                defaultOpen={true}
              >
                <View style={styles.perfDetails}>
                  <Text style={styles.detailLabel}>Transaction:</Text>
                  <Text style={styles.detailValue}>{perfDetails.name}</Text>
                  
                  <Text style={styles.detailLabel}>Operation:</Text>
                  <Text style={styles.detailValue}>{perfDetails.operation}</Text>
                  
                  {perfDetails.duration && (
                    <>
                      <Text style={styles.detailLabel}>Duration:</Text>
                      <Text style={styles.detailValue}>{formatDuration(perfDetails.duration)}</Text>
                    </>
                  )}
                  
                  {perfDetails.appStart && (
                    <View style={styles.appStartInfo}>
                      <Text style={styles.detailLabel}>App Start:</Text>
                      <Text style={styles.detailValue}>
                        {perfDetails.appStart.type} • {formatDuration(perfDetails.appStart.duration)}
                      </Text>
                    </View>
                  )}
                  
                  {perfDetails.spans && perfDetails.spans.length > 0 && (
                    <>
                      <Text style={styles.detailLabel}>Spans ({perfDetails.spans.length}):</Text>
                      {perfDetails.spans.slice(0, 5).map((span, idx) => (
                        <Text key={idx} style={styles.spanItem}>
                          {span.op}: {span.description} 
                          {span.duration && ` • ${formatDuration(span.duration)}`}
                        </Text>
                      ))}
                    </>
                  )}
                  
                  <View style={styles.customizableNote}>
                    <EditableIndicator field="Transaction name" editable={true} />
                    <EditableIndicator field="Sampling rate" editable={true} />
                  </View>
                </View>
              </CollapsibleSection>
            )}
            
            {/* Original message if no specific details */}
            {!httpRequests.length && !touchDetails && !navDetails && !errorDetails && !perfDetails && (
              <View style={styles.messageContainer}>
                <Text style={styles.messageText} selectable>
                  {typeof entry.message === 'string' ? entry.message : entry.message?.message || 'Error'}
                </Text>
              </View>
            )}
          </ScrollView>
        );
        
      case "insights":
        return (
          <ScrollView
            sentry-label="ignore insights scroll"
            style={styles.insightsContainer}
          >
            {insights.length > 0 ? (
              insights.map((insight, index) => (
                <View key={index} style={[
                  styles.insightItem,
                  insight.severity === 'high' && styles.insightHigh,
                  insight.severity === 'medium' && styles.insightMedium,
                  insight.severity === 'low' && styles.insightLow
                ]}>
                  <View style={styles.insightHeader}>
                    <Text style={styles.insightType}>{insight.type.toUpperCase()}</Text>
                    <Text style={styles.insightSeverity}>{insight.severity}</Text>
                  </View>
                  <Text style={styles.insightMessage}>{insight.message}</Text>
                  {insight.details && (
                    <Text style={styles.insightDetails}>{insight.details}</Text>
                  )}
                  {insight.suggestion && (
                    <View style={styles.insightSuggestion}>
                      <Text style={styles.insightSuggestionLabel}>Suggestion:</Text>
                      <Text style={styles.insightSuggestionText}>{insight.suggestion}</Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.noInsights}>
                <CheckCircle size={20} color="#10B981" />
                <Text style={styles.noInsightsText}>No issues detected</Text>
              </View>
            )}
          </ScrollView>
        );
        
      case "rawData":
        return (
          <DataViewer
            title="Raw Sentry Data"
            data={_sentryRawData as unknown as SentryJsonValue}
            maxDepth={MAX_EXPLORER_DEPTH}
            rawMode={true}
            showTypeFilter={true}
          />
        );
        
      case "deviceContext":
        return (
          <ScrollView
            sentry-label="ignore device context scroll"
            style={styles.deviceContextContainer}
          >
            {deviceContext ? (
              <>
                <CollapsibleSection title="App Context" icon={<Smartphone size={14} color="#8B5CF6" />}>
                  <View style={styles.contextSection}>
                    {deviceContext.app.name && (
                      <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>Name:</Text>
                        <Text style={styles.contextValue}>{deviceContext.app.name}</Text>
                      </View>
                    )}
                    {deviceContext.app.version && (
                      <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>Version:</Text>
                        <Text style={styles.contextValue}>{deviceContext.app.version}</Text>
                      </View>
                    )}
                    {deviceContext.app.build && (
                      <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>Build:</Text>
                        <Text style={styles.contextValue}>{deviceContext.app.build}</Text>
                      </View>
                    )}
                    <EditableIndicator field="App context" editable={false} />
                  </View>
                </CollapsibleSection>
                
                <CollapsibleSection title="Device Info" icon={<Server size={14} color="#8B5CF6" />}>
                  <View style={styles.contextSection}>
                    {deviceContext.device.model && (
                      <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>Model:</Text>
                        <Text style={styles.contextValue}>{deviceContext.device.model}</Text>
                      </View>
                    )}
                    {deviceContext.device.os && (
                      <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>OS:</Text>
                        <Text style={styles.contextValue}>
                          {deviceContext.device.os} {deviceContext.device.osVersion}
                        </Text>
                      </View>
                    )}
                    {deviceContext.device.memory && (
                      <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>Memory:</Text>
                        <Text style={styles.contextValue}>{formatBytes(deviceContext.device.memory)}</Text>
                      </View>
                    )}
                    <EditableIndicator field="Device info" editable={false} />
                  </View>
                </CollapsibleSection>
                
                <CollapsibleSection title="Runtime" icon={<Layers size={14} color="#8B5CF6" />}>
                  <View style={styles.contextSection}>
                    {deviceContext.runtime.name && (
                      <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>Runtime:</Text>
                        <Text style={styles.contextValue}>
                          {deviceContext.runtime.name} {deviceContext.runtime.version}
                        </Text>
                      </View>
                    )}
                    {deviceContext.runtime.engine && (
                      <View style={styles.contextItem}>
                        <Text style={styles.contextLabel}>Engine:</Text>
                        <Text style={styles.contextValue}>{deviceContext.runtime.engine}</Text>
                      </View>
                    )}
                    <EditableIndicator field="Runtime info" editable={false} />
                  </View>
                </CollapsibleSection>
              </>
            ) : (
              <View style={styles.noContext}>
                <Info size={20} color="#6B7280" />
                <Text style={styles.noContextText}>No device context available</Text>
              </View>
            )}
          </ScrollView>
        );
        
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Compact Event Meta Information */}
      <View style={styles.metaSection}>
        <View style={styles.metaRow}>
          {/* Type and Level indicators */}
          <View style={styles.metaLeft}>
            <View
              style={[
                styles.typeIndicator,
                { backgroundColor: `${typeColor}20` },
              ]}
            >
              {IconComponent && <IconComponent size={14} color={typeColor} />}
              <Text style={[styles.typeText, { color: typeColor }]}>
                {entry.type}
              </Text>
            </View>

            <View style={styles.levelContainer}>
              <View style={[styles.levelDot, getLevelDotStyle(entry.level)]} />
              <Text
                style={[
                  styles.levelText,
                  { color: getLevelTextColor(entry.level) },
                ]}
              >
                {entry.level.toUpperCase()}
              </Text>
            </View>

            {/* Sentry Event Type */}
            {(entry.metadata.sentryEventType || entry.metadata.category) && (
              <View style={styles.sentryTypeContainer}>
                <Text style={styles.sentryTypeText}>
                  {(entry.metadata.sentryEventType || entry.metadata.category) as string || ''}
                </Text>
              </View>
            )}
          </View>

          {/* Timestamp */}
          <Text style={styles.timestamp}>
            {formatTime(entry.timestamp)}
          </Text>
        </View>
        
        {/* Enhanced message display - hide for touch events as it will be shown in details */}
        {entry.metadata.category !== 'touch' && (
          <Text style={styles.enhancedMessage} numberOfLines={2}>
            {formatEventMessage(entry)}
          </Text>
        )}
      </View>

      {/* Tab navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          sentry-label="ignore details tab"
          onPress={() => setActiveTab("details")}
          style={[styles.tab, activeTab === "details" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "details" && styles.activeTabText,
            ]}
          >
            Details
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          sentry-label="ignore insights tab"
          onPress={() => setActiveTab("insights")}
          style={[styles.tab, activeTab === "insights" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "insights" && styles.activeTabText,
            ]}
          >
            Insights
          </Text>
          {insights.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{insights.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          sentry-label="ignore raw data tab"
          onPress={() => setActiveTab("rawData")}
          style={[styles.tab, activeTab === "rawData" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "rawData" && styles.activeTabText,
            ]}
          >
            Raw Data
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          sentry-label="ignore device context tab"
          onPress={() => setActiveTab("deviceContext")}
          style={[styles.tab, activeTab === "deviceContext" && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "deviceContext" && styles.activeTabText,
            ]}
          >
            Context
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1F1F1F",
  },
  metaSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#2A2A2A",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  metaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  typeIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  levelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  levelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 11,
    fontFamily: "monospace",
    fontWeight: "600",
  },
  sentryTypeContainer: {
    backgroundColor: "rgba(139, 92, 246, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  sentryTypeText: {
    color: "#A78BFA",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    fontFamily: "monospace",
  },
  timestamp: {
    color: "#9CA3AF",
    fontSize: 11,
    fontFamily: "monospace",
  },
  enhancedMessage: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#2A2A2A",
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
  },
  tab: {
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  activeTab: {
    borderBottomColor: "#8B5CF6",
  },
  tabText: {
    color: "#9CA3AF",
    fontSize: 13,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  tabBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.2)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    minWidth: 16,
    alignItems: "center",
  },
  tabBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
  },
  detailsContainer: {
    flex: 1,
  },
  messageContainer: {
    backgroundColor: "#2A2A2A",
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  messageText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    fontFamily: "monospace",
  },
  
  // Collapsible section styles
  collapsibleSection: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#2A2A2A",
    borderRadius: 8,
    overflow: "hidden",
  },
  collapsibleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  collapsibleTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  collapsibleTitleText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  collapsibleContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  
  // HTTP request styles
  httpRequestCard: {
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  httpHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  httpMethodBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  httpMethod: {
    color: "#8B5CF6",
    fontSize: 12,
    fontWeight: "600",
  },
  httpStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  httpStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  httpDuration: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  httpDurationText: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  httpSizes: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  sizeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sizeLabel: {
    color: "#6B7280",
    fontSize: 11,
  },
  sizeValue: {
    color: "#9CA3AF",
    fontSize: 11,
    fontFamily: "monospace",
  },
  
  // URL breakdown styles
  urlBreakdown: {
    marginVertical: 8,
  },
  urlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  urlDomain: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  urlProtocol: {
    color: "#6B7280",
    fontSize: 11,
  },
  urlPathRow: {
    marginLeft: 18,
  },
  urlPath: {
    color: "#9CA3AF",
    fontSize: 13,
    fontFamily: "monospace",
  },
  urlText: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "monospace",
  },
  urlParams: {
    marginLeft: 18,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  urlParamsTitle: {
    color: "#6B7280",
    fontSize: 11,
    marginBottom: 4,
  },
  urlParam: {
    color: "#9CA3AF",
    fontSize: 11,
    fontFamily: "monospace",
    marginLeft: 8,
  },
  copyButton: {
    padding: 4,
  },
  
  // Field indicator styles
  fieldIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  fieldName: {
    color: "#9CA3AF",
    fontSize: 11,
  },
  editableTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  editableText: {
    color: "#8B5CF6",
    fontSize: 10,
    fontWeight: "600",
  },
  autoTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  autoText: {
    color: "#6B7280",
    fontSize: 10,
    fontWeight: "600",
  },
  customizableNote: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  customizableText: {
    color: "#6B7280",
    fontSize: 11,
    fontStyle: "italic",
  },
  
  // Event-specific detail styles
  detailLabel: {
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 8,
    marginBottom: 2,
  },
  detailValue: {
    color: "#FFFFFF",
    fontSize: 13,
    marginBottom: 4,
  },
  touchDetails: {
    paddingVertical: 8,
  },
  touchActionText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 12,
  },
  componentPathItem: {
    marginLeft: 16,
    marginBottom: 4,
  },
  componentName: {
    color: "#FFFFFF",
    fontSize: 13,
  },
  componentLabel: {
    color: "#8B5CF6",
    fontSize: 12,
  },
  componentFile: {
    color: "#6B7280",
    fontSize: 11,
    fontFamily: "monospace",
  },
  navDetails: {
    paddingVertical: 8,
  },
  errorDetails: {
    paddingVertical: 8,
  },
  errorType: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  errorMessage: {
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 18,
  },
  errorLocation: {
    color: "#9CA3AF",
    fontSize: 12,
    fontFamily: "monospace",
  },
  errorMeta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  errorMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  errorMetaLabel: {
    color: "#6B7280",
    fontSize: 11,
  },
  errorMetaValue: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "600",
  },
  success: {
    color: "#10B981",
  },
  error: {
    color: "#EF4444",
  },
  stackTraceContainer: {
    marginTop: 12,
  },
  stackTrace: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    padding: 10,
    borderRadius: 4,
    maxHeight: 120,
  },
  stackTraceText: {
    color: "#EF4444",
    fontSize: 11,
    fontFamily: "monospace",
    lineHeight: 16,
  },
  perfDetails: {
    paddingVertical: 8,
  },
  appStartInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderRadius: 4,
  },
  spanItem: {
    color: "#9CA3AF",
    fontSize: 12,
    marginLeft: 16,
    marginBottom: 2,
  },
  
  // Insights styles
  insightsContainer: {
    flex: 1,
    padding: 16,
  },
  insightItem: {
    backgroundColor: "rgba(107, 114, 128, 0.1)",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#6B7280",
  },
  insightHigh: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderLeftColor: "#EF4444",
  },
  insightMedium: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderLeftColor: "#F59E0B",
  },
  insightLow: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    borderLeftColor: "#3B82F6",
  },
  insightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  insightType: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  insightSeverity: {
    color: "#9CA3AF",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  insightMessage: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  insightDetails: {
    color: "#D1D5DB",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  insightSuggestion: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
  },
  insightSuggestionLabel: {
    color: "#9CA3AF",
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 2,
  },
  insightSuggestionText: {
    color: "#D1D5DB",
    fontSize: 12,
    lineHeight: 16,
  },
  noInsights: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  noInsightsText: {
    color: "#10B981",
    fontSize: 14,
  },
  
  // Device context styles
  deviceContextContainer: {
    flex: 1,
  },
  contextSection: {
    paddingVertical: 8,
  },
  contextItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  contextLabel: {
    color: "#6B7280",
    fontSize: 12,
    width: 80,
  },
  contextValue: {
    color: "#FFFFFF",
    fontSize: 12,
    flex: 1,
  },
  noContext: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  noContextText: {
    color: "#6B7280",
    fontSize: 14,
  },
});