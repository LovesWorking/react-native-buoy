import { useEffect } from "react";
import { QueryKey } from "@tanstack/react-query";
import {
  saveModalVisibilityState,
  loadModalVisibilityState,
  clearModalVisibilityState,
  ModalVisibilityState,
} from "../components/storage/modalStorageOperations";
import { StorageType } from "../../../_util/storageQueryUtils";

interface UseModalPersistenceProps {
  storagePrefix: string;
  isModalOpen: boolean;
  isDebugModalOpen: boolean;
  selectedQueryKey?: QueryKey;
  selectedSection?: string | null;
  activeFilter?: string | null; // React Query filter state
  activeTab?: "queries" | "mutations" | "storage";
  selectedMutationId?: number | undefined;
  activeStorageTypes?: Set<StorageType>; // Storage type filter state
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
  selectedQueryKey,
  selectedSection,
  activeFilter,
  activeTab,
  selectedMutationId,
  activeStorageTypes,
  isStateRestored,
}: UseModalPersistenceProps): UseModalPersistenceReturn {
  const saveCurrentState = async () => {
    const state: ModalVisibilityState = {
      isModalOpen,
      isDebugModalOpen,
      selectedQueryKey: selectedQueryKey
        ? JSON.stringify(selectedQueryKey)
        : undefined,
      selectedSection: selectedSection || undefined,
      activeFilter: activeFilter || undefined,
      activeTab: activeTab || undefined,
      selectedMutationId: selectedMutationId?.toString() || undefined,
      activeStorageTypes: activeStorageTypes
        ? JSON.stringify(Array.from(activeStorageTypes))
        : undefined,
    };

    await saveModalVisibilityState(storagePrefix, state);
  };

  const loadSavedState = async (): Promise<ModalVisibilityState | null> => {
    return await loadModalVisibilityState(storagePrefix);
  };

  const clearSavedState = async () => {
    await clearModalVisibilityState(storagePrefix);
  };

  // Auto-save state when modal state changes
  useEffect(() => {
    // Don't persist anything until state restoration is complete to avoid race condition
    if (!isStateRestored) {
      return;
    }

    // Only save if a modal is actually open to avoid saving closed state
    if (isModalOpen || isDebugModalOpen) {
      saveCurrentState();
    } else {
      // Clear saved state when all modals are closed
      clearSavedState();
    }
  }, [
    isModalOpen,
    isDebugModalOpen,
    selectedQueryKey,
    selectedSection,
    activeFilter,
    activeTab,
    selectedMutationId,
    activeStorageTypes,
    isStateRestored,
  ]);

  return {
    saveCurrentState,
    loadSavedState,
    clearSavedState,
  };
}
