import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { RefreshCw, Download, Trash2 } from "lucide-react-native";
import { useState, useCallback } from "react";
import superjson from "superjson";
import { StorageKeyInfo } from "../types";
import { copyToClipboard } from "../../../_shared/clipboard/copyToClipboard";
import { clearAllStorageIncludingDevTools } from "../utils/clearAllStorage";

interface StorageActionsProps {
  storageKeys: StorageKeyInfo[];
  onClearAll: () => Promise<void>;
  onRefresh: () => Promise<void>;
  totalCount: number;
}

type CopyStatus = 'idle' | 'success' | 'error';

export function StorageActions({ 
  storageKeys, 
  onClearAll, 
  onRefresh,
  totalCount
}: StorageActionsProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [onRefresh]);

  const handleExport = () => {
    Alert.alert(
      'Export Storage Data',
      'Choose export format:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Simple (Key-Value)',
          onPress: handleCopySimple,
        },
        {
          text: 'Full (With Metadata)',
          onPress: handleCopyFull,
        },
      ],
    );
  };

  const handleCopyFull = async () => {
    try {
      const storageData = storageKeys.reduce((acc, keyInfo) => {
        acc[keyInfo.key] = {
          value: keyInfo.value,
          type: keyInfo.storageType,
          status: keyInfo.status,
          category: keyInfo.category,
        };
        return acc;
      }, {} as Record<string, unknown>);

      const serialized = superjson.stringify(storageData);
      const success = await copyToClipboard(serialized);
      
      if (success) {
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
        console.log('[Storage] Full export copied to clipboard');
      } else {
        throw new Error('Failed to copy to clipboard');
      }
    } catch (error) {
      console.error('Failed to copy storage data:', error);
      Alert.alert('Error', 'Failed to copy storage data');
    }
  };

  const handleCopySimple = async () => {
    try {
      const simpleData = storageKeys.reduce((acc, keyInfo) => {
        acc[keyInfo.key] = keyInfo.value;
        return acc;
      }, {} as Record<string, unknown>);

      const serialized = superjson.stringify(simpleData);
      const success = await copyToClipboard(serialized);
      
      if (success) {
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
        console.log('[Storage] Simple export copied to clipboard');
      } else {
        throw new Error('Failed to copy to clipboard');
      }
    } catch (error) {
      console.error('Failed to copy storage data:', error);
      Alert.alert('Error', 'Failed to copy storage data');
    }
  };

  const handleClear = () => {
    Alert.alert(
      'Clear Storage',
      'Choose what to clear:',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear App Data',
          onPress: handleClearAppData,
        },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: handleClearEverything,
        },
      ],
    );
  };

  const handleClearAppData = async () => {
    try {
      await onClearAll();
      await onRefresh(); // Auto-refresh after clearing
      console.log('[Storage] App data cleared successfully');
    } catch (error) {
      console.error('Failed to clear storage:', error);
      Alert.alert('Error', `Failed to clear storage: ${error}`);
    }
  };

  const handleClearEverything = async () => {
    // Extra confirmation for clearing everything
    Alert.alert(
      '⚠️ Confirm Clear Everything',
      'This will clear ALL storage including dev tools settings. You will need to restart the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear Everything', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await clearAllStorageIncludingDevTools();
              if (typeof window !== 'undefined' && window.location) {
                window.location.reload();
              } else {
                Alert.alert(
                  'Success', 
                  'All storage cleared. Please restart the app.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              console.error('Failed to clear all storage:', error);
              Alert.alert('Error', `Failed to clear all storage: ${error}`);
            }
          }
        },
      ],
    );
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.leftSection}>
        <Text style={styles.keyCount}>
          {totalCount} {totalCount === 1 ? 'key' : 'keys'} found
        </Text>
        {copyStatus === 'success' && (
          <View style={styles.copiedBadge}>
            <Text style={styles.copiedText}>Copied!</Text>
          </View>
        )}
      </View>
      
      <View style={styles.headerActions}>
        <TouchableOpacity
          sentry-label="ignore storage refresh button"
          onPress={handleRefresh}
          style={[styles.iconButton, isRefreshing && styles.activeButton]}
          accessibilityLabel="Refresh storage"
        >
          <RefreshCw 
            size={16} 
            color={isRefreshing ? "#10B981" : "#9CA3AF"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          sentry-label="ignore storage export button"
          onPress={handleExport}
          style={styles.iconButton}
          accessibilityLabel="Export storage data"
        >
          <Download size={16} color="#3B82F6" />
        </TouchableOpacity>
        
        <TouchableOpacity
          sentry-label="ignore storage clear button"
          onPress={handleClear}
          style={styles.iconButton}
          accessibilityLabel="Clear storage"
        >
          <Trash2 size={16} color="#F87171" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Header styles matching Sentry pattern
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  keyCount: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  copiedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  copiedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
});