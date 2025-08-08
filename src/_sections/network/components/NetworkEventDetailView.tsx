import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { 
  Clock, 
  Upload, 
  Download,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Copy,
  FileJson
} from 'lucide-react-native';
import { DataViewer } from '../../react-query/components/shared/DataViewer';
import type { NetworkEvent } from '../types';
import { formatBytes, formatDuration, formatHttpStatus } from '../utils/formatting';
import { formatRelativeTime } from '../../sentry/utils/formatRelativeTime';

interface NetworkEventDetailViewProps {
  event: NetworkEvent;
  onBack: () => void;
}

// Component for collapsible sections matching Sentry style
const CollapsibleSection: React.FC<{
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = false }) => {
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
      {isOpen ? <View style={styles.collapsibleContent}>{children}</View> : null}
    </View>
  );
};

// URL breakdown component matching Sentry style
const UrlBreakdown: React.FC<{ url: string }> = ({ url }) => {
  const handleCopy = (text: string) => {
    // Clipboard functionality temporarily disabled due to deprecated API
    console.log('Copy to clipboard:', text);
  };
  
  const parseUrl = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      const isSecure = urlObj.protocol === 'https:';
      
      // Parse query parameters
      const params: Record<string, string> = {};
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      return {
        protocol: urlObj.protocol.replace(':', ''),
        host: urlObj.host,
        pathname: urlObj.pathname,
        params: Object.keys(params).length > 0 ? params : null,
        isSecure
      };
    } catch {
      return {
        protocol: '',
        host: url,
        pathname: '',
        params: null,
        isSecure: false
      };
    }
  };
  
  const urlParts = parseUrl(url);
  
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
      {urlParts.params ? (
        <View style={styles.urlParams}>
          <Text style={styles.urlParamsTitle}>Query Parameters:</Text>
          {Object.entries(urlParts.params).map(([key, value]) => (
            <Text key={key} style={styles.urlParam}>
              {key}: {value}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
};

export function NetworkEventDetailView({ event }: NetworkEventDetailViewProps) {
  const status = event.status ? formatHttpStatus(event.status) : null;
  const isPending = !event.status && !event.error;

  return (
    <ScrollView style={styles.container} sentry-label="ignore network detail scroll">
      {/* Request Details - Always visible */}
      <View style={styles.requestDetailsSection}>
        <View style={styles.httpHeader}>
          <View style={styles.httpMethodBadge}>
            <Text style={styles.httpMethod}>{event.method}</Text>
          </View>
          {event.status ? (
            <View style={[styles.httpStatusBadge, { backgroundColor: `${status?.color}20` }]}>
              <Text style={[styles.httpStatusText, { color: status?.color }]}>
                {status?.text} {status?.meaning}
              </Text>
            </View>
          ) : isPending ? (
            <View style={styles.pendingBadge}>
              <Clock size={10} color="#F59E0B" />
              <Text style={styles.pendingBadgeText}>Pending</Text>
            </View>
          ) : null}
          {event.duration ? (
            <View style={styles.httpDuration}>
              <Clock size={10} color="#6B7280" />
              <Text style={styles.httpDurationText}>{formatDuration(event.duration)}</Text>
            </View>
          ) : null}
        </View>
        
        <UrlBreakdown url={event.url} />
        
        {event.error ? (
          <View style={styles.errorBox}>
            <AlertCircle size={12} color="#EF4444" />
            <Text style={styles.errorText}>{event.error}</Text>
          </View>
        ) : null}
      </View>

      {/* Timing Information - Always visible */}
      <View style={styles.timingSection}>
        <View style={styles.timingRow}>
          <Clock size={12} color="#9CA3AF" />
          <Text style={styles.timingLabel}>Started:</Text>
          <Text style={styles.timingValue}>
            {formatRelativeTime(event.timestamp)}
          </Text>
          <Text style={styles.timingExact}>
            ({new Date(event.timestamp).toLocaleTimeString()})
          </Text>
        </View>
        
        {(event.requestSize || event.responseSize) ? (
          <View style={styles.sizeRow}>
            {event.requestSize !== undefined ? (
              <View style={styles.sizeItem}>
                <Upload size={10} color="#3B82F6" />
                <Text style={styles.sizeLabel}>Sent:</Text>
                <Text style={styles.sizeValue}>{formatBytes(event.requestSize)}</Text>
              </View>
            ) : null}
            {event.responseSize !== undefined ? (
              <View style={styles.sizeItem}>
                <Download size={10} color="#10B981" />
                <Text style={styles.sizeLabel}>Received:</Text>
                <Text style={styles.sizeValue}>{formatBytes(event.responseSize)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </View>

      {/* Request Headers - Collapsible */}
      <CollapsibleSection
        title="Request Headers"
        icon={<Upload size={14} color="#3B82F6" />}
        defaultOpen={false}
      >
        {Object.keys(event.requestHeaders).length > 0 ? (
          <View style={styles.dataViewerContainer}>
            <DataViewer
              title=""
              data={event.requestHeaders}
              showTypeFilter={true}
              rawMode={true}
              initialExpanded={true}
            />
          </View>
        ) : (
          <Text style={styles.emptyText}>No request headers</Text>
        )}
      </CollapsibleSection>

      {/* Response Headers - Collapsible */}
      <CollapsibleSection
        title="Response Headers"
        icon={<Download size={14} color="#10B981" />}
        defaultOpen={false}
      >
        {Object.keys(event.responseHeaders).length > 0 ? (
          <View style={styles.dataViewerContainer}>
            <DataViewer
              title=""
              data={event.responseHeaders}
              showTypeFilter={true}
              rawMode={true}
              initialExpanded={true}
            />
          </View>
        ) : (
          <Text style={styles.emptyText}>No response headers yet</Text>
        )}
      </CollapsibleSection>

      {/* Request Body - Collapsible */}
      {event.requestData ? (
        <CollapsibleSection
          title="Request Body"
          icon={<FileJson size={14} color="#8B5CF6" />}
          defaultOpen={false}
        >
          <View style={styles.dataViewerContainer}>
            <DataViewer
              title=""
              data={event.requestData}
              showTypeFilter={true}
              rawMode={true}
              initialExpanded={true}
            />
          </View>
        </CollapsibleSection>
      ) : null}

      {/* Response Body - Collapsible */}
      {event.responseData ? (
        <CollapsibleSection
          title="Response Body"
          icon={<FileJson size={14} color="#10B981" />}
          defaultOpen={false}
        >
          <View style={styles.dataViewerContainer}>
            <DataViewer
              title=""
              data={event.responseData}
              showTypeFilter={true}
              rawMode={true}
              initialExpanded={true}
            />
          </View>
        </CollapsibleSection>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171717',
  },
  // Request details section - always visible
  requestDetailsSection: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  httpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  httpMethodBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  httpMethod: {
    color: '#8B5CF6',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  httpStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  httpStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pendingBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '600',
  },
  httpDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  httpDurationText: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  // URL breakdown styles
  urlBreakdown: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    padding: 8,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  urlDomain: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  urlProtocol: {
    color: '#6B7280',
    fontSize: 10,
  },
  copyButton: {
    padding: 4,
  },
  urlPathRow: {
    paddingLeft: 18,
  },
  urlPath: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  urlParams: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  urlParamsTitle: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  urlParam: {
    color: '#3B82F6',
    fontSize: 11,
    fontFamily: 'monospace',
    marginLeft: 8,
    marginTop: 2,
  },
  // Timing section - always visible
  timingSection: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
  },
  timingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timingLabel: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  timingValue: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '600',
  },
  timingExact: {
    color: '#6B7280',
    fontSize: 10,
    marginLeft: 4,
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  sizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sizeLabel: {
    color: '#6B7280',
    fontSize: 10,
  },
  sizeValue: {
    color: '#3B82F6',
    fontSize: 10,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  // Collapsible section styles
  collapsibleSection: {
    marginHorizontal: 12,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  collapsibleTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collapsibleTitleText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '600',
  },
  collapsibleContent: {
    padding: 12,
  },
  // Data viewer container
  dataViewerContainer: {
    marginTop: -12,
    marginHorizontal: -12,
    marginBottom: -12,
  },
  // Error box
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 11,
    flex: 1,
  },
  // Empty state
  emptyText: {
    color: '#6B7280',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});