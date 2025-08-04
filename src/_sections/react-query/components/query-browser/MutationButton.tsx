import { Mutation } from "@tanstack/react-query";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { CheckCircle, LoadingCircle, PauseCircle, XCircle } from "./svgs";

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
export default function MutationButton({
  mutation,
  setSelectedMutation,
  selected,
}: Props) {
  const submittedAt = new Date(mutation.state.submittedAt).toLocaleTimeString();

  const getStatusInfo = () => {
    if (mutation.state.isPaused) {
      return { status: "Paused", color: "#8B5CF6", icon: <PauseCircle /> };
    }
    switch (mutation.state.status) {
      case "success":
        return { status: "Success", color: "#10B981", icon: <CheckCircle /> };
      case "error":
        return { status: "Error", color: "#EF4444", icon: <XCircle /> };
      case "pending":
        return { status: "Loading", color: "#3B82F6", icon: <LoadingCircle /> };
      default:
        return { status: "Idle", color: "#6B7280", icon: null };
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
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    marginHorizontal: 8,
    marginVertical: 3,
    padding: 12,
  },
  selected: {
    backgroundColor: "rgba(14, 165, 233, 0.05)",
    borderColor: "rgba(14, 165, 233, 0.2)",
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
    color: "#9CA3AF",
    marginTop: 1,
  },
  mutationSection: {
    flex: 2,
    paddingHorizontal: 12,
  },
  mutationKey: {
    fontFamily: "monospace",
    fontSize: 12,
    color: "#FFFFFF",
    lineHeight: 16,
  },
});
