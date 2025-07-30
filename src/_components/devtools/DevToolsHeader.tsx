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

      {/* Title Row */}
      <View style={styles.titleRow}>
        <TouchableOpacity
          style={styles.tanstackHeader}
          onPress={() => {
            setShowDevTools(false);
          }}
          accessibilityLabel="Close Tanstack query devtools"
        >
          <Text style={styles.tanstackText}>React Query</Text>
          <Text style={styles.reactNativeText}>Dev Tools</Text>
        </TouchableOpacity>

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

      {/* Tabs Row - Full Width */}
      <View style={styles.tabsRow}>
        <View style={styles.toggleButtonsContainer}>
          <TouchableOpacity
            onPress={() => {
              handleTabChange(true);
            }}
            style={[
              styles.toggleButton,
              showQueries === true
                ? styles.toggleButtonActive
                : styles.toggleButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.toggleButtonText,
                showQueries === true
                  ? styles.toggleButtonTextActive
                  : styles.toggleButtonTextInactive,
              ]}
            >
              Queries
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              handleTabChange(false);
            }}
            style={[
              styles.toggleButton,
              showQueries === false
                ? styles.toggleButtonActive
                : styles.toggleButtonInactive,
            ]}
          >
            <Text
              style={[
                styles.toggleButtonText,
                showQueries === false
                  ? styles.toggleButtonTextActive
                  : styles.toggleButtonTextInactive,
              ]}
            >
              Mutations
            </Text>
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.06)",
    flexDirection: "column",
    gap: 16,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "rgba(156, 163, 175, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(156, 163, 175, 0.2)",
  },
  tanstackHeader: {
    flexDirection: "column",
    gap: 2,
  },
  tanstackText: {
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 18,
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  reactNativeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#0EA5E9",
    marginTop: -2,
  },
  toggleButtonsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 6,
    padding: 3,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    alignSelf: "center",
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 70,
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
