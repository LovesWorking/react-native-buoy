import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  PanResponderInstance,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import QueryStatusCount from "./QueryStatusCount";
import MutationStatusCount from "./MutationStatusCount";
import NetworkToggleButton from "./NetworkToggleButton";
import ClearCacheButton from "./ClearCacheButton";

interface Props {
  showQueries: boolean;
  setShowQueries: React.Dispatch<React.SetStateAction<boolean>>;
  setShowDevTools: React.Dispatch<React.SetStateAction<boolean>>;
  onTabChange?: (showQueries: boolean) => void;
  panResponder?: PanResponderInstance;
  isOffline: boolean;
  onToggleNetwork: () => void;
  onClearCache: () => void;
  activeFilter?: string | null;
  onFilterChange?: (filter: string | null) => void;
}

export default function DevToolsHeader({
  showQueries,
  setShowQueries,
  setShowDevTools,
  onTabChange,
  panResponder,
  isOffline,
  onToggleNetwork,
  onClearCache,
  activeFilter,
  onFilterChange,
}: Props) {
  const handleTabChange = (newShowQueries: boolean) => {
    if (onTabChange) {
      onTabChange(newShowQueries);
    } else {
      setShowQueries(newShowQueries);
    }
  };

  return (
    <View style={styles.devToolsHeader} {...(panResponder?.panHandlers || {})}>
      {/* Drag indicator */}
      <View style={styles.dragIndicator} />

      {/* Main Content Row */}
      <View style={styles.mainRow}>
        {/* Left Section: Toggle Buttons */}
        <View style={styles.toggleButtonsContainer}>
          <TouchableOpacity
            onPress={() => handleTabChange(true)}
            style={[
              styles.toggleButton,
              showQueries
                ? styles.toggleButtonActive
                : styles.toggleButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.toggleButtonText,
                showQueries
                  ? styles.toggleButtonTextActive
                  : styles.toggleButtonTextInactive,
              ]}
            >
              Queries
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleTabChange(false)}
            style={[
              styles.toggleButton,
              !showQueries
                ? styles.toggleButtonActive
                : styles.toggleButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.toggleButtonText,
                !showQueries
                  ? styles.toggleButtonTextActive
                  : styles.toggleButtonTextInactive,
              ]}
            >
              Mutations
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Section: Action Buttons */}
        <View style={styles.actionButtons}>
          <NetworkToggleButton
            isOffline={isOffline}
            onToggle={onToggleNetwork}
          />
          <ClearCacheButton
            type={showQueries ? "queries" : "mutations"}
            onClear={onClearCache}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowDevTools(false)}
            activeOpacity={0.7}
            accessibilityLabel="Close React Query Dev Tools"
            accessibilityRole="button"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M18 6L6 18M6 6l12 12"
                stroke="#9CA3AF"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status Row - Centered */}
      <View style={styles.statusRow}>
        {showQueries ? (
          <QueryStatusCount
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
          />
        ) : (
          <MutationStatusCount
            activeFilter={activeFilter}
            onFilterChange={onFilterChange}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  devToolsHeader: {
    backgroundColor: "#171717",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    flexDirection: "column",
    gap: 12,
  },
  dragIndicator: {
    width: 32,
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 1.5,
    alignSelf: "center",
    marginBottom: 4,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(156, 163, 175, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.2)",
  },
  toggleButtonsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 6,
    padding: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 65,
  },
  toggleButtonActive: {
    backgroundColor: "rgba(14, 165, 233, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(14, 165, 233, 0.2)",
  },
  toggleButtonInactive: {
    backgroundColor: "transparent",
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  toggleButtonTextActive: {
    color: "#0EA5E9",
  },
  toggleButtonTextInactive: {
    color: "#9CA3AF",
  },
});
