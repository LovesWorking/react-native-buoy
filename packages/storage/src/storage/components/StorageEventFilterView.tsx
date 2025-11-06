import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import {
  Filter,
  DynamicFilterView,
  type DynamicFilterConfig,
  Database,
  HardDrive,
  Shield,
  macOSColors,
} from "@react-buoy/shared-ui";

interface StorageEventFilterViewProps {
  ignoredPatterns: Set<string>;
  onTogglePattern: (pattern: string) => void;
  onAddPattern: (pattern: string) => void;
  availableKeys?: string[];
  enabledStorageTypes: Set<'async' | 'mmkv' | 'secure'>;
  onToggleStorageType: (type: 'async' | 'mmkv' | 'secure') => void;
}

export function StorageEventFilterView({
  ignoredPatterns,
  onTogglePattern,
  onAddPattern,
  availableKeys = [],
  enabledStorageTypes,
  onToggleStorageType,
}: StorageEventFilterViewProps) {
  const filterConfig: DynamicFilterConfig = {
    addFilterSection: {
      enabled: true,
      placeholder: "Enter key pattern to hide...",
      title: "KEY FILTERS",
      icon: Filter,
    },
    availableItemsSection: {
      enabled: true,
      title: "AVAILABLE EVENT KEYS",
      emptyMessage:
        "No storage event keys available. Events will appear here once captured.",
      items: availableKeys,
    },
    howItWorksSection: {
      enabled: true,
      title: "HOW EVENT FILTERS WORK",
      description:
        "Patterns hide matching storage keys from the event list. Storage type toggles control which storage backends are monitored.",
      examples: [
        "• react_buoy → hides keys containing react_buoy",
        "• @temp → hides @temp_user, @temp_data",
        "• redux → hides redux-persist:root",
        "• AsyncStorage → show/hide AsyncStorage events",
        "• MMKV → show/hide MMKV events",
      ],
      icon: Filter,
    },
    onPatternToggle: onTogglePattern,
    onPatternAdd: onAddPattern,
    activePatterns: ignoredPatterns,
  };

  return (
    <View style={styles.container}>
      {/* Storage Type Toggles */}
      <View style={styles.storageTypeSection}>
        <Text style={styles.sectionTitle}>STORAGE TYPES</Text>
        <View style={styles.storageTypeButtons}>
          <TouchableOpacity
            style={[
              styles.storageTypeButton,
              enabledStorageTypes.has('async') && styles.storageTypeButtonActive,
              { borderColor: macOSColors.semantic.warning + '40' }
            ]}
            onPress={() => onToggleStorageType('async')}
          >
            <Database
              size={16}
              color={enabledStorageTypes.has('async') ? macOSColors.semantic.warning : macOSColors.text.muted}
            />
            <Text
              style={[
                styles.storageTypeButtonText,
                enabledStorageTypes.has('async') && { color: macOSColors.semantic.warning }
              ]}
            >
              AsyncStorage
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.storageTypeButton,
              enabledStorageTypes.has('mmkv') && styles.storageTypeButtonActive,
              { borderColor: macOSColors.semantic.info + '40' }
            ]}
            onPress={() => onToggleStorageType('mmkv')}
          >
            <HardDrive
              size={16}
              color={enabledStorageTypes.has('mmkv') ? macOSColors.semantic.info : macOSColors.text.muted}
            />
            <Text
              style={[
                styles.storageTypeButtonText,
                enabledStorageTypes.has('mmkv') && { color: macOSColors.semantic.info }
              ]}
            >
              MMKV
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.storageTypeButton,
              enabledStorageTypes.has('secure') && styles.storageTypeButtonActive,
              { borderColor: macOSColors.semantic.success + '40' }
            ]}
            onPress={() => onToggleStorageType('secure')}
          >
            <Shield
              size={16}
              color={enabledStorageTypes.has('secure') ? macOSColors.semantic.success : macOSColors.text.muted}
            />
            <Text
              style={[
                styles.storageTypeButtonText,
                enabledStorageTypes.has('secure') && { color: macOSColors.semantic.success }
              ]}
            >
              Secure Storage
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Key Pattern Filters */}
      <DynamicFilterView {...filterConfig} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  storageTypeSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.border.default,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: macOSColors.text.secondary,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  storageTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  storageTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: macOSColors.background.input,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
  },
  storageTypeButtonActive: {
    backgroundColor: macOSColors.background.card,
  },
  storageTypeButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: macOSColors.text.muted,
  },
});
