import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import { Query } from "@tanstack/react-query";

import { getQueryStatusColor } from "../utils/getQueryStatusColor";

import { QueryDebugInfo } from "./QueryDebugInfo";

interface QuerySelectorProps {
  queries: Query[];
  selectedQuery?: Query;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (query: Query) => void;
}

export function QuerySelector({
  queries,
  selectedQuery,
  isOpen,
  onClose,
  onSelect,
}: QuerySelectorProps) {
  const getQueryDisplayName = (query: Query) => {
    return Array.isArray(query.queryKey)
      ? query.queryKey.join(" - ")
      : String(query.queryKey);
  };

  return (
    <Modal
      accessibilityLabel="Query selector"
      accessibilityHint="View query selector"
      sentry-label="ignore query selector"
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityLabel="Query selector overlay"
        accessibilityHint="View query selector overlay"
        sentry-label="ignore query selector overlay"
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <View
          accessibilityLabel="Query selector content"
          accessibilityHint="View query selector content"
          sentry-label="ignore query selector content"
          style={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Query</Text>
            <Text style={styles.modalSubtitle}>
              {queries.length} {queries.length === 1 ? "query" : "queries"}{" "}
              available
            </Text>
          </View>

          <ScrollView
            accessibilityLabel="Query selector scroll view"
            accessibilityHint="View query selector scroll view"
            sentry-label="ignore query selector scroll view"
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            showsVerticalScrollIndicator={true}
          >
            {queries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No Queries Found</Text>
                <Text style={styles.emptyDescription}>
                  No React Query queries are currently active.{"\n\n"}
                  To see queries here:{"\n"}• Make API calls using useQuery
                  {"\n"}• Ensure queries are within QueryClientProvider{"\n"}•
                  Check console for debugging info
                </Text>
                <QueryDebugInfo />
              </View>
            ) : (
              queries.map((query, index) => {
                const displayName = getQueryDisplayName(query);

                const statusColorName = getQueryStatusColor({
                  queryState: query.state,
                  observerCount: query.getObserversCount(),
                  isStale: query.isStale(),
                });

                // Convert color names to hex colors
                const colorMap: Record<string, string> = {
                  blue: "#3B82F6",
                  gray: "#6B7280",
                  purple: "#8B5CF6",
                  yellow: "#F59E0B",
                  green: "#10B981",
                };

                const statusColor = colorMap[statusColorName] || "#6B7280";
                const isSelected = query === selectedQuery;

                return (
                  <TouchableOpacity
                    accessibilityLabel={`Query ${displayName}`}
                    accessibilityHint={`View query ${displayName}`}
                    sentry-label={`ignore query ${displayName}`}
                    key={`${query.queryHash}-${index}`}
                    style={[
                      styles.queryItem,
                      isSelected && styles.selectedQueryItem,
                    ]}
                    onPress={() => onSelect(query)}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: statusColor },
                      ]}
                    />
                    <Text
                      style={[
                        styles.queryText,
                        isSelected && styles.selectedQueryText,
                      ]}
                      numberOfLines={1}
                    >
                      {displayName}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1F1F1F",
    borderRadius: 8,
    width: "80%",
    maxHeight: "80%",
    minHeight: "50%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    flex: 0,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalSubtitle: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    padding: 8,
    flexGrow: 1,
  },
  emptyState: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#E5E7EB",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  queryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 4,
  },
  selectedQueryItem: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  queryText: {
    color: "#E5E7EB",
    fontSize: 14,
    flex: 1,
  },
  selectedQueryText: {
    color: "#FFFFFF",
    fontWeight: "500",
  },
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    minWidth: 120,
    maxWidth: 200,
  },
  triggerText: {
    color: "#E5E7EB",
    fontSize: 12,
    flex: 1,
    marginHorizontal: 6,
  },
});
