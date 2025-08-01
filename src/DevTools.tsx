import React, { useState } from "react";
import { View, StyleSheet, PanResponderInstance } from "react-native";
import {
  Query,
  Mutation,
  onlineManager,
  useQueryClient,
} from "@tanstack/react-query";
import QueriesList from "./_components/devtools/QueriesList";
import MutationsList from "./_components/devtools/MutationsList";
import DevToolsHeader from "./_components/devtools/DevToolsHeader";

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
