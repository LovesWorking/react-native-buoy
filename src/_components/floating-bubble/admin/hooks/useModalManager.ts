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
    console.log("🚀 [MODAL MANAGER] Starting modal state restoration...");

    const restoreState = async () => {
      try {
        console.log("🔍 [MODAL MANAGER] Loading saved state...");
        const savedState = await loadSavedState();

        console.log("📋 [MODAL MANAGER] Loaded state:", savedState);

        if (savedState) {
          console.log("🔄 [MODAL MANAGER] Restoring modal states:", {
            willSetIsModalOpen: savedState.isModalOpen,
            willSetIsDebugModalOpen: savedState.isDebugModalOpen,
            selectedQueryKey: savedState.selectedQueryKey,
            selectedSection: savedState.selectedSection,
            activeFilter: savedState.activeFilter,
          });

          setIsModalOpen(savedState.isModalOpen);
          setIsDebugModalOpen(savedState.isDebugModalOpen);

          if (savedState.selectedQueryKey) {
            try {
              const queryKey = JSON.parse(savedState.selectedQueryKey);
              console.log("🔑 [MODAL MANAGER] Restoring query key:", queryKey);
              setSelectedQueryKey(queryKey);
            } catch (error) {
              console.error(
                "❌ [MODAL MANAGER] Failed to parse saved query key:",
                error
              );
            }
          }

          if (savedState.selectedSection) {
            console.log(
              "📑 [MODAL MANAGER] Restoring selected section:",
              savedState.selectedSection
            );
            setSelectedSection(savedState.selectedSection);
          }

          if (savedState.activeFilter) {
            console.log(
              "🔍 [MODAL MANAGER] Restoring active filter:",
              savedState.activeFilter
            );
            setActiveFilter(savedState.activeFilter);
          }

          console.log("✅ [MODAL MANAGER] Modal state restoration completed");
        } else {
          console.log(
            "ℹ️ [MODAL MANAGER] No saved state found, using defaults"
          );
        }
      } catch (error) {
        console.error(
          "❌ [MODAL MANAGER] Failed to restore modal state:",
          error
        );
      } finally {
        console.log("🏁 [MODAL MANAGER] Setting isStateRestored = true");
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
