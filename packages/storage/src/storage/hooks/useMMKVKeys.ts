/**
 * useMMKVKeys Hook
 *
 * Fetch and validate MMKV keys from a specific MMKV instance.
 * Equivalent to useAsyncStorageKeys but for MMKV storage.
 *
 * Key Differences from AsyncStorage:
 * - Synchronous API (getAllKeys(), getString(), etc.)
 * - Native types (string, number, boolean, buffer) vs string-only
 * - Multi-instance support (requires instanceId parameter)
 * - No multiGet - must fetch keys individually
 */

import { useState, useEffect, useCallback } from 'react';
import { StorageKeyInfo, RequiredStorageKey } from '../types';
import { isMMKVAvailable } from '../utils/mmkvAvailability';

// Conditionally import MMKV types
type MMKV = any; // Use 'any' to avoid hard dependency on react-native-mmkv

// Conditionally import utilities only if MMKV is available
let detectMMKVType: any;
let isTypeMatch: any;

if (isMMKVAvailable()) {
  const typeDetection = require('../utils/mmkvTypeDetection');
  detectMMKVType = typeDetection.detectMMKVType;
  isTypeMatch = typeDetection.isTypeMatch;
}

interface UseMMKVKeysResult {
  storageKeys: StorageKeyInfo[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook to fetch and monitor keys from an MMKV instance
 *
 * @param instance - MMKV instance to monitor
 * @param instanceId - Unique identifier for this instance (e.g., "mmkv.default", "secure")
 * @param requiredStorageKeys - Optional array of required keys for validation
 *
 * @example
 * ```typescript
 * import { MMKV } from 'react-native-mmkv';
 * import { useMMKVKeys } from '@react-buoy/storage';
 *
 * const storage = new MMKV();
 *
 * function MyComponent() {
 *   const { storageKeys, isLoading, error, refresh } = useMMKVKeys(
 *     storage,
 *     'mmkv.default',
 *     [
 *       'user.token',
 *       { key: 'user.id', expectedType: 'number' },
 *       { key: 'app.theme', expectedValue: 'dark' }
 *     ]
 *   );
 *
 *   if (isLoading) return <LoadingSpinner />;
 *   if (error) return <ErrorMessage error={error} />;
 *
 *   return (
 *     <View>
 *       {storageKeys.map(keyInfo => (
 *         <StorageKeyCard key={keyInfo.key} keyInfo={keyInfo} />
 *       ))}
 *       <Button onPress={refresh}>Refresh</Button>
 *     </View>
 *   );
 * }
 * ```
 */
export function useMMKVKeys(
  instance: MMKV | null | undefined,
  instanceId: string,
  requiredStorageKeys: RequiredStorageKey[] = []
): UseMMKVKeysResult {
  // State management
  const [storageKeys, setStorageKeys] = useState<StorageKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all keys and values from MMKV instance
  const fetchStorageData = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      // Guard: Check if MMKV is available
      if (!isMMKVAvailable()) {
        setStorageKeys([]);
        setIsLoading(false);
        return; // Silently return empty when MMKV not available
      }

      // Guard: Check if instance is provided
      if (!instance) {
        setStorageKeys([]);
        setIsLoading(false);
        return; // Silently return empty when no instance
      }

      // 1. Get all keys from MMKV (synchronous)
      const allKeys = instance.getAllKeys();

      if (!allKeys || allKeys.length === 0) {
        // Still need to check for missing required keys
        const missingRequiredKeys = requiredStorageKeys.map((req) => {
          const key = typeof req === 'string' ? req : req.key;
          const description =
            typeof req === 'object' && 'description' in req
              ? req.description
              : undefined;
          const expectedValue =
            typeof req === 'object' && 'expectedValue' in req
              ? req.expectedValue
              : undefined;
          const expectedType =
            typeof req === 'object' && 'expectedType' in req
              ? req.expectedType
              : undefined;

          return {
            key,
            value: undefined,
            valueType: undefined,
            storageType: 'mmkv' as const,
            instanceId,
            status: 'required_missing' as const,
            category: 'required' as const,
            description,
            expectedValue,
            expectedType,
          };
        });

        setStorageKeys(missingRequiredKeys);
        setIsLoading(false);
        return;
      }

      // 2. Process each key to get value and type
      const allStorageKeys: StorageKeyInfo[] = [];

      allKeys.forEach((key: string) => {
        // Detect value and type using type detection utility
        const { value, type } = detectMMKVType(instance, key);

        // Check if this is a required key
        const requiredConfig = requiredStorageKeys.find((req) => {
          if (typeof req === 'string') return req === key;
          return req.key === key;
        });

        // Determine status based on validation rules
        let status: StorageKeyInfo['status'] = 'optional_present';

        if (requiredConfig) {
          if (value === undefined) {
            status = 'required_missing';
          } else if (
            typeof requiredConfig === 'object' &&
            'expectedValue' in requiredConfig
          ) {
            // Value validation
            status =
              String(value) === String(requiredConfig.expectedValue)
                ? 'required_present'
                : 'required_wrong_value';
          } else if (
            typeof requiredConfig === 'object' &&
            'expectedType' in requiredConfig
          ) {
            // Type validation
            status = isTypeMatch(type, requiredConfig.expectedType)
              ? 'required_present'
              : 'required_wrong_type';
          } else {
            // Key exists and is required (no specific validation)
            status = 'required_present';
          }
        }

        // Build StorageKeyInfo object
        const keyInfo: StorageKeyInfo = {
          key,
          value,
          valueType: type !== 'unknown' ? type : undefined,
          storageType: 'mmkv',
          instanceId,
          status,
          category: requiredConfig ? 'required' : 'optional',
          lastUpdated: new Date(),
          ...(typeof requiredConfig === 'object' &&
            'expectedValue' in requiredConfig && {
              expectedValue: requiredConfig.expectedValue,
            }),
          ...(typeof requiredConfig === 'object' &&
            'expectedType' in requiredConfig && {
              expectedType: requiredConfig.expectedType,
            }),
          ...(typeof requiredConfig === 'object' &&
            'description' in requiredConfig && {
              description: requiredConfig.description,
            }),
        };

        allStorageKeys.push(keyInfo);
      });

      // 3. Add missing required keys that weren't found in storage
      requiredStorageKeys.forEach((req) => {
        const key = typeof req === 'string' ? req : req.key;
        const exists = allStorageKeys.some((k) => k.key === key);

        if (!exists) {
          allStorageKeys.push({
            key,
            value: undefined,
            valueType: undefined,
            storageType: 'mmkv',
            instanceId,
            status: 'required_missing',
            category: 'required',
            ...(typeof req === 'object' &&
              'expectedValue' in req && {
                expectedValue: req.expectedValue,
              }),
            ...(typeof req === 'object' &&
              'expectedType' in req && {
                expectedType: req.expectedType,
              }),
            ...(typeof req === 'object' &&
              'description' in req && {
                description: req.description,
              }),
          });
        }
      });

      setStorageKeys(allStorageKeys);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error('Failed to fetch MMKV storage data')
      );
      setStorageKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, [instance, instanceId, requiredStorageKeys]);

