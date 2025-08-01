import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  PanResponderInstance,
} from "react-native";
import {
  Query,
  Mutation,
  onlineManager,
  useQueryClient,
} from "@tanstack/react-query";
import QueriesList from "./_components/devtools/QueriesList";
import Svg, { Path } from "react-native-svg";
import MutationsList from "./_components/devtools/MutationsList";
import DevToolsHeader from "./_components/devtools/DevToolsHeader";
import { getQueryStatusLabel } from "./_components/_util/getQueryStatusLabel";

interface Props {
  setShowDevTools: React.Dispatch<React.SetStateAction<boolean>>;
  onSelectionChange?: (hasSelection: boolean) => void;
  panResponder?: PanResponderInstance;
  containerHeight?: number; // For modal environments
}

export default function DevTools({
  setShowDevTools,
  onSelectionChange,
  panResponder,
  containerHeight,
}: Props) {
  const queryClient = useQueryClient();
  const [showQueries, setShowQueries] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // Get intelligent default filter based on state priorities
  const getDefaultFilter = React.useCallback(() => {
    if (!queryClient) return null;

    try {
      if (showQueries) {
        // Query priority order: error > fetching > paused > stale > fresh
        const allQueries = queryClient.getQueryCache().findAll();
        const statusCounts = {
          error: 0,
          fetching: 0,
          paused: 0,
          stale: 0,
          fresh: 0,
          inactive: 0,
        };

        allQueries.forEach((query) => {
          const status = getQueryStatusLabel(query);
          statusCounts[status as keyof typeof statusCounts] =
            (statusCounts[status as keyof typeof statusCounts] || 0) + 1;
        });

        if (statusCounts.error > 0) return "error";
        if (statusCounts.fetching > 0) return "fetching";
        if (statusCounts.paused > 0) return "paused";
        if (statusCounts.stale > 0) return "stale";

        return null;
      } else {
        // Mutation priority order: error > pending > paused > success
        const allMutations = queryClient.getMutationCache().getAll();
        const mutationCounts = {
          error: 0,
          pending: 0,
          paused: 0,
          success: 0,
        };

        allMutations.forEach((mutation) => {
          const status = mutation.state.status;
          const isPaused = mutation.state.isPaused;

          if (isPaused) {
            mutationCounts.paused++;
          } else if (status === "error") {
            mutationCounts.error++;
          } else if (status === "pending") {
            mutationCounts.pending++;
          } else if (status === "success") {
            mutationCounts.success++;
          }
        });

        if (mutationCounts.error > 0) return "error";
        if (mutationCounts.pending > 0) return "pending";
        if (mutationCounts.paused > 0) return "paused";

        return null;
      }
    } catch (error) {
      return null;
    }
  }, [queryClient, showQueries]);

  // Apply intelligent default filter on component mount and when states change
  // Currently disabled - user requested no default filtering
  // React.useEffect(() => {
  //   if (activeFilter === null) {
  //     const defaultFilter = getDefaultFilter();
  //     if (defaultFilter) {
  //       setActiveFilter(defaultFilter);
  //     }
  //   }
  // }, [getDefaultFilter, activeFilter]);
  const [selectedQuery, setSelectedQuery] = useState<
    Query<any, any, any, any> | undefined
  >(undefined);
  const [selectedMutation, setSelectedMutation] = useState<
    Mutation<any, any, any, any> | undefined
  >(undefined);
  const [isOffline, setIsOffline] = useState(!onlineManager.isOnline());

  // Clear selections when switching tabs
  const handleTabChange = (newShowQueries: boolean) => {
    if (newShowQueries !== showQueries) {
      setSelectedQuery(undefined);
      setSelectedMutation(undefined);
      setActiveFilter(null); // Clear filter when switching tabs
    }
    setShowQueries(newShowQueries);
  };

  // Handle filter changes
  const handleFilterChange = (filter: string | null) => {
    setActiveFilter(filter);
    // Clear selection when filter changes
    setSelectedQuery(undefined);
    setSelectedMutation(undefined);
  };

  // Handle network toggle
  const handleToggleNetwork = () => {
    const newOfflineState = !isOffline;
    setIsOffline(newOfflineState);
    onlineManager.setOnline(!newOfflineState);
  };

  // Handle cache clearing
  const handleClearCache = () => {
    if (showQueries) {
      queryClient.getQueryCache().clear();
      setSelectedQuery(undefined);
    } else {
      queryClient.getMutationCache().clear();
      setSelectedMutation(undefined);
    }
  };

  // Notify parent when selection state changes
  React.useEffect(() => {
    const hasSelection =
      selectedQuery !== undefined || selectedMutation !== undefined;
    onSelectionChange?.(hasSelection);
  }, [selectedQuery, selectedMutation, onSelectionChange]);

  return (
    <View style={styles.container}>
      <View style={styles.devToolsPanel}>
        <DevToolsHeader
          showQueries={showQueries}
          setShowQueries={setShowQueries}
          setShowDevTools={setShowDevTools}
          onTabChange={handleTabChange}
          panResponder={panResponder}
          isOffline={isOffline}
          onToggleNetwork={handleToggleNetwork}
          onClearCache={handleClearCache}
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
        />
        <View style={styles.contentContainer}>
          {showQueries ? (
            <QueriesList
              selectedQuery={selectedQuery}
              setSelectedQuery={setSelectedQuery}
              activeFilter={activeFilter}
              containerHeight={containerHeight}
            />
          ) : (
            <MutationsList
              selectedMutation={selectedMutation}
              setSelectedMutation={setSelectedMutation}
              activeFilter={activeFilter}
            />
          )}
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171717",
  },
  devToolsPanel: {
    flex: 1,
    backgroundColor: "#171717",
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#171717",
  },
});
