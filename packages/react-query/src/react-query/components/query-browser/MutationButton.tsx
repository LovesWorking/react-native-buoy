import { Mutation } from "@tanstack/react-query";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { CheckCircle, LoadingCircle, PauseCircle, XCircle } from "./svgs";
import { formatRelativeTime } from "../../utils/formatRelativeTime";
import { gameUIColors } from "@react-buoy/shared-ui";
import { macOSColors } from "@react-buoy/shared-ui";

const getMutationText = (mutation: Mutation) => {
  if (!mutation.options.mutationKey) return "Anonymous Mutation";
  const keys = Array.isArray(mutation.options.mutationKey)
    ? mutation.options.mutationKey
    : [mutation.options.mutationKey];
  return (
    keys
      .filter((k) => k != null)
      .map((k) => String(k))
      .join(" › ") || "Anonymous Mutation"
  );
};

interface Props {
  mutation: Mutation;
  setSelectedMutation: React.Dispatch<
    React.SetStateAction<Mutation | undefined>
  >;
  selected: Mutation | undefined;
}
/**
 * List-row button for displaying mutation metadata and selecting it for detail inspection.
 */
export default function MutationButton({
  mutation,
  setSelectedMutation,
  selected,
}: Props) {
  const submittedAt = new Date(mutation.state.submittedAt).toLocaleTimeString();

  // Get last updated timestamp - always show something for debugging
  const getTimestamp = (): string => {
    if (mutation.state.submittedAt && mutation.state.submittedAt > 0) {
      return formatRelativeTime(mutation.state.submittedAt);
    }

    // @ts-ignore - exploring state fields for debugging
    const stateAny = mutation.state as any;

    // Try other timestamp fields
    if (stateAny.updatedAt && stateAny.updatedAt > 0) {
      return formatRelativeTime(stateAny.updatedAt);
    }

    // Debug fallback
    return `N/A (${mutation.state.submittedAt || 0})`;
  };

  const lastUpdated = getTimestamp();

  const getStatusInfo = () => {
    if (mutation.state.isPaused) {
      return {
        status: "Paused",
        color: macOSColors.semantic.debug,
        icon: <PauseCircle />,
      };
    }
    switch (mutation.state.status) {
      case "success":
        return {
          status: "Success",
          color: macOSColors.semantic.success,
          icon: <CheckCircle />,
        };
      case "error":
        return {
          status: "Error",
          color: macOSColors.semantic.error,
          icon: <XCircle />,
        };
      case "pending":
        return {
          status: "Loading",
          color: macOSColors.semantic.info,
          icon: <LoadingCircle />,
        };
      default:
        return { status: "Idle", color: macOSColors.text.muted, icon: null };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <TouchableOpacity
      sentry-label="ignore devtools mutation button"
      onPress={() =>
        setSelectedMutation(mutation === selected ? undefined : mutation)
      }
      style={[
        styles.button,
        selected?.mutationId === mutation.mutationId && styles.selected,
      ]}
    >
      <View style={styles.rowContent}>
        <View style={styles.statusSection}>
          <View
            style={[styles.statusDot, { backgroundColor: statusInfo.color }]}
          />
          <View style={styles.statusInfo}>
            <Text style={[styles.statusLabel, { color: statusInfo.color }]}>
              {statusInfo.status}
            </Text>
            <Text style={styles.submittedText}>{submittedAt}</Text>
          </View>
        </View>

        <View style={styles.mutationSection}>
          <Text style={styles.mutationKey}>{getMutationText(mutation)}</Text>
        </View>
      </View>

      {/* Bottom Right Text (timestamp) */}
      <View style={styles.bottomRightContainer}>
        <Text style={styles.bottomRightText}>{lastUpdated}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: macOSColors.background.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: macOSColors.border.default,
    marginHorizontal: 8,
    marginVertical: 3,
    padding: 12,
  },
  selected: {
    backgroundColor: macOSColors.semantic.infoBackground,
    borderColor: macOSColors.semantic.info + "50",
  },
  rowContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "600",
    lineHeight: 14,
  },
  submittedText: {
    fontSize: 10,
    color: macOSColors.text.muted,
    marginTop: 1,
  },
  mutationSection: {
    flex: 2,
    paddingHorizontal: 12,
  },
  mutationKey: {
    fontFamily: "monospace",
    fontSize: 12,
    color: macOSColors.text.primary,
    lineHeight: 16,
  },
  bottomRightContainer: {
    position: "absolute",
    bottom: 4,
    right: 8,
  },
  bottomRightText: {
    fontSize: 9,
    color: macOSColors.text.muted,
    fontFamily: "monospace",
  },
});
