import { useEffect, useCallback } from "react";
import { QueryKey } from "@tanstack/react-query";
import {
  saveModalVisibilityState,
  loadModalVisibilityState,
  clearModalVisibilityState,
  ModalVisibilityState,
} from "../utils/modalStorageOperations";

interface UseModalPersistenceProps {
  storagePrefix: string;
  isModalOpen: boolean;
  isDebugModalOpen: boolean;
  isEnvModalOpen?: boolean;
  isSentryModalOpen?: boolean;
  isStorageModalOpen?: boolean;
  selectedQueryKey?: QueryKey;
  selectedSection?: string | null;
  activeFilter?: string | null; // React Query filter state
  activeTab?: "queries" | "mutations";
  selectedMutationId?: number | undefined;
  isStateRestored: boolean; // Prevent clearing storage before restoration completes
}

interface UseModalPersistenceReturn {
  saveCurrentState: () => Promise<void>;
  loadSavedState: () => Promise<ModalVisibilityState | null>;
  clearSavedState: () => Promise<void>;
}

/**
 * Hook for persisting modal state following "Extract Reusable Logic" principle
 * Manages saving/loading modal visibility and selection state across app restarts
 */
export function useModalPersistence({
  storagePrefix,
  isModalOpen,
  isDebugModalOpen,
  isEnvModalOpen = false,
  isSentryModalOpen = false,
  isStorageModalOpen = false,
  selectedQueryKey,
  selectedSection,
  activeFilter,
  activeTab,
  selectedMutationId,
  isStateRestored,
}: UseModalPersistenceProps): UseModalPersistenceReturn {
  const saveCurrentState = useCallback(async () => {
    const state: ModalVisibilityState = {
      isModalOpen,
      isDebugModalOpen,
      isEnvModalOpen,
      isSentryModalOpen,
      isStorageModalOpen,
      selectedQueryKey: selectedQueryKey
        ? JSON.stringify(selectedQueryKey)
        : undefined,
      selectedSection: selectedSection || undefined,
      activeFilter: activeFilter || undefined,
      activeTab: activeTab || undefined,
      selectedMutationId: selectedMutationId?.toString() || undefined,
    };

    await saveModalVisibilityState(storagePrefix, state);
  }, [
    storagePrefix,
    isModalOpen,
    isDebugModalOpen,
    isEnvModalOpen,
    isSentryModalOpen,
    isStorageModalOpen,
    selectedQueryKey,
    selectedSection,
    activeFilter,
    activeTab,
    selectedMutationId,
  ]);

  const loadSavedState =
    useCallback(async (): Promise<ModalVisibilityState | null> => {
      return await loadModalVisibilityState(storagePrefix);
    }, [storagePrefix]);

  const clearSavedState = useCallback(async () => {
    await clearModalVisibilityState(storagePrefix);
  }, [storagePrefix]);

  // Auto-save state when modal state changes
  useEffect(() => {
    // Don't persist anything until state restoration is complete to avoid race condition
    if (!isStateRestored) {
      return;
    }

    // Only save if a modal is actually open to avoid saving closed state
    if (isModalOpen || isDebugModalOpen || isEnvModalOpen || isSentryModalOpen || isStorageModalOpen) {
      saveCurrentState();
    } else {
      // Clear saved state when all modals are closed
      clearSavedState();
    }
  }, [
    isModalOpen,
    isDebugModalOpen,
    isEnvModalOpen,
    isSentryModalOpen,
    isStorageModalOpen,
    selectedQueryKey,
    selectedSection,
    activeFilter,
    activeTab,
    selectedMutationId,
    isStateRestored,
    saveCurrentState,
    clearSavedState,
  ]);

  return {
    saveCurrentState,
    loadSavedState,
    clearSavedState,
  };
}
