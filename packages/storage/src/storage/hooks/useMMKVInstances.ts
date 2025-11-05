/**
 * useMMKVInstances Hook
 *
 * React hook to monitor all registered MMKV instances and their metadata.
 * Works with MMKVInstanceRegistry to provide UI components with instance information.
 *
 * This hook enables:
 * - Multi-instance dropdown/selector UI
 * - Instance metadata display (encrypted, readOnly, key count)
 * - Dynamic updates when instances are added/removed
 *
 * @see MMKVInstanceRegistry.ts for instance registration
 */

import { useState, useEffect } from 'react';
import { isMMKVAvailable } from '../utils/mmkvAvailability';

// Conditionally import registry
let mmkvInstanceRegistry: any;

if (isMMKVAvailable()) {
  const registry = require('../utils/MMKVInstanceRegistry');
  mmkvInstanceRegistry = registry.mmkvInstanceRegistry;
}

/**
 * Metadata about an MMKV instance with additional runtime information
 */
export interface MMKVInstanceMetadata {
  id: string;
  instance: any;
  encrypted: boolean;
  readOnly: boolean;
  keyCount: number;
  size?: number;
}

interface UseMMKVInstancesResult {
  instances: MMKVInstanceMetadata[];
  instanceCount: number;
  isLoading: boolean;
  refresh: () => void;
}

/**
 * Hook to monitor all registered MMKV instances
 *
 * @param autoRefresh - If true, refreshes every 1 second to detect new instances
 *
 * @returns Object containing instances array, count, and refresh function
 *
 * @example
 * ```typescript
 * import { useMMKVInstances } from '@react-buoy/storage';
 *
 * function MMKVInstanceSelector() {
 *   const { instances, instanceCount, refresh } = useMMKVInstances();
 *
 *   return (
 *     <View>
 *       <Text>Found {instanceCount} MMKV instances</Text>
 *       {instances.map(inst => (
 *         <TouchableOpacity key={inst.id} onPress={() => selectInstance(inst)}>
 *           <Text>{inst.id}</Text>
 *           <Text>{inst.keyCount} keys</Text>
 *           {inst.encrypted && <Text>🔒 Encrypted</Text>}
 *           {inst.readOnly && <Text>👁️ Read-only</Text>}
 *         </TouchableOpacity>
 *       ))}
 *       <Button onPress={refresh}>Refresh</Button>
 *     </View>
 *   );
 * }
 * ```
 */
export function useMMKVInstances(
  autoRefresh = false
): UseMMKVInstancesResult {
  const [instances, setInstances] = useState<MMKVInstanceMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all instances and their metadata
  const fetchInstances = () => {
    setIsLoading(true);

    try {
      // Guard: Check if MMKV is available
      if (!isMMKVAvailable() || !mmkvInstanceRegistry) {
        setInstances([]);
        setIsLoading(false);
        return; // Silently return empty when MMKV not available
      }

      const allInstances = mmkvInstanceRegistry.getAll();

      // Enhance with metadata
      const instancesWithMetadata: MMKVInstanceMetadata[] = allInstances.map(
        (instanceInfo: any) => {
          const { instance, id, encrypted, readOnly } = instanceInfo;

          // Get key count
          const keys = instance.getAllKeys();
          const keyCount = keys?.length || 0;

          // Get size if available (MMKV might not expose this directly)
          // For now, we don't have a direct way to get size
          const size = undefined;

          return {
            id,
            instance,
            encrypted,
            readOnly,
            keyCount,
            size,
          };
        }
      );

      setInstances(instancesWithMetadata);
    } catch (error) {
      console.error('[useMMKVInstances] Error fetching instances:', error);
      setInstances([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchInstances();
  }, []);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchInstances();
    }, 1000); // Refresh every second

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return {
    instances,
    instanceCount: instances.length,
    isLoading,
    refresh: fetchInstances,
  };
}

/**
 * Hook to monitor a single MMKV instance by ID
 *
 * @param instanceId - ID of the instance to monitor
 *
 * @returns Instance metadata or null if not found
 *
 * @example
 * ```typescript
 * function MMKVInstanceDetail({ instanceId }: { instanceId: string }) {
 *   const instance = useMMKVInstance(instanceId);
 *
 *   if (!instance) {
 *     return <Text>Instance not found</Text>;
 *   }
 *
 *   return (
 *     <View>
 *       <Text>ID: {instance.id}</Text>
 *       <Text>Keys: {instance.keyCount}</Text>
 *       <Text>Encrypted: {instance.encrypted ? 'Yes' : 'No'}</Text>
 *       <Text>Read-only: {instance.readOnly ? 'Yes' : 'No'}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useMMKVInstance(
  instanceId: string
): MMKVInstanceMetadata | null {
  const [instance, setInstance] = useState<MMKVInstanceMetadata | null>(null);

  useEffect(() => {
    // Guard: Check if MMKV is available
    if (!isMMKVAvailable() || !mmkvInstanceRegistry) {
      setInstance(null);
      return;
    }

    const instanceInfo = mmkvInstanceRegistry.get(instanceId);

    if (!instanceInfo) {
      setInstance(null);
      return;
    }

    const keys = instanceInfo.instance.getAllKeys();
    const keyCount = keys?.length || 0;

    setInstance({
      ...instanceInfo,
      keyCount,
      size: undefined,
    });
  }, [instanceId]);

  return instance;
}

/**
 * Hook to check if a specific instance ID is registered
 *
 * @param instanceId - ID to check
 *
 * @returns True if instance is registered
 *
 * @example
 * ```typescript
 * function MMKVStatus({ instanceId }: { instanceId: string }) {
 *   const isRegistered = useMMKVInstanceExists(instanceId);
 *
 *   return (
 *     <View>
 *       <Text>{instanceId}</Text>
 *       <Text>{isRegistered ? '✅ Registered' : '❌ Not registered'}</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useMMKVInstanceExists(instanceId: string): boolean {
  const [exists, setExists] = useState(false);

  useEffect(() => {
    // Guard: Check if MMKV is available
    if (!isMMKVAvailable() || !mmkvInstanceRegistry) {
      setExists(false);
      return;
    }

    setExists(mmkvInstanceRegistry.has(instanceId));
  }, [instanceId]);

  return exists;
}
