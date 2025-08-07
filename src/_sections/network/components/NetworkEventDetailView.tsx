import { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { 
  Globe, 
  Clock, 
  Upload, 
  Download,
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react-native';
import { DataViewer } from '../../react-query/components/shared/DataViewer';
import type { NetworkEvent } from '../types';
import { formatBytes, formatDuration, formatHttpStatus } from '../utils/formatting';

interface NetworkEventDetailViewProps {
  event: NetworkEvent;
  onBack: () => void;
}

type TabType = 'general' | 'headers' | 'request' | 'response';

export function NetworkEventDetailView({ event }: NetworkEventDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const status = event.status ? formatHttpStatus(event.status) : null;

  const renderGeneralTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* URL Section */}
      <View style={styles.section}>
        <TouchableOpacity
          sentry-label="ignore url section"
          style={styles.sectionHeader}
          onPress={() => toggleSection('url')}
        >
          <Globe size={14} color="#8B5CF6" />
          <Text style={styles.sectionTitle}>URL</Text>
          {expandedSections.has('url') ? (
            <ChevronUp size={16} color="#9CA3AF" />
          ) : (
            <ChevronDown size={16} color="#9CA3AF" />
          )}
        </TouchableOpacity>
        
        {expandedSections.has('url') && (
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Method:</Text>
              <Text style={styles.infoValue}>{event.method}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Full URL:</Text>
              <Text style={styles.infoValueMono} selectable>{event.url}</Text>
            </View>
            {event.host && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Host:</Text>
                <Text style={styles.infoValue}>{event.host}</Text>
              </View>
            )}
            {event.path && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Path:</Text>
                <Text style={styles.infoValueMono}>{event.path}</Text>
              </View>
            )}
            {event.query && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Query:</Text>
                <Text style={styles.infoValueMono}>{event.query}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Status Section */}
      <View style={styles.section}>
        <TouchableOpacity
          sentry-label="ignore status section"
          style={styles.sectionHeader}
          onPress={() => toggleSection('status')}
        >
          {event.error ? (
            <AlertCircle size={14} color="#EF4444" />
          ) : event.status ? (
            <CheckCircle size={14} color={status?.color || '#10B981'} />
          ) : (
            <Clock size={14} color="#F59E0B" />
          )}
          <Text style={styles.sectionTitle}>Status</Text>
          {expandedSections.has('status') ? (
            <ChevronUp size={16} color="#9CA3AF" />
          ) : (
            <ChevronDown size={16} color="#9CA3AF" />
          )}
        </TouchableOpacity>
        
        {expandedSections.has('status') && (
          <View style={styles.sectionContent}>
            {event.status && (
              <>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status Code:</Text>
                  <View style={styles.statusBadge}>
                    <Text style={[styles.statusCode, { color: status?.color }]}>
                      {event.status}
                    </Text>
                    <Text style={styles.statusMeaning}>{status?.meaning}</Text>
                  </View>
                </View>
                {event.statusText && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status Text:</Text>
                    <Text style={styles.infoValue}>{event.statusText}</Text>
                  </View>
                )}
              </>
            )}
            {event.error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{event.error}</Text>
              </View>
            )}
            {!event.status && !event.error && (
              <Text style={styles.pendingText}>Request is pending...</Text>
            )}
          </View>
        )}
      </View>

      {/* Timing Section */}
      <View style={styles.section}>
        <TouchableOpacity
          sentry-label="ignore timing section"
          style={styles.sectionHeader}
          onPress={() => toggleSection('timing')}
        >
          <Clock size={14} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Timing</Text>
          {expandedSections.has('timing') ? (
            <ChevronUp size={16} color="#9CA3AF" />
          ) : (
            <ChevronDown size={16} color="#9CA3AF" />
          )}
        </TouchableOpacity>
        
        {expandedSections.has('timing') && (
          <View style={styles.sectionContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Started At:</Text>
              <Text style={styles.infoValue}>
                {new Date(event.timestamp).toLocaleString()}
              </Text>
            </View>
            {event.duration && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Duration:</Text>
                <Text style={styles.infoValue}>{formatDuration(event.duration)}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Data Size Section */}
      {(event.requestSize || event.responseSize) && (
        <View style={styles.section}>
          <TouchableOpacity
            sentry-label="ignore size section"
            style={styles.sectionHeader}
            onPress={() => toggleSection('size')}
          >
            <Upload size={14} color="#9CA3AF" />
            <Text style={styles.sectionTitle}>Data Transfer</Text>
            {expandedSections.has('size') ? (
              <ChevronUp size={16} color="#9CA3AF" />
            ) : (
              <ChevronDown size={16} color="#9CA3AF" />
            )}
          </TouchableOpacity>
          
          {expandedSections.has('size') && (
            <View style={styles.sectionContent}>
              {event.requestSize && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Request Size:</Text>
                  <View style={styles.sizeInfo}>
                    <Upload size={12} color="#3B82F6" />
                    <Text style={styles.infoValue}>{formatBytes(event.requestSize)}</Text>
                  </View>
                </View>
              )}
              {event.responseSize && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Response Size:</Text>
                  <View style={styles.sizeInfo}>
                    <Download size={12} color="#10B981" />
                    <Text style={styles.infoValue}>{formatBytes(event.responseSize)}</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );

  const renderHeadersTab = () => (
    <ScrollView style={styles.tabContent}>
      {/* Request Headers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Upload size={14} color="#3B82F6" />
          <Text style={styles.sectionTitle}>Request Headers</Text>
        </View>
        <View style={styles.sectionContent}>
          {Object.keys(event.requestHeaders).length > 0 ? (
            Object.entries(event.requestHeaders).map(([key, value]) => (
              <View key={key} style={styles.headerRow}>
                <Text style={styles.headerKey}>{key}:</Text>
                <Text style={styles.headerValue} selectable>{value}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No request headers</Text>
          )}
        </View>
      </View>

      {/* Response Headers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Download size={14} color="#10B981" />
          <Text style={styles.sectionTitle}>Response Headers</Text>
        </View>
        <View style={styles.sectionContent}>
          {Object.keys(event.responseHeaders).length > 0 ? (
            Object.entries(event.responseHeaders).map(([key, value]) => (
              <View key={key} style={styles.headerRow}>
                <Text style={styles.headerKey}>{key}:</Text>
                <Text style={styles.headerValue} selectable>{value}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No response headers yet</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );

  const renderRequestTab = () => (
    <View style={styles.tabContent}>
      {event.requestData ? (
        <DataViewer
          title="Request Body"
          data={event.requestData}
          showTypeFilter={false}
          rawMode={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No request body</Text>
        </View>
      )}
    </View>
  );

  const renderResponseTab = () => (
    <View style={styles.tabContent}>
      {event.responseData ? (
        <DataViewer
          title="Response Body"
          data={event.responseData}
          showTypeFilter={false}
          rawMode={true}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {event.status ? 'No response body' : 'Waiting for response...'}
          </Text>
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralTab();
      case 'headers':
        return renderHeadersTab();
      case 'request':
        return renderRequestTab();
      case 'response':
        return renderResponseTab();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab navigation */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          sentry-label="ignore general tab"
          onPress={() => setActiveTab('general')}
          style={[styles.tab, activeTab === 'general' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>
            General
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          sentry-label="ignore headers tab"
          onPress={() => setActiveTab('headers')}
          style={[styles.tab, activeTab === 'headers' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'headers' && styles.activeTabText]}>
            Headers
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          sentry-label="ignore request tab"
          onPress={() => setActiveTab('request')}
          style={[styles.tab, activeTab === 'request' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'request' && styles.activeTabText]}>
            Request
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          sentry-label="ignore response tab"
          onPress={() => setActiveTab('response')}
          style={[styles.tab, activeTab === 'response' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'response' && styles.activeTabText]}>
            Response
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab content */}
      {renderTabContent()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1F1F',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  tab: {
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#8B5CF6',
  },
  tabText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  sectionContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    width: 100,
  },
  infoValue: {
    color: '#E5E7EB',
    fontSize: 12,
    flex: 1,
  },
  infoValueMono: {
    color: '#E5E7EB',
    fontSize: 12,
    flex: 1,
    fontFamily: 'monospace',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusCode: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusMeaning: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 4,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  pendingText: {
    color: '#F59E0B',
    fontSize: 12,
    fontStyle: 'italic',
  },
  sizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerRow: {
    marginBottom: 6,
  },
  headerKey: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  headerValue: {
    color: '#E5E7EB',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
  },
});