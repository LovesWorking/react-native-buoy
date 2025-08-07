import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { 
  Globe, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  ChevronRight
} from 'lucide-react-native';
import type { NetworkEvent } from '../types';
import { formatBytes, formatDuration } from '../utils/formatting';

interface NetworkEventItemProps {
  event: NetworkEvent;
  onPress: (event: NetworkEvent) => void;
}

export function NetworkEventItem({ event, onPress }: NetworkEventItemProps) {
  const getStatusColor = (status?: number, error?: string) => {
    if (error) return '#EF4444';
    if (!status) return '#F59E0B';
    if (status >= 200 && status < 300) return '#10B981';
    if (status >= 300 && status < 400) return '#3B82F6';
    if (status >= 400) return '#EF4444';
    return '#6B7280';
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return '#10B981';
      case 'POST': return '#3B82F6';
      case 'PUT': return '#F59E0B';
      case 'DELETE': return '#EF4444';
      case 'PATCH': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const statusColor = getStatusColor(event.status, event.error);
  const methodColor = getMethodColor(event.method);
  const isPending = !event.status && !event.error;

  return (
    <TouchableOpacity
      sentry-label="ignore network event item"
      style={styles.container}
      onPress={() => onPress(event)}
    >
      <View style={styles.header}>
        <View style={styles.methodBadge}>
          <Text style={[styles.methodText, { color: methodColor }]}>
            {event.method}
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          {isPending ? (
            <Clock size={14} color="#F59E0B" />
          ) : event.error ? (
            <AlertCircle size={14} color="#EF4444" />
          ) : (
            <CheckCircle size={14} color={statusColor} />
          )}
          <Text style={[styles.statusText, { color: statusColor }]}>
            {event.status || (event.error ? 'Error' : 'Pending')}
          </Text>
        </View>

        {event.duration && (
          <Text style={styles.durationText}>
            {formatDuration(event.duration)}
          </Text>
        )}

        <ChevronRight size={16} color="#6B7280" />
      </View>

      <View style={styles.urlContainer}>
        <Globe size={12} color="#6B7280" />
        <Text style={styles.urlText} numberOfLines={1}>
          {event.host ? `${event.host}${event.path}` : event.url}
        </Text>
      </View>

      {event.query && (
        <Text style={styles.queryText} numberOfLines={1}>
          Query: {event.query}
        </Text>
      )}

      {event.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{event.error}</Text>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.timestampText}>
          {new Date(event.timestamp).toLocaleTimeString()}
        </Text>
        
        {(event.requestSize || event.responseSize) && (
          <View style={styles.sizeContainer}>
            {event.requestSize && (
              <Text style={styles.sizeText}>↑ {formatBytes(event.requestSize)}</Text>
            )}
            {event.responseSize && (
              <Text style={styles.sizeText}>↓ {formatBytes(event.responseSize)}</Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#8B5CF6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 4,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  urlText: {
    fontSize: 12,
    color: '#E5E7EB',
    flex: 1,
    fontFamily: 'monospace',
  },
  queryText: {
    fontSize: 11,
    color: '#9CA3AF',
    marginLeft: 18,
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 6,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timestampText: {
    fontSize: 10,
    color: '#6B7280',
  },
  sizeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
});