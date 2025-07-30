import React from "react";
import { View, StyleSheet } from "react-native";
import QueryStatus from "./QueryStatus";
import useQueryStatusCounts from "../_hooks/useQueryStatusCounts";

interface QueryStatusCountProps {
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

const QueryStatusCount: React.FC<QueryStatusCountProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const { fresh, stale, fetching, paused, inactive } = useQueryStatusCounts();

  const handleFilterClick = (filter: string) => {
    if (onFilterChange) {
      // Toggle filter: if already active, clear it; otherwise set it
      onFilterChange(activeFilter === filter ? null : filter);
    }
  };

  return (
    <View style={styles.queryStatusContainer}>
      <QueryStatus
        label="Fresh"
        color="green"
        count={fresh}
        isActive={activeFilter === "fresh"}
        onPress={() => handleFilterClick("fresh")}
        showLabel={activeFilter === "fresh"}
      />
      <QueryStatus
        label="Loading"
        color="blue"
        count={fetching}
        isActive={activeFilter === "fetching"}
        onPress={() => handleFilterClick("fetching")}
        showLabel={activeFilter === "fetching"}
      />
      <QueryStatus
        label="Paused"
        color="purple"
        count={paused}
        isActive={activeFilter === "paused"}
        onPress={() => handleFilterClick("paused")}
        showLabel={activeFilter === "paused"}
      />
      <QueryStatus
        label="Stale"
        color="yellow"
        count={stale}
        isActive={activeFilter === "stale"}
        onPress={() => handleFilterClick("stale")}
        showLabel={activeFilter === "stale"}
      />
      <QueryStatus
        label="Idle"
        color="gray"
        count={inactive}
        isActive={activeFilter === "inactive"}
        onPress={() => handleFilterClick("inactive")}
        showLabel={activeFilter === "inactive"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  queryStatusContainer: {
    flexDirection: "row",
    flexWrap: "nowrap", // Prevent wrapping
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 2,
    paddingHorizontal: 4,
    overflow: "hidden", // Hide any overflow
  },
});

export default QueryStatusCount;
