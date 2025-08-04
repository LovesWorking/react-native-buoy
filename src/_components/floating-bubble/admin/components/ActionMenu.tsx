import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { MoreVertical } from "lucide-react-native";
import { useQueryClient, Query } from "@tanstack/react-query";
import { getQueryStatusLabel } from "../../../_util/getQueryStatusLabel";
import triggerLoading from "../../../_util/actions/triggerLoading";
import refetch from "../../../_util/actions/refetch";
import reset from "../../../_util/actions/reset";
import remove from "../../../_util/actions/remove";
import invalidate from "../../../_util/actions/invalidate";
import triggerError from "../../../_util/actions/triggerError";

interface ActionMenuProps {
  selectedQuery?: Query;
  onQueryChange?: (query: Query | undefined) => void;
  onEditData?: () => void;
}

function ActionMenu({
  selectedQuery,
  onQueryChange,
  onEditData,
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const queryClient = useQueryClient();

  // If no query is selected, show message
  if (!selectedQuery) {
    return (
      <>
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          style={[styles.trigger, styles.disabledTrigger]}
          hitSlop={8}
          disabled
        >
          <MoreVertical size={16} color="#6B7280" />
        </TouchableOpacity>

        <Modal
          visible={isOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsOpen(false)}
        >
          <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
            <View style={styles.menuContainer}>
              <View style={styles.dragIndicator} />
              <View style={styles.actionsContainer}>
                <View style={styles.menuItem}>
                  <Text style={styles.noQueryText}>
                    Select a query to see actions
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.menuItem, styles.cancelButton]}
                onPress={() => setIsOpen(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <View style={{ height: 10 }} />
            </View>
          </Pressable>
        </Modal>
      </>
    );
  }

  const queryStatus = selectedQuery.state.status;
  const isFetching = getQueryStatusLabel(selectedQuery) === "fetching";

  const actions = [
    {
      label: "Edit Data",
      disabled: !selectedQuery.state.data,
      onPress: () => {
        onEditData?.();
        setIsOpen(false);
      },
    },
    {
      label: "Refetch",
      disabled: isFetching,
      onPress: () => {
        refetch({ query: selectedQuery });
        setIsOpen(false);
      },
    },
    {
      label: "Invalidate",
      disabled: queryStatus === "pending",
      onPress: () => {
        invalidate({ query: selectedQuery, queryClient });
        setIsOpen(false);
      },
    },
    {
      label: "Reset",
      disabled: queryStatus === "pending",
      onPress: () => {
        reset({ queryClient, query: selectedQuery });
        setIsOpen(false);
      },
    },
    {
      label: "Remove",
      destructive: true,
      disabled: isFetching,
      onPress: () => {
        remove({ queryClient, query: selectedQuery });
        onQueryChange?.(undefined); // Clear selected query
        setIsOpen(false);
      },
    },
    {
      label:
        selectedQuery.state.data === undefined
          ? "Restore Loading"
          : "Trigger Loading",
      disabled: false,
      onPress: () => {
        triggerLoading({ query: selectedQuery });
        setIsOpen(false);
      },
    },
    {
      label: queryStatus === "error" ? "Restore" : "Trigger Error",
      destructive: queryStatus !== "error",
      disabled: queryStatus === "pending",
      onPress: () => {
        triggerError({ query: selectedQuery, queryClient });
        setIsOpen(false);
      },
    },
  ];

  return (
    <>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={styles.trigger}
        hitSlop={8}
      >
        <MoreVertical size={16} color="#9CA3AF" />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setIsOpen(false)}>
          <View style={styles.menuContainer}>
            <View style={styles.dragIndicator} />

            <View style={styles.actionsContainer}>
              {actions.map((action, index) => (
                <TouchableOpacity
                  key={action.label}
                  style={[
                    styles.menuItem,
                    index !== actions.length - 1 && styles.menuItemBorder,
                    action.disabled && styles.disabledMenuItem,
                  ]}
                  onPress={action.disabled ? undefined : action.onPress}
                  disabled={action.disabled}
                >
                  <Text
                    style={[
                      styles.menuText,
                      action.destructive && styles.destructiveText,
                      action.disabled && styles.disabledText,
                    ]}
                  >
                    {action.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.menuItem, styles.cancelButton]}
              onPress={() => setIsOpen(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            {/* Add safe area padding at bottom */}
            <View style={{ height: 10 }} />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  disabledTrigger: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  dragIndicator: {
    width: 32,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    marginVertical: 12,
    alignSelf: "center",
  },
  menuContainer: {
    position: "absolute",
    bottom: 0,
    left: 8,
    right: 8,
    marginBottom: 10,
  },
  actionsContainer: {
    backgroundColor: "#2A2A2A",
    borderRadius: 14,
    marginBottom: 8,
    overflow: "hidden",
  },
  menuItem: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  menuText: {
    fontSize: 17,
    fontWeight: "400",
    color: "#E5E7EB",
  },
  destructiveText: {
    color: "#EF4444",
    fontWeight: "500",
  },
  cancelButton: {
    backgroundColor: "#2A2A2A",
    borderRadius: 14,
  },
  cancelText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#60A5FA",
  },
  disabledMenuItem: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
  },
  disabledText: {
    color: "#6B7280",
  },
  noQueryText: {
    fontSize: 17,
    fontWeight: "400",
    color: "#9CA3AF",
    textAlign: "center",
  },
});
