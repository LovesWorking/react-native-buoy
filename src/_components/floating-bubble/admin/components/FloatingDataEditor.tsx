import { useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Query, QueryKey } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react-native";
import { BaseFloatingModal } from "./BaseFloatingModal";
import Explorer from "../../../devtools/Explorer";
import { QueryBrowser } from "../../../devtools/index";
import QueryStatusCount from "../../../devtools/QueryStatusCount";
import QueryDetails from "../../../devtools/QueryDetails";
import ActionButton from "../../../devtools/ActionButton";
import triggerLoading from "../../../_util/actions/triggerLoading";
import refetch from "../../../_util/actions/refetch";
import triggerError from "../../../_util/actions/triggerError";
import { getQueryStatusLabel } from "../../../_util/getQueryStatusLabel";
import { useGetQueryByQueryKey } from "../../../_hooks/useSelectedQuery";

// Stable constants moved to module scope to prevent re-renders
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

// Simplified breadcrumb without complex mapping
const getQueryBreadcrumb = (query: Query) => {
  const queryKey = Array.isArray(query.queryKey)
    ? query.queryKey
    : [query.queryKey];
  return queryKey.join(" › ");
};

interface FloatingDataEditorProps {
  visible: boolean;
  selectedQueryKey?: QueryKey;
  onQuerySelect: (query: Query | undefined) => void;
  onClose: () => void;
}

