import { useState, useEffect } from "react";
import { Mutation, Query, QueryKey } from "@tanstack/react-query";
import { useModalPersistence } from "./useModalPersistence";
import { StorageType } from "../../../_util/storageQueryUtils";

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
  const [isStateRestored, setIsStateRestored] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "queries" | "mutations" | "storage"
  >("queries");
  const [selectedMutationId, setSelectedMutationId] = useState<
    number | undefined
  >(undefined);
  const [activeStorageTypes, setActiveStorageTypes] = useState<
    Set<StorageType>
  >(new Set(["mmkv", "async", "secure"]));

  // Persistence hook for saving/loading modal state
  const { loadSavedState } = useModalPersistence({
    storagePrefix: "@dev_tools_modal_state",
    isModalOpen,
    isDebugModalOpen,
    selectedQueryKey,
    selectedSection,
    activeFilter,
    activeTab,
    selectedMutationId,
    activeStorageTypes,
    isStateRestored,
  });

  // Restore saved modal state on component mount
  useEffect(() => {
    const restoreState = async () => {
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
          if (savedState.activeStorageTypes) {
            try {
              const storageTypesArray = JSON.parse(
                savedState.activeStorageTypes
              ) as StorageType[];
              setActiveStorageTypes(new Set(storageTypesArray));
            } catch {
              // Silently fail if storage types can't be parsed, use default
            }
          }
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

  const handleTabChange = (newTab: "queries" | "mutations" | "storage") => {
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
    activeStorageTypes,
    setSelectedSection,
    setActiveFilter,
    setActiveTab,
    setActiveStorageTypes,
    handleModalDismiss,
    handleDebugModalDismiss,
    handleQuerySelect,
    handleQueryPress,
    handleStatusPress,
    handleTabChange,
    handleMutationSelect,
  };
}
