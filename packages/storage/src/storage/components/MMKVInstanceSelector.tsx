/**
 * MMKVInstanceSelector Component
 *
 * Dropdown selector for choosing between multiple MMKV instances.
 * Shows instance ID, key count, and metadata badges (encrypted, read-only).
 *
 * Used in GameUIStorageBrowser when storage type filter is set to "mmkv".
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { macOSColors } from '@react-buoy/shared-ui';
import { useMMKVInstances } from '../hooks/useMMKVInstances';
import { isMMKVAvailable, getMMKVUnavailableMessage } from '../utils/mmkvAvailability';

type MMKVInstanceMetadata = any;

interface MMKVInstanceSelectorProps {
  selectedInstanceId: string | null;
  onSelectInstance: (instanceId: string) => void;
  showRefreshButton?: boolean;
}

/**
 * MMKV Instance Selector Component
 *
 * Displays a dropdown to select between registered MMKV instances.
 *
 * @example
 * ```typescript
 * function MyStorageUI() {
 *   const [selectedInstance, setSelectedInstance] = useState('mmkv.default');
 *
 *   return (
 *     <MMKVInstanceSelector
 *       selectedInstanceId={selectedInstance}
 *       onSelectInstance={setSelectedInstance}
 *     />
 *   );
 * }
 * ```
 */
export function MMKVInstanceSelector({
  selectedInstanceId,
  onSelectInstance,
  showRefreshButton = true,
}: MMKVInstanceSelectorProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { instances, instanceCount, refresh } = useMMKVInstances(false);

  // Find the selected instance
  const selectedInstance = instances.find(
    (inst) => inst.id === selectedInstanceId
  );

  // Handle instance selection
  const handleSelectInstance = (instanceId: string) => {
    onSelectInstance(instanceId);
    setIsDropdownOpen(false);
  };

  // If MMKV is not available, show unavailable message
  if (!isMMKVAvailable()) {
    return (
      <View style={styles.container}>
        <View style={styles.unavailableState}>
          <Text style={styles.unavailableTitle}>MMKV Not Available</Text>
          <Text style={styles.unavailableDescription}>
            {getMMKVUnavailableMessage()}
          </Text>
        </View>
      </View>
    );
  }

  // If no instances registered, show message
  if (instanceCount === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No MMKV Instances Registered</Text>
          <Text style={styles.emptyStateDescription}>
            Register MMKV instances using registerMMKVInstance() to monitor them
            in dev tools.
          </Text>
          {showRefreshButton && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={refresh}
              activeOpacity={0.7}
            >
              <Text style={styles.refreshButtonText}>↻ Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Selected Instance Display */}
      <TouchableOpacity
        style={styles.selectorButton}
        onPress={() => setIsDropdownOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.selectorContent}>
          {selectedInstance ? (
            <InstanceRow instance={selectedInstance} isSelected={true} />
          ) : (
            <Text style={styles.placeholderText}>Select MMKV Instance</Text>
          )}
        </View>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsDropdownOpen(false)}
        >
          <View style={styles.dropdownContainer}>
            <View style={styles.dropdownHeader}>
              <Text style={styles.dropdownTitle}>
                Select MMKV Instance ({instanceCount})
              </Text>
              {showRefreshButton && (
                <TouchableOpacity
                  style={styles.headerRefreshButton}
                  onPress={refresh}
                  activeOpacity={0.7}
                >
                  <Text style={styles.headerRefreshText}>↻</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView style={styles.dropdownList}>
              {instances.map((instance) => (
                <TouchableOpacity
                  key={instance.id}
                  style={[
                    styles.dropdownItem,
                    instance.id === selectedInstanceId &&
                      styles.dropdownItemSelected,
                  ]}
                  onPress={() => handleSelectInstance(instance.id)}
                  activeOpacity={0.7}
                >
                  <InstanceRow
                    instance={instance}
                    isSelected={instance.id === selectedInstanceId}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/**
 * Instance Row Component
 *
 * Displays a single MMKV instance with its metadata.
 */
function InstanceRow({
  instance,
  isSelected,
}: {
  instance: MMKVInstanceMetadata;
  isSelected: boolean;
}) {
  return (
    <View style={styles.instanceRow}>
      <View style={styles.instanceLeft}>
        <Text
          style={[
            styles.instanceId,
            isSelected && styles.instanceIdSelected,
          ]}
          numberOfLines={1}
        >
          {instance.id}
        </Text>
        <View style={styles.instanceBadges}>
          {instance.encrypted && (
            <View style={[styles.badge, styles.badgeEncrypted]}>
              <Text style={styles.badgeText}>🔒 Encrypted</Text>
            </View>
          )}
          {instance.readOnly && (
            <View style={[styles.badge, styles.badgeReadOnly]}>
              <Text style={styles.badgeText}>👁️ Read-only</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.instanceRight}>
        <Text style={styles.keyCount}>{instance.keyCount}</Text>
        <Text style={styles.keyCountLabel}>keys</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },

  // Unavailable state
  unavailableState: {
    backgroundColor: macOSColors.semantic.warning + '15',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: macOSColors.semantic.warning + '40',
    alignItems: 'center',
    gap: 12,
  },
  unavailableTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: macOSColors.semantic.warning,
  },
  unavailableDescription: {
    fontSize: 12,
    color: macOSColors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Empty state
  emptyState: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: macOSColors.border.default + '50',
    alignItems: 'center',
    gap: 12,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: macOSColors.text.primary,
  },
  emptyStateDescription: {
    fontSize: 12,
    color: macOSColors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  refreshButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: macOSColors.semantic.info + '20',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info + '40',
  },
  refreshButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: macOSColors.semantic.info,
  },

  // Selector button
  selectorButton: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: macOSColors.border.default + '50',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  selectorContent: {
    flex: 1,
  },
  placeholderText: {
    fontSize: 13,
    color: macOSColors.text.muted,
    fontStyle: 'italic',
  },
  dropdownArrow: {
    fontSize: 10,
    color: macOSColors.text.muted,
    marginLeft: 8,
  },

  // Modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  // Dropdown container
  dropdownContainer: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    width: '100%',
    maxWidth: 500,
    maxHeight: '70%',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default + '50',
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: macOSColors.text.primary,
  },
  headerRefreshButton: {
    padding: 4,
  },
  headerRefreshText: {
    fontSize: 18,
    color: macOSColors.semantic.info,
  },
  dropdownList: {
    maxHeight: 400,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default + '30',
  },
  dropdownItemSelected: {
    backgroundColor: macOSColors.semantic.info + '10',
  },

  // Instance row
  instanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  instanceLeft: {
    flex: 1,
    gap: 6,
  },
  instanceId: {
    fontSize: 13,
    fontWeight: '500',
    color: macOSColors.text.primary,
    fontFamily: 'monospace',
  },
  instanceIdSelected: {
    fontWeight: '600',
    color: macOSColors.semantic.info,
  },
  instanceBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  badgeEncrypted: {
    backgroundColor: macOSColors.semantic.success + '15',
    borderColor: macOSColors.semantic.success + '40',
  },
  badgeReadOnly: {
    backgroundColor: macOSColors.semantic.warning + '15',
    borderColor: macOSColors.semantic.warning + '40',
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '500',
    color: macOSColors.text.secondary,
  },
  instanceRight: {
    alignItems: 'flex-end',
  },
  keyCount: {
    fontSize: 16,
    fontWeight: '600',
    color: macOSColors.text.primary,
    fontFamily: 'monospace',
  },
  keyCountLabel: {
    fontSize: 9,
    color: macOSColors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
