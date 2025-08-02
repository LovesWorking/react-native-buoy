import { useState, useEffect } from "react";
import { Query, QueryKey } from "@tanstack/react-query";
import { useModalPersistence } from "./useModalPersistence";

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

  // Persistence hook for saving/loading modal state
  const { loadSavedState } = useModalPersistence({
    storagePrefix: "@dev_tools_modal_state",
    isModalOpen,
    isDebugModalOpen,
    selectedQueryKey,
    selectedSection,
    activeFilter,
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
            } catch (error) {
              // Silently fail if query key can't be parsed
            }
          }

          if (savedState.selectedSection) {
            setSelectedSection(savedState.selectedSection);
          }

          if (savedState.activeFilter) {
            setActiveFilter(savedState.activeFilter);
          }
        }
      } catch (error) {
        // Silently fail if state can't be restored
      } finally {
        setIsStateRestored(true);
      }
    };

    restoreState();
  }, []);

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

  return {
    isModalOpen,
    isDebugModalOpen,
    selectedQueryKey,
    selectedSection,
    activeFilter,
    isStateRestored,
    setSelectedSection,
    setActiveFilter,
    handleModalDismiss,
    handleDebugModalDismiss,
    handleQuerySelect,
    handleQueryPress,
    handleStatusPress,
  };
}
