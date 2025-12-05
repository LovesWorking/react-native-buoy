import { useCallback, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StorageKeyInfo } from "../types";
import { StorageKeyRow } from "./StorageKeyRow";
import { SectionHeader } from "@react-buoy/shared-ui";

interface StorageKeySectionProps {
  title: string;
  count: number;
  keys: StorageKeyInfo[];
  emptyMessage: string;
  headerColor?: string;
  /** Whether selection mode is active */
  isSelectMode?: boolean;
  /** Set of selected key identifiers (storageType-instanceId-key) */
  selectedKeys?: Set<string>;
  /** Callback when selection changes */
  onSelectionChange?: (storageKey: StorageKeyInfo, selected: boolean) => void;
}

/**
 * Storage key section component following composition principles [[rule3]]
 *
 * Applied principles:
 * - Decompose by Responsibility: Single purpose component for grouped storage keys
 * - Prefer Composition over Configuration: Reuses patterns from EnvVarSection
 * - Extract Reusable Logic: Shares expansion state management pattern
 */
export function StorageKeySection({
  title,
  count,
  keys,
  emptyMessage,
  headerColor,
  isSelectMode = false,
  selectedKeys = new Set(),
  onSelectionChange,
}: StorageKeySectionProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  const handleKeyPress = useCallback((storageKey: StorageKeyInfo) => {
    setExpandedKey(prev => prev === storageKey.key ? null : storageKey.key);
  }, []);

  // Generate unique identifier for a storage key
  const getKeyIdentifier = useCallback((storageKey: StorageKeyInfo): string => {
    return storageKey.instanceId
      ? `${storageKey.storageType}-${storageKey.instanceId}-${storageKey.key}`
      : `${storageKey.storageType}-${storageKey.key}`;
  }, []);

  if (keys.length === 0 && title === "Required Keys") {
    return (
      <View style={styles.sectionContainer}>
        <SectionHeader>
          <SectionHeader.Title>{title}</SectionHeader.Title>
          <SectionHeader.Badge count={0} color={headerColor} />
        </SectionHeader>
        <View style={styles.emptySection}>
          <Text style={styles.emptySectionText}>{emptyMessage}</Text>
        </View>
      </View>
    );
  }

  if (keys.length === 0) return null;

  return (
    <View style={styles.sectionContainer}>
      {title && (
        <SectionHeader>
          <SectionHeader.Title>{title}</SectionHeader.Title>
          {count >= 0 && (
            <SectionHeader.Badge count={count} color={headerColor} />
          )}
        </SectionHeader>
      )}
      <View style={styles.sectionContent}>
        {keys.map((storageKey) => {
          // Create unique key by combining storage type, instance ID (if present), and key name
          const uniqueKey = getKeyIdentifier(storageKey);

          return (
            <StorageKeyRow
              key={uniqueKey}
              storageKey={storageKey}
              isExpanded={!isSelectMode && expandedKey === storageKey.key}
              onPress={handleKeyPress}
              isSelectMode={isSelectMode}
              isSelected={selectedKeys.has(uniqueKey)}
              onSelectionChange={onSelectionChange}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    gap: 8,
  },
  sectionContent: {
    // No gap needed, StorageKeyRow has its own margins
  },
  emptySection: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
  },
  emptySectionText: {
    color: "#6B7280",
    fontSize: 11,
    textAlign: "center",
  },
});
