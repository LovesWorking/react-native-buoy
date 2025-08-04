import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Query, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Explorer from "./query-browser/Explorer";
import QueryDetails from "./query-browser/QueryDetails";
import ActionButton from "./query-browser/ActionButton";
import { getQueryStatusLabel } from "../utils/getQueryStatusLabel";
import { useActionButtons } from "../hooks/useActionButtons";

interface ActionButtonConfig {
  label: string;
  bgColorClass: "btnRefetch" | "btnTriggerLoading" | "btnTriggerLoadiError";
  textColorClass: "btnRefetch" | "btnTriggerLoading" | "btnTriggerLoadiError";
  disabled: boolean;
  onPress: () => void;
}

interface DataEditorModeProps {
  selectedQuery: Query;
}

export function DataEditorMode({ selectedQuery }: DataEditorModeProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const actionButtons = useActionButtons(selectedQuery, queryClient);

  return (
    <>
      <ScrollView
        accessibilityLabel="Data editor mode"
        accessibilityHint="View data editor mode"
        sentry-label="ignore data editor mode"
        style={styles.explorerScrollContainer}
        contentContainerStyle={styles.explorerScrollContent}
      >
        {/* Data Explorer Section - Moved to top for immediate data editing */}
        <View style={styles.section}>
          <DataExplorer
            visible={!!selectedQuery.state.data}
            selectedQuery={selectedQuery}
          />
          <DataEmptyState
            visible={!selectedQuery.state.data}
            selectedQuery={selectedQuery}
          />
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
      <View style={[styles.actionFooter, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.actionsGrid}>
          {actionButtons.map((action: ActionButtonConfig, index: number) => (
            <ActionButton
              sentry-label={`ignore action button ${action.label}`}
              key={index}
              onClick={action.onPress}
              text={action.label}
              bgColorClass={action.bgColorClass}
              _textColorClass={action.textColorClass}
              disabled={action.disabled}
            />
          ))}
        </View>
      </View>
    </>
  );
}

function DataExplorer({
  visible,
  selectedQuery,
}: {
  visible: boolean;
  selectedQuery: Query;
}) {
  if (!visible) return null;
  return (
    <Explorer
      key={selectedQuery.queryHash}
      editable={true}
      label="Data"
      value={selectedQuery.state.data}
      defaultExpanded={["Data"]}
      activeQuery={selectedQuery}
    />
  );
}

function DataEmptyState({
  visible,
  selectedQuery,
}: {
  visible: boolean;
  selectedQuery: Query;
}) {
  if (!visible) return null;
  const getEmptyStateContent = () => {
    if (
      selectedQuery.state.status === "pending" ||
      getQueryStatusLabel(selectedQuery) === "fetching"
    ) {
      return {
        title:
          selectedQuery.state.status === "pending"
            ? "Loading..."
            : "Refetching...",
        description: "Please wait while the query is being executed.",
      };
    }

    if (selectedQuery.state.status === "error") {
      return {
        title: "Query Error",
        description:
          selectedQuery.state.error?.message ||
          "An error occurred while fetching data.",
      };
    }

    return {
      title: "No Data Available",
      description:
        "This query has no data to edit. Try refetching the query first.",
    };
  };

  const { title, description } = getEmptyStateContent();

  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