export function FloatingDataEditor({
  visible,
  selectedQueryKey,
  onQuerySelect,
  onClose,
}: FloatingDataEditorProps) {
  const selectedQuery = useGetQueryByQueryKey(selectedQueryKey);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  // Moved to module scope to prevent re-creation on every render
  const createActionButtons = (selectedQuery: Query) => {
    const queryStatus = selectedQuery.state.status;
    const isFetching = getQueryStatusLabel(selectedQuery) === "fetching";

    return [
      {
        label: "Refetch",
        bgColorClass: "btnRefetch" as const,
        textColorClass: "btnRefetch" as const,
        disabled: isFetching,
        onPress: () => refetch({ query: selectedQuery }),
      },
      {
        label: selectedQuery.state.data === undefined ? "Restore" : "Loading",
        bgColorClass: "btnTriggerLoading" as const,
        textColorClass: "btnTriggerLoading" as const,
        disabled: false,
        onPress: () => triggerLoading({ query: selectedQuery }),
      },
      {
        label: queryStatus === "error" ? "Restore" : "Error",
        bgColorClass: "btnTriggerLoadiError" as const,
        textColorClass: "btnTriggerLoadiError" as const,
        disabled: queryStatus === "pending",
        onPress: () => triggerError({ query: selectedQuery }),
      },
    ];
  };

  // Helper function to render the content-specific header elements
  const renderHeaderContent = () => (
    <>
      {selectedQuery && (
        <Pressable
          onPress={() => onQuerySelect(undefined)}
          style={styles.backButton}
          hitSlop={HIT_SLOP}
        >
          <ChevronLeft color="#E5E7EB" size={20} />
        </Pressable>
      )}

      {selectedQuery ? (
        <View style={styles.breadcrumbContainer}>
          <Text style={styles.breadcrumbItem} numberOfLines={1}>
            {getQueryBreadcrumb(selectedQuery)}
          </Text>
        </View>
      ) : (
        <View style={styles.filterContainer}>
          <QueryStatusCount
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
          />
        </View>
      )}
    </>
  );

  return (
    <BaseFloatingModal
      visible={visible}
      onClose={onClose}
      storagePrefix="@floating_data_editor"
      showToggleButton={true}
      customHeaderContent={renderHeaderContent()}
    >
      {/* Main content */}
      <View style={styles.content}>
        {selectedQuery ? (
          // Data Editor Mode
          <>
            <ScrollView
              style={styles.explorerScrollContainer}
              contentContainerStyle={styles.explorerScrollContent}
            >
              {/* Data Explorer Section - Moved to top for immediate data editing */}
              <View style={styles.section}>
                {selectedQuery.state.data ? (
                  <Explorer
                    key={selectedQuery?.queryHash}
                    editable={true}
                    label="Data"
                    value={selectedQuery?.state.data}
                    defaultExpanded={["Data"]}
                    activeQuery={selectedQuery}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    {selectedQuery.state.status === "pending" ||
                    getQueryStatusLabel(selectedQuery) === "fetching" ? (
                      <>
                        <Text style={styles.emptyTitle}>
                          {selectedQuery.state.status === "pending"
                            ? "Loading..."
                            : "Refetching..."}
                        </Text>
                        <Text style={styles.emptyDescription}>
                          Please wait while the query is being executed.
                        </Text>
                      </>
                    ) : selectedQuery.state.status === "error" ? (
                      <>
                        <Text style={styles.emptyTitle}>Query Error</Text>
                        <Text style={styles.emptyDescription}>
                          {selectedQuery.state.error?.message ||
                            "An error occurred while fetching data."}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.emptyTitle}>No Data Available</Text>
                        <Text style={styles.emptyDescription}>
                          This query has no data to edit. Try refetching the
                          query first.
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </View>

              {/* Query Details Section */}
              <View style={styles.section}>
                <QueryDetails query={selectedQuery} />
              </View>

              {/* Query Explorer Section */}
              <View style={styles.section}>
                <Explorer
                  label="Query"
                  value={selectedQuery}
                  defaultExpanded={["Query", "queryKey"]}
                  activeQuery={selectedQuery}
                />
              </View>
            </ScrollView>
            {/* Action Footer with Safe Area */}
            <View
              style={[
                styles.actionFooter,
                { paddingBottom: insets.bottom + 8 },
              ]}
            >
              {selectedQuery && (
                <View style={styles.actionsGrid}>
                  {createActionButtons(selectedQuery).map((action, index) => (
                    <ActionButton
                      key={index}
                      onClick={action.onPress}
                      text={action.label}
                      bgColorClass={action.bgColorClass}
                      textColorClass={action.textColorClass}
                      disabled={action.disabled}
                    />
                  ))}
                </View>
              )}
            </View>
          </>
        ) : (
          // Query Browser Mode
          <>
            <View style={styles.queryListContainer}>
              <QueryBrowser
                selectedQuery={selectedQuery}
                onQuerySelect={onQuerySelect}
                activeFilter={activeFilter}
                emptyStateMessage="No React Query queries are currently active.

To see queries here:
• Make API calls using useQuery
• Ensure queries are within QueryClientProvider
• Check console for debugging info"
                contentContainerStyle={styles.queryListContent}
              />
            </View>
            {/* Query Browser safe area */}
            <View
              style={[styles.queryBrowserSafeArea, { height: insets.bottom }]}
            />
          </>
        )}
      </View>
    </BaseFloatingModal>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(156, 163, 175, 0.1)", // Match main dev tools button
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.2)", // Match main dev tools button
    zIndex: 1002, // Ensure button is above corner handles
  },

  // Breadcrumb navigation
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 12, // Space after back button
  },
  breadcrumbItem: {
    color: "#E5E7EB", // Exact match with main dev tools text
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "monospace",
    flex: 1,
  },

  // Filter container for QueryStatusCount component
  filterContainer: {
    flex: 1, // Take available space when no back button
    justifyContent: "center",
    alignItems: "center",
  },

  // Content area
  content: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#2A2A2A", // Match main dev tools secondary background
  },

  // Explorer section
  explorerScrollContainer: {
    flex: 1,
  },
  explorerScrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  // Section layout matching QueryInformation
  section: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "left",
  },
  contentView: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    padding: 16,
  },

  // Empty states matching main dev tools
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    color: "#FFFFFF", // Match main dev tools primary text
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    color: "#9CA3AF", // Match main dev tools tertiary text
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },

  // Query list matching main dev tools exactly
  queryListContainer: {
    flex: 1,
  },
  queryListContent: {
    padding: 8, // Reduced to match main dev tools
    flexGrow: 1,
  },

  // Action footer matching main dev tools exactly
  actionFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)", // Match DevToolsHeader border
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#171717", // Match main dev tools primary background
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6, // Reduced from 8
    justifyContent: "space-between",
  },

  // Query browser safe area with matching background
  queryBrowserSafeArea: {
    backgroundColor: "#2A2A2A", // Match main dev tools secondary background
  },
});