  // Initial fetch
  useEffect(() => {
    fetchStorageData();
  }, [fetchStorageData]);

  return {
    storageKeys,
    isLoading,
    error,
    refresh: fetchStorageData,
  };
}

/**
 * Hook to fetch keys from multiple MMKV instances
 *
 * @param instances - Array of MMKV instances with their IDs
 * @param requiredStorageKeys - Optional array of required keys for validation
 *
 * @example
 * ```typescript
 * import { MMKV } from 'react-native-mmkv';
 * import { useMultiMMKVKeys } from '@react-buoy/storage';
 *
 * const defaultStorage = new MMKV();
 * const secureStorage = new MMKV({ id: 'secure', encryptionKey: key });
 *
 * function MyComponent() {
 *   const { storageKeys, isLoading, error } = useMultiMMKVKeys(
 *     [
 *       { instance: defaultStorage, id: 'mmkv.default' },
 *       { instance: secureStorage, id: 'secure' }
 *     ],
 *     ['user.token', 'app.theme']
 *   );
 *
 *   // storageKeys will contain keys from both instances
 *   // with instanceId field to identify which instance each key belongs to
 * }
 * ```
 */
export function useMultiMMKVKeys(
  instances: Array<{ instance: MMKV; id: string }>,
  requiredStorageKeys: RequiredStorageKey[] = []
): UseMMKVKeysResult {
  const [storageKeys, setStorageKeys] = useState<StorageKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStorageData = useCallback(() => {
    setIsLoading(true);
    setError(null);

    try {
      const allStorageKeys: StorageKeyInfo[] = [];

      // Fetch keys from each instance
      instances.forEach(({ instance, id }) => {
        const allKeys = instance.getAllKeys();

        if (!allKeys || allKeys.length === 0) {
          return;
        }

        allKeys.forEach((key: string) => {
          const { value, type } = detectMMKVType(instance, key);

          const requiredConfig = requiredStorageKeys.find((req) => {
            if (typeof req === 'string') return req === key;
            return req.key === key;
          });

          let status: StorageKeyInfo['status'] = 'optional_present';

          if (requiredConfig) {
            if (value === undefined) {
              status = 'required_missing';
            } else if (
              typeof requiredConfig === 'object' &&
              'expectedValue' in requiredConfig
            ) {
              status =
                String(value) === String(requiredConfig.expectedValue)
                  ? 'required_present'
                  : 'required_wrong_value';
            } else if (
              typeof requiredConfig === 'object' &&
              'expectedType' in requiredConfig
            ) {
              status = isTypeMatch(type, requiredConfig.expectedType)
                ? 'required_present'
                : 'required_wrong_type';
            } else {
              status = 'required_present';
            }
          }

          const keyInfo: StorageKeyInfo = {
            key,
            value,
            valueType: type !== 'unknown' ? type : undefined,
            storageType: 'mmkv',
            instanceId: id,
            status,
            category: requiredConfig ? 'required' : 'optional',
            lastUpdated: new Date(),
            ...(typeof requiredConfig === 'object' &&
              'expectedValue' in requiredConfig && {
                expectedValue: requiredConfig.expectedValue,
              }),
            ...(typeof requiredConfig === 'object' &&
              'expectedType' in requiredConfig && {
                expectedType: requiredConfig.expectedType,
              }),
            ...(typeof requiredConfig === 'object' &&
              'description' in requiredConfig && {
                description: requiredConfig.description,
              }),
          };

          allStorageKeys.push(keyInfo);
        });
      });

      // Add missing required keys
      requiredStorageKeys.forEach((req) => {
        const key = typeof req === 'string' ? req : req.key;
        const exists = allStorageKeys.some((k) => k.key === key);

        if (!exists) {
          // Add missing key for first instance (or all instances?)
          // For now, add to first instance
          const firstInstanceId = instances[0]?.id || 'mmkv.default';

          allStorageKeys.push({
            key,
            value: undefined,
            valueType: undefined,
            storageType: 'mmkv',
            instanceId: firstInstanceId,
            status: 'required_missing',
            category: 'required',
            ...(typeof req === 'object' &&
              'expectedValue' in req && {
                expectedValue: req.expectedValue,
              }),
            ...(typeof req === 'object' &&
              'expectedType' in req && {
                expectedType: req.expectedType,
              }),
            ...(typeof req === 'object' &&
              'description' in req && {
                description: req.description,
              }),
          });
        }
      });

      setStorageKeys(allStorageKeys);
    } catch (err) {
      setError(
        err instanceof Error
          ? err
          : new Error('Failed to fetch multi-MMKV storage data')
      );
      setStorageKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, [instances, requiredStorageKeys]);

  useEffect(() => {
    fetchStorageData();
  }, [fetchStorageData]);

  return {
    storageKeys,
    isLoading,
    error,
    refresh: fetchStorageData,
  };
}
