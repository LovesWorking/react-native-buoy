import { View, Text, StyleSheet } from 'react-native';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock,
  Upload,
  Download,
  Timer
} from 'lucide-react-native';
import type { NetworkStats } from '../types';
import { formatBytes, formatDuration } from '../utils/formatting';

interface NetworkStatsProps {
  stats: NetworkStats;
}

export function NetworkStatsSection({ stats }: NetworkStatsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Activity size={14} color="#8B5CF6" />
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <Text style={styles.statValue}>{stats.totalRequests}</Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <CheckCircle size={14} color="#10B981" />
            <Text style={styles.statLabel}>Success</Text>
          </View>
          <Text style={[styles.statValue, styles.successText]}>
            {stats.successfulRequests}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <XCircle size={14} color="#EF4444" />
            <Text style={styles.statLabel}>Failed</Text>
          </View>
          <Text style={[styles.statValue, styles.errorText]}>
            {stats.failedRequests}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Clock size={14} color="#F59E0B" />
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <Text style={[styles.statValue, styles.pendingText]}>
            {stats.pendingRequests}
          </Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Upload size={14} color="#3B82F6" />
            <Text style={styles.statLabel}>Sent</Text>
          </View>
          <Text style={styles.statValueSmall}>
            {formatBytes(stats.totalDataSent)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Download size={14} color="#3B82F6" />
            <Text style={styles.statLabel}>Received</Text>
          </View>
          <Text style={styles.statValueSmall}>
            {formatBytes(stats.totalDataReceived)}
          </Text>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Timer size={14} color="#9CA3AF" />
            <Text style={styles.statLabel}>Avg Time</Text>
          </View>
          <Text style={styles.statValueSmall}>
            {stats.averageDuration ? formatDuration(stats.averageDuration) : '-'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statValueSmall: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  successText: {
    color: '#10B981',
  },
  errorText: {
    color: '#EF4444',
  },
  pendingText: {
    color: '#F59E0B',
  },
});