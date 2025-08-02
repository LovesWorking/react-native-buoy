import { useState } from "react";
import { Query, QueryKey } from "@tanstack/react-query";

/**
 * Custom hook for managing modal states and related query selection
 * Extracted from main component following composition principles
 */
export function useModalManager() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);
  const [selectedQueryKey, setSelectedQueryKey] = useState<
    QueryKey | undefined
  >(undefined);

  const handleModalDismiss = () => {
    setIsModalOpen(false);
  };

  const handleDebugModalDismiss = () => {
    setIsDebugModalOpen(false);
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
    handleModalDismiss,
    handleDebugModalDismiss,
    handleQuerySelect,
    handleQueryPress,
    handleStatusPress,
  };
}
