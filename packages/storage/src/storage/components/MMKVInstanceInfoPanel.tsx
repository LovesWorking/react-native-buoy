/**
 * MMKVInstanceInfoPanel Component
 *
 * Displays detailed information about a selected MMKV instance:
 * - Instance ID and path
 * - Encryption status
 * - Read-only status
 * - Key count
 * - Size (if available)
 *
 * Used in GameUIStorageBrowser below the instance selector.
 */

import { View, Text, StyleSheet } from 'react-native';
import { macOSColors } from '@react-buoy/shared-ui';
import { useMMKVInstance } from '../hooks/useMMKVInstances';

interface MMKVInstanceInfoPanelProps {
  instanceId: string;
}

/**
 * MMKV Instance Info Panel
 *
 * Shows metadata and statistics for a selected MMKV instance.
 *
 * @example
 * ```typescript
 * function MyStorageUI() {
 *   const [selectedInstance, setSelectedInstance] = useState('mmkv.default');
 *
 *   return (
 *     <View>
 *       <MMKVInstanceSelector
 *         selectedInstanceId={selectedInstance}
 *         onSelectInstance={setSelectedInstance}
 *       />
 *       {selectedInstance && (
 *         <MMKVInstanceInfoPanel instanceId={selectedInstance} />
 *       )}
 *     </View>
 *   );
 * }
 * ```
 */
export function MMKVInstanceInfoPanel({
  instanceId,
}: MMKVInstanceInfoPanelProps) {
  const instance = useMMKVInstance(instanceId);

  if (!instance) {
    return (
      <View style={styles.container}>
        <View style={styles.errorState}>
          <Text style={styles.errorText}>Instance not found: {instanceId}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.panel}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Instance Details</Text>
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          {/* Instance ID */}
          <InfoItem
            label="Instance ID"
            value={instance.id}
            valueStyle={styles.monoValue}
          />

          {/* Key Count */}
          <InfoItem
            label="Keys"
            value={`${instance.keyCount} ${instance.keyCount === 1 ? 'key' : 'keys'}`}
            highlight={true}
          />

          {/* Encryption Status */}
          <InfoItem
            label="Encryption"
            value={instance.encrypted ? '🔒 Encrypted' : '🔓 Not encrypted'}
            valueColor={
              instance.encrypted
                ? macOSColors.semantic.success
                : macOSColors.text.muted
            }
          />

          {/* Read-only Status */}
          <InfoItem
            label="Access"
            value={instance.readOnly ? '👁️ Read-only' : '✏️ Read-write'}
            valueColor={
              instance.readOnly
                ? macOSColors.semantic.warning
                : macOSColors.text.muted
            }
          />

          {/* Size (if available) */}
          {instance.size !== undefined && (
            <InfoItem
              label="Size"
              value={formatBytes(instance.size)}
              valueStyle={styles.monoValue}
            />
          )}
        </View>

        {/* Security Notice */}
        {instance.encrypted && (
          <View style={styles.notice}>
            <Text style={styles.noticeIcon}>🔒</Text>
            <Text style={styles.noticeText}>
              This instance is encrypted. Values are protected at rest.
            </Text>
          </View>
        )}

        {instance.readOnly && (
          <View style={[styles.notice, styles.noticeWarning]}>
            <Text style={styles.noticeIcon}>👁️</Text>
            <Text style={[styles.noticeText, styles.noticeTextWarning]}>
              Read-only mode. Cannot modify values in this instance.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * InfoItem Component - Displays a label-value pair
 */
function InfoItem({
  label,
  value,
  valueStyle,
  valueColor,
  highlight,
}: {
  label: string;
  value: string;
  valueStyle?: any;
  valueColor?: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          valueStyle,
          valueColor && { color: valueColor },
          highlight && styles.infoValueHighlight,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },

  // Error state
  errorState: {
    backgroundColor: macOSColors.semantic.error + '15',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: macOSColors.semantic.error + '40',
  },
  errorText: {
    fontSize: 12,
    color: macOSColors.semantic.error,
    textAlign: 'center',
  },

  // Panel
  panel: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: macOSColors.border.default + '50',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },

  // Header
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default + '30',
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: macOSColors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Info grid
  infoGrid: {
    padding: 12,
    gap: 10,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: macOSColors.text.muted,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 12,
    color: macOSColors.text.primary,
    fontWeight: '500',
  },
  infoValueHighlight: {
    fontSize: 14,
    fontWeight: '600',
    color: macOSColors.semantic.info,
  },
  monoValue: {
    fontFamily: 'monospace',
  },

  // Notices
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    margin: 12,
    marginTop: 0,
    backgroundColor: macOSColors.semantic.success + '10',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.semantic.success + '30',
  },
  noticeWarning: {
    backgroundColor: macOSColors.semantic.warning + '10',
    borderColor: macOSColors.semantic.warning + '30',
  },
  noticeIcon: {
    fontSize: 14,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    color: macOSColors.semantic.success,
    lineHeight: 16,
  },
  noticeTextWarning: {
    color: macOSColors.semantic.warning,
  },
});
