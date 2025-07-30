import React from "react";
import { View, StyleSheet } from "react-native";
import QueryStatus from "./QueryStatus";
import { useMutationStatusCounts } from "../_hooks/useQueryStatusCounts";

interface MutationStatusCountProps {
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

const MutationStatusCount: React.FC<MutationStatusCountProps> = ({
  activeFilter,
  onFilterChange,
}) => {
  const { pending, success, error, paused } = useMutationStatusCounts();

  const handleFilterClick = (filter: string) => {
    if (onFilterChange) {
      // Toggle filter: if already active, clear it; otherwise set it
      onFilterChange(activeFilter === filter ? null : filter);
    }
  };

  return (
    <View style={styles.mutationStatusContainer}>
      <QueryStatus
        label="Error"
        color="red"
        count={error}
        isActive={activeFilter === "error"}
        onPress={() => handleFilterClick("error")}
        showLabel={activeFilter === "error"}
      />
      <QueryStatus
        label="Pending"
        color="blue"
        count={pending}
        isActive={activeFilter === "pending"}
        onPress={() => handleFilterClick("pending")}
        showLabel={activeFilter === "pending"}
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
        label="Success"
        color="green"
        count={success}
        isActive={activeFilter === "success"}
        onPress={() => handleFilterClick("success")}
        showLabel={activeFilter === "success"}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  mutationStatusContainer: {
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

export default MutationStatusCount;
