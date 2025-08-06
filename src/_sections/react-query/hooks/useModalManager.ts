import { useState, useEffect } from "react";
import { Mutation, Query, QueryKey } from "@tanstack/react-query";
import { useModalPersistence } from "./useModalPersistence";
import { devToolsStorageKeys } from "../../../_shared/storage/devToolsStorageKeys";

/**
 * Custom hook for managing modal states and related query selection
 * Enhanced with persistence following composition principles
 * Restores modal state on app restart
 */
export function useModalManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [selectedQueryKey, setSelectedQueryKey] = useState<
    QueryKey | undefined
  >(undefined);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isStateRestored, setIsStateRestored] = useState(true); // Default to true to show bubble immediately
  const [activeTab, setActiveTab] = useState<
    "queries" | "mutations"
  >("queries");
  const [selectedMutationId, setSelectedMutationId] = useState<
    number | undefined
  >(undefined);

  // Persistence hook for saving/loading modal state
  const { loadSavedState } = useModalPersistence({
    storagePrefix: devToolsStorageKeys.modal.state(),
    isModalOpen,
    isDebugModalOpen,
    selectedQueryKey,
    selectedSection,
    activeFilter,
    activeTab,
    selectedMutationId,
    isStateRestored,
  });

  // Restore saved modal state on component mount
  useEffect(() => {
    const restoreState = async () => {
      setIsStateRestored(false); // Set to false while loading
      try {
        const savedState = await loadSavedState();

        if (savedState) {
          setIsModalOpen(savedState.isModalOpen);
          setIsDebugModalOpen(savedState.isDebugModalOpen);

          if (savedState.selectedQueryKey) {
            try {
              const queryKey = JSON.parse(savedState.selectedQueryKey);
              setSelectedQueryKey(queryKey);
            } catch {
              // Silently fail if query key can't be parsed
            }
          }

          if (savedState.selectedSection) {
            setSelectedSection(savedState.selectedSection);
          }

          if (savedState.activeFilter) {
            setActiveFilter(savedState.activeFilter);
          }

          if (savedState.activeTab) {
            setActiveTab(savedState.activeTab);
          }
          if (savedState.selectedMutationId) {
            setSelectedMutationId(Number(savedState.selectedMutationId));
          }
          // Note: activeStorageTypes removed - no longer filtering storage types
        }
      } catch {
        // Silently fail if state can't be restored
      } finally {
        setIsStateRestored(true);
      }
    };

    restoreState();
  }, [loadSavedState]);

  const handleModalDismiss = () => {
    setIsModalOpen(false);
    setSelectedQueryKey(undefined);
    // Note: Keep activeFilter when dismissing - user might want to maintain filter on next open
  };

  const handleDebugModalDismiss = () => {
    setIsDebugModalOpen(false);
    setSelectedSection(null);
  };

  const handleQuerySelect = (query: Query | undefined) => {
    setSelectedQueryKey(query?.queryKey);
  };

  const handleQueryPress = () => {
    setIsModalOpen(true);
  };

  const handleStatusPress = () => {
    setIsDebugModalOpen(true);
  };

  const handleMutationSelect = (mutation: Mutation | undefined) => {
    setSelectedMutationId(mutation?.mutationId);
  };

  const handleTabChange = (newTab: "queries" | "mutations") => {
    if (newTab !== activeTab) {
      setSelectedQueryKey(undefined);
      setSelectedMutationId(undefined);
      // Reset query status filters when switching tabs (they don't apply to storage)
      setActiveFilter(null);
    }
    setActiveTab(newTab);
  };

  return {
    isModalOpen,
    isDebugModalOpen,
    selectedQueryKey,
    selectedSection,
    activeFilter,
    isStateRestored,
    activeTab,
    selectedMutationId,
    setSelectedSection,
    setActiveFilter,
    setActiveTab,
    handleModalDismiss,
    handleDebugModalDismiss,
    handleQuerySelect,
    handleQueryPress,
    handleStatusPress,
    handleTabChange,
    handleMutationSelect,
  };
}
