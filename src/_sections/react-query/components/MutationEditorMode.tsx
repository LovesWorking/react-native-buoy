import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Mutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Explorer from "./query-browser/Explorer";
import MutationDetails from "./query-browser/MutationDetails";
import ActionButton from "./query-browser/ActionButton";
import { useMutationActionButtons } from "../hooks/useMutationActionButtons";

interface MutationEditorModeProps {
  selectedMutation: Mutation;
}

export function MutationEditorMode({
  selectedMutation,
}: MutationEditorModeProps) {
  const insets = useSafeAreaInsets();
  const actionButtons = useMutationActionButtons(selectedMutation);

  return (
    <>
      <ScrollView
        accessibilityLabel="Mutation editor mode"
        accessibilityHint="View mutation editor mode"
        sentry-label="ignore mutation editor mode"
        style={styles.explorerScrollContainer}
        contentContainerStyle={styles.explorerScrollContent}
      >
        {/* Data Explorer Section */}
        <View style={styles.section}>
          <DataExplorer
            visible={!!selectedMutation.state.data}
            selectedMutation={selectedMutation}
          />
          <DataEmptyState
            visible={!selectedMutation.state.data}
            selectedMutation={selectedMutation}
          />
        </View>

        {/* Mutation Details Section */}
        <View style={styles.section}>
          <MutationDetails selectedMutation={selectedMutation} />
        </View>

        {/* Mutation Explorer Section */}
        <View style={styles.section}>
          <Explorer
            label="Mutation"
            value={selectedMutation}
            defaultExpanded={["Mutation"]}
          />
        </View>
      </ScrollView>

      {/* Action Footer with Safe Area */}
      <View style={[styles.actionFooter, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.actionsGrid}>
          {actionButtons.map((action, index) => (
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
  selectedMutation,
}: {
  visible: boolean;
  selectedMutation: Mutation;
}) {
  if (!visible) return null;
  return (
    <Explorer
      key={selectedMutation.mutationId}
      editable={true}
      label="Data"
      value={selectedMutation.state.data}
      defaultExpanded={["Data"]}
    />
  );
}

function DataEmptyState({
  visible,
  selectedMutation,
}: {
  visible: boolean;
  selectedMutation: Mutation;
}) {
  if (!visible) return null;
  const getEmptyStateContent = () => {
    if (selectedMutation.state.status === "pending") {
      return {
        title: "Pending...",
        description: "The mutation is in progress.",
      };
    }

    if (selectedMutation.state.status === "error") {
      return {
        title: "Mutation Error",
        description:
          selectedMutation.state.error?.message || "An error occurred.",
      };
    }

    return {
      title: "No Data Available",
      description: "This mutation has no data.",
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
  explorerScrollContainer: {
    flex: 1,
  },
  explorerScrollContent: {
    paddingBottom: 16,
    paddingHorizontal: 8,
    flexGrow: 1,
  },
  section: {
    marginBottom: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    color: "#9CA3AF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  actionFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.06)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#171717",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "space-between",
  },
});
