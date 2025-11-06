import { useState, useEffect, useCallback } from 'react';
import { safeAsyncStorage as AsyncStorage } from '../utils/safeAsyncStorage';
import { StorageKeyInfo, RequiredStorageKey } from '../types';

interface UseAsyncStorageKeysResult {
  storageKeys: StorageKeyInfo[];
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useAsyncStorageKeys(
  requiredStorageKeys: RequiredStorageKey[] = []
): UseAsyncStorageKeysResult {
  // State management
  const [storageKeys, setStorageKeys] = useState<StorageKeyInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all keys and values from AsyncStorage
  const fetchStorageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Get all keys from AsyncStorage
      const allKeys = await AsyncStorage.getAllKeys();

      if (!allKeys || allKeys.length === 0) {
        setStorageKeys([]);
        setIsLoading(false);
        return;
      }

      // 2. Get all values using multiGet
      const allKeyValuePairs = await AsyncStorage.multiGet(allKeys);

      // 3. Process keys into StorageKeyInfo format
      const allStorageKeys: StorageKeyInfo[] = [];

      allKeyValuePairs.forEach(([key, value]) => {
        // Parse value
        let parsedValue: unknown = value;
        if (value) {
          try {
            parsedValue = JSON.parse(value);
          } catch {
            parsedValue = value; // Keep as string if not JSON
          }
        }

        // Check if this is a required key
        const requiredConfig = requiredStorageKeys.find((req) => {
          if (typeof req === 'string') return req === key;
          return req.key === key;
        });

        // Determine status
        let status: StorageKeyInfo['status'] = 'optional_present';

        if (requiredConfig) {
          if (parsedValue === undefined || parsedValue === null) {
            status = 'required_missing';
          } else if (
            typeof requiredConfig === 'object' &&
            'expectedValue' in requiredConfig
          ) {
            status =
              parsedValue === requiredConfig.expectedValue
                ? 'required_present'
                : 'required_wrong_value';
          } else if (
            typeof requiredConfig === 'object' &&
            'expectedType' in requiredConfig
          ) {
            const actualType = parsedValue === null ? 'null' : typeof parsedValue;
            status =
              actualType.toLowerCase() ===
              requiredConfig.expectedType.toLowerCase()
                ? 'required_present'
                : 'required_wrong_type';
          } else {
            status = 'required_present';
          }
        }

        const keyInfo: StorageKeyInfo = {
          key,
          value: parsedValue,
          storageType: 'async',
          status,
          category: requiredConfig ? 'required' : 'optional',
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

      // 4. Add missing required keys
      requiredStorageKeys.forEach((req) => {
        const key = typeof req === 'string' ? req : req.key;
        const exists = allStorageKeys.some((k) => k.key === key);

        if (!exists) {
          allStorageKeys.push({
            key,
            value: undefined,
            storageType: 'async',
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
      setError(err instanceof Error ? err : new Error('Failed to fetch storage data'));
      setStorageKeys([]);
    } finally {
      setIsLoading(false);
    }
  }, [requiredStorageKeys]);

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
