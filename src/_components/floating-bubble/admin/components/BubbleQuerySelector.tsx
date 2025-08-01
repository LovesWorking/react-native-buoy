import React, { useState } from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Query } from "@tanstack/react-query";
import { Search, AlertTriangle } from "lucide-react-native";
import { useSafeQueries } from "../hooks/useSafeQueries";
import { QuerySelector } from "./QuerySelector";
import { getQueryStatusColor } from "../../../_util/getQueryStatusColor";
import { getQueryStatusLabel } from "../../../_util/getQueryStatusLabel";

interface BubbleQuerySelectorProps {
  selectedQuery?: Query<any, any, any, any>;
  onQuerySelect: (query: Query<any, any, any, any> | undefined) => void;
}

export function BubbleQuerySelector({
  selectedQuery,
  onQuerySelect,
}: BubbleQuerySelectorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const allQueries = useSafeQueries();

  // Debug logging
  console.log("BubbleQuerySelector - allQueries:", allQueries.length);

  const handleSelect = (query: Query<any, any, any, any>) => {
    // If same query is selected, deselect it
    if (query === selectedQuery) {
      onQuerySelect(undefined);
    } else {
      onQuerySelect(query);
    }
    setIsModalOpen(false);
  };

  const getDisplayIcon = () => {
    // Show selected query status
    if (selectedQuery) {
      try {
        const statusColor = getQueryStatusColor({
          queryState: selectedQuery.state,
          observerCount: selectedQuery.getObserversCount(),
          isStale: selectedQuery.isStale(),
        });

        // Convert color names to hex colors for display
        const colorMap: Record<string, string> = {
          blue: "#3B82F6",
          gray: "#6B7280",
          purple: "#8B5CF6",
          yellow: "#F59E0B",
          green: "#10B981",
        };

        return (
          <Text
            style={[
              styles.statusIndicator,
              { color: colorMap[statusColor] || "#9CA3AF" },
            ]}
          >
            ●
          </Text>
        );
      } catch (err) {
        return <AlertTriangle color="#EF4444" size={14} />;
      }
    }

    // Default search icon
    return <Search color="#9CA3AF" size={14} />;
  };

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsModalOpen(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {getDisplayIcon()}
      </TouchableOpacity>

      <QuerySelector
        queries={allQueries}
        selectedQuery={selectedQuery}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleSelect}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },

  statusIndicator: {
    fontSize: 12,
    fontWeight: "bold",
  },
});
