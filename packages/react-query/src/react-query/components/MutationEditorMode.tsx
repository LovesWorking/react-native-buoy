import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Mutation } from "@tanstack/react-query";
import { useSafeAreaInsets } from "@monorepo/shared";
import Explorer from "./query-browser/Explorer";
import MutationDetails from "./query-browser/MutationDetails";
import ActionButton from "./query-browser/ActionButton";
import { useMutationActionButtons } from "../hooks/useMutationActionButtons";
import { macOSColors } from "@monorepo/shared";
import { DataViewer } from "@monorepo/shared/dataViewer";

interface MutationEditorModeProps {
  selectedMutation: Mutation;
  isFloatingMode: boolean;
}

export function MutationEditorMode({
  selectedMutation,
  isFloatingMode,
}: MutationEditorModeProps) {
  const insets = useSafeAreaInsets({ minBottom: 16 });
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

        {/* Mutation Explorer Section - Non-editable viewer */}
        <View style={styles.section}>
          <View style={styles.mutationExplorerContainer}>
            <Text style={styles.mutationExplorerHeader}>Mutation Explorer</Text>
            <View style={styles.mutationExplorerContent}>
              <DataViewer
                title=""
                data={selectedMutation}
                maxDepth={10}
                rawMode={true}
                showTypeFilter={true}
                initialExpanded={false}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Footer with Safe Area */}
      <View
        style={[
          styles.actionFooter,
          { paddingBottom: isFloatingMode ? 0 : insets.bottom + 8 },
        ]}
      >
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
    <View style={styles.dataContainer}>
      <Text style={styles.dataHeader}>Data Editor</Text>
      <View style={styles.dataContent}>
        <Explorer
          key={selectedMutation.mutationId}
          editable={true}
          label="Data"
          value={selectedMutation.state.data}
          defaultExpanded={["Data"]}
        />
      </View>
    </View>
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
    color: macOSColors.text.primary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    color: macOSColors.text.secondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  actionFooter: {
    borderTopWidth: 1,
    borderTopColor: macOSColors.border.default,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: macOSColors.background.base,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    justifyContent: "space-between",
  },
  // Mutation Explorer styled container matching QueryDetails
  mutationExplorerContainer: {
    minWidth: 200,
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info + "4D",
    overflow: "hidden",
    shadowColor: macOSColors.semantic.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  mutationExplorerHeader: {
    backgroundColor: macOSColors.semantic.infoBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: "600",
    fontSize: 12,
    color: macOSColors.semantic.info,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.semantic.info + "33",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: "monospace",
  },
  mutationExplorerContent: {
    padding: 8,
  },
  // Data section matching query editor theme for consistency
  dataContainer: {
    minWidth: 200,
    backgroundColor: macOSColors.background.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: macOSColors.semantic.info + "4D",
    overflow: "hidden",
    shadowColor: macOSColors.semantic.info,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  dataHeader: {
    backgroundColor: macOSColors.semantic.infoBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: "600",
    fontSize: 12,
    color: macOSColors.semantic.info,
    borderBottomWidth: 1,
    borderBottomColor: macOSColors.semantic.info + "33",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    fontFamily: "monospace",
  },
  dataContent: {
    padding: 8,
  },
});
