import { useEffect, useRef } from "react";
import { StyleSheet, View, Text, Animated } from "react-native";
import {
  Database,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Zap,
  gameUIColors,
  macOSColors,
} from "@react-buoy/shared-ui";
import { StorageKeyStats } from "../types";

interface GameUIStorageStatsProps {
  stats: StorageKeyStats;
}

// Use macOS colors
const gameColors = {
  ...gameUIColors,
  ...macOSColors.semantic,
  primary: macOSColors.text.primary,
  secondary: macOSColors.text.secondary,
  muted: macOSColors.text.muted,
  panel: macOSColors.background.card,
  border: macOSColors.border.default,
  online: macOSColors.semantic.success,
  storage: macOSColors.semantic.debug,
  optional: macOSColors.semantic.debug,
};

// Storage type configurations with game UI colors
const storageTypeData = [
  {
    key: "valid",
    label: "VALID KEYS",
    subtitle: "Stored correctly",
    icon: CheckCircle2,
    color: gameColors.online,
  },
  {
    key: "missing",
    label: "MISSING KEYS",
    subtitle: "Required but absent",
    icon: AlertCircle,
    color: gameColors.error,
  },
  {
    key: "wrongValue",
    label: "VALUE ERROR",
    subtitle: "Incorrect data",
    icon: XCircle,
    color: gameColors.warning,
  },
  {
    key: "wrongType",
    label: "TYPE ERROR",
    subtitle: "Wrong format",
    icon: Zap,
    color: gameColors.info,
  },
  {
    key: "optional",
    label: "AUXILIARY DATA",
    subtitle: "Optional storage",
    icon: Eye,
    color: gameColors.optional,
  },
];

// Storage backend types
const backendTypeData = [
  {
    key: "mmkv",
    label: "MMKV",
    subtitle: "High-speed memory",
    icon: Zap,
    color: gameColors.info,
  },
  {
    key: "async",
    label: "ASYNC STORAGE",
    subtitle: "Standard persistence",
    icon: Database,
    color: gameColors.storage,
  },
  {
    key: "secure",
    label: "SECURE VAULT",
    subtitle: "Encrypted storage",
    icon: Shield,
    color: gameColors.online,
  },
];

export function GameUIStorageStats({ stats }: GameUIStorageStatsProps) {
  const {
    totalCount,
    missingCount,
    wrongValueCount,
    wrongTypeCount,
    presentRequiredCount,
    optionalCount,
    mmkvCount,
    asyncCount,
    secureCount,
  } = stats;

  // Minimal animation values - only for status indicator
  const statusPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Simple status pulse for critical states only
    if (missingCount > 0 || wrongValueCount > 0 || wrongTypeCount > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(statusPulse, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(statusPulse, {
            toValue: 0.6,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      Animated.timing(statusPulse, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [missingCount, wrongValueCount, wrongTypeCount, statusPulse]);

  const statusPulseStyle = {
    opacity: statusPulse,
  };

  // Calculate storage health
  const requiredTotal =
    presentRequiredCount + missingCount + wrongValueCount + wrongTypeCount;
  const healthPercentage =
    requiredTotal > 0
      ? Math.round((presentRequiredCount / requiredTotal) * 100)
      : 100;

  const healthStatus =
    healthPercentage >= 90
      ? "OPTIMAL"
      : healthPercentage >= 70
        ? "WARNING"
        : "CRITICAL";

  const healthColor =
    healthPercentage >= 90
      ? gameColors.online
      : healthPercentage >= 70
        ? gameColors.warning
        : gameColors.error;

  // If no storage keys at all, show minimal UI
  if (totalCount === 0) {
    return (
      <View style={styles.mainPanel}>
        <View style={styles.headerBar}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>STORAGE OVERVIEW</Text>
            <Text style={styles.headerSubtitle}>
              Persistent app data on device
            </Text>
          </View>
          <View style={styles.statusIndicator}>
            <View
              style={[styles.statusDot, { backgroundColor: gameColors.muted }]}
            />
            <Text style={styles.statusText}>EMPTY</Text>
          </View>
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📦</Text>
          <Text style={styles.emptyTitle}>NO DATA STORED</Text>
          <Text style={styles.emptySubtitle}>
            Your app has not saved any data yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.mainPanel}>
      {/* Header with status */}
      <View style={styles.headerBar}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>STORAGE OVERVIEW</Text>
          <Text style={styles.headerSubtitle}>
            Persistent app data on device
          </Text>
        </View>
        <Animated.View style={[styles.statusIndicator, statusPulseStyle]}>
          <View style={[styles.statusDot, { backgroundColor: healthColor }]} />
          <Text style={[styles.statusText, { color: healthColor }]}>
            {healthStatus}
          </Text>
        </Animated.View>
      </View>

      {/* Data Integrity Bar */}
      <View style={styles.healthSection}>
        <View style={styles.healthHeader}>
          <Text style={styles.healthLabel}>DATA INTEGRITY</Text>
          <Text style={[styles.healthPercentage, { color: healthColor }]}>
            {healthPercentage}%
          </Text>
        </View>
        <View style={styles.healthBarContainer}>
          <View style={styles.healthBarBg}>
            <Animated.View
              style={[
                styles.healthBarFill,
                {
                  width: `${healthPercentage}%`,
                  backgroundColor: healthColor,
                  shadowColor: healthColor,
                },
              ]}
            />
          </View>
          <View style={styles.healthGridOverlay} />
        </View>
      </View>

      {/* Storage Stats Grid */}
      <View style={styles.statsGrid}>
        {storageTypeData.map((item, index) => {
          let count = 0;
          let isActive = false;

          switch (item.key) {
            case "valid":
              count = presentRequiredCount;
              isActive = count > 0;
              break;
            case "missing":
              count = missingCount;
              isActive = count > 0;
              break;
            case "wrongValue":
              count = wrongValueCount;
              isActive = count > 0;
              break;
            case "wrongType":
              count = wrongTypeCount;
              isActive = count > 0;
              break;
            case "optional":
              count = optionalCount;
              isActive = count > 0;
              break;
          }

          if (!isActive) return null;

          const IconComponent = item.icon;
          const isError =
            item.key === "missing" ||
            item.key === "wrongValue" ||
            item.key === "wrongType";

          return (
            <Animated.View
              key={item.key}
              style={[
                styles.statCard,
                { borderColor: item.color + "40" },
                isError && styles.statCardError,
              ]}
            >
              {/* Glow effect for active cards */}
              <View
                style={[
                  styles.cardGlow,
                  { backgroundColor: item.color + "10" },
                ]}
              />

              {/* Card content */}
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconWrapper,
                    { backgroundColor: item.color + "15" },
                  ]}
                >
                  <IconComponent size={14} color={item.color} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={[styles.cardLabel, { color: item.color }]}>
                    {item.label}
                  </Text>
                  <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
                </View>
              </View>

              {/* Count display */}
              <View style={styles.cardStats}>
                <Text style={[styles.statNumber, { color: item.color }]}>
                  {count.toString().padStart(2, "0")}
                </Text>
                <View
                  style={[
                    styles.statBar,
                    { backgroundColor: item.color + "20" },
                  ]}
                >
                  <View
                    style={[
                      styles.statBarFill,
                      {
                        width: `${(count / totalCount) * 100}%`,
                        backgroundColor: item.color,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Corner indicators */}
              <View
                style={[
                  styles.cornerIndicator,
                  styles.cornerTL,
                  { backgroundColor: item.color },
                ]}
              />
              <View
                style={[
                  styles.cornerIndicator,
                  styles.cornerBR,
                  { backgroundColor: item.color },
                ]}
              />
            </Animated.View>
          );
        })}
      </View>

      {/* Storage Backend Distribution */}
      {(mmkvCount > 0 || asyncCount > 0 || secureCount > 0) && (
        <View style={styles.backendSection}>
          <Text style={styles.backendTitle}>MEMORY BANKS</Text>
          <View style={styles.backendGrid}>
            {backendTypeData.map((backend) => {
              let count = 0;
              switch (backend.key) {
                case "mmkv":
                  count = mmkvCount;
                  break;
                case "async":
                  count = asyncCount;
                  break;
                case "secure":
                  count = secureCount;
                  break;
              }

              if (count === 0) return null;

              const IconComponent = backend.icon;
              const percentage =
                totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

              return (
                <View key={backend.key} style={styles.backendItem}>
                  <View
                    style={[
                      styles.backendIcon,
                      { backgroundColor: backend.color + "15" },
                    ]}
                  >
                    <IconComponent size={12} color={backend.color} />
                  </View>
                  <View style={styles.backendInfo}>
                    <Text
                      style={[styles.backendLabel, { color: backend.color }]}
                    >
                      {backend.label}
                    </Text>
                    <Text style={styles.backendSubtitle}>
                      {backend.subtitle}
                    </Text>
                  </View>
                  <View style={styles.backendStats}>
                    <Text
                      style={[styles.backendCount, { color: backend.color }]}
                    >
                      {count}
                    </Text>
                    <Text style={styles.backendPercent}>{percentage}%</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Bottom status bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomStats}>
          <Text style={styles.bottomStatLabel}>TOTAL KEYS</Text>
          <Text style={styles.bottomStatValue}>{totalCount}</Text>
        </View>
        <View style={styles.bottomDivider} />
        <View style={styles.bottomStats}>
          <Text style={styles.bottomStatLabel}>VALID</Text>
          <Text style={[styles.bottomStatValue, { color: gameColors.online }]}>
            {presentRequiredCount + optionalCount}
          </Text>
        </View>
        <View style={styles.bottomDivider} />
        <View style={styles.bottomStats}>
          <Text style={styles.bottomStatLabel}>ISSUES</Text>
          <Text style={[styles.bottomStatValue, { color: gameColors.error }]}>
            {missingCount + wrongValueCount + wrongTypeCount}
          </Text>
        </View>
      </View>

      {/* Tech decoration */}
      <View style={styles.techPattern}>
        <Text style={styles.techText}>{"<DATA>"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainPanel: {
    backgroundColor: gameColors.panel,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: gameColors.border,
    overflow: "hidden",
    position: "relative",
  },

  // Header
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  headerLeft: {
    gap: 2,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: gameColors.primary,
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  headerSubtitle: {
    fontSize: 9,
    color: gameColors.secondary,
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
    letterSpacing: 1,
  },

  // Health section
  healthSection: {
    marginBottom: 20,
  },
  healthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  healthLabel: {
    fontSize: 10,
    color: gameColors.secondary,
    fontFamily: "monospace",
    letterSpacing: 1,
  },
  healthPercentage: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "monospace",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  healthBarContainer: {
    position: "relative",
  },
  healthBarBg: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 3,
    overflow: "hidden",
  },
  healthBarFill: {
    height: "100%",
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  healthGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 3,
  },

  // Stats grid
  statsGrid: {
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    position: "relative",
    overflow: "hidden",
  },
  statCardError: {
    backgroundColor: "rgba(255, 0, 0, 0.02)",
  },
  cardGlow: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfo: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    fontFamily: "monospace",
    letterSpacing: 1,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  cardSubtitle: {
    fontSize: 9,
    color: gameColors.secondary,
    fontFamily: "monospace",
    marginTop: 1,
  },
  cardStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "monospace",
    minWidth: 40,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  statBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  statBarFill: {
    height: "100%",
    borderRadius: 2,
  },
  cornerIndicator: {
    position: "absolute",
    width: 8,
    height: 1,
    opacity: 0.6,
  },
  cornerTL: {
    top: 0,
    left: 0,
    width: 1,
    height: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    width: 1,
    height: 8,
  },

  // Backend section
  backendSection: {
    marginBottom: 16,
  },
  backendTitle: {
    fontSize: 10,
    color: gameColors.secondary,
    fontFamily: "monospace",
    letterSpacing: 1,
    marginBottom: 12,
  },
  backendGrid: {
    gap: 8,
  },
  backendItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  backendIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  backendInfo: {
    flex: 1,
  },
  backendLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "monospace",
    letterSpacing: 0.5,
  },
  backendSubtitle: {
    fontSize: 8,
    color: gameColors.muted,
    fontFamily: "monospace",
  },
  backendStats: {
    alignItems: "flex-end",
  },
  backendCount: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "monospace",
  },
  backendPercent: {
    fontSize: 9,
    color: gameColors.muted,
    fontFamily: "monospace",
  },

  // Bottom bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  bottomStats: {
    flex: 1,
    alignItems: "center",
  },
  bottomStatLabel: {
    fontSize: 8,
    color: gameColors.muted,
    fontFamily: "monospace",
    letterSpacing: 1,
    marginBottom: 2,
  },
  bottomStatValue: {
    fontSize: 14,
    fontWeight: "700",
    color: gameColors.primary,
    fontFamily: "monospace",
  },
  bottomDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },

  // Empty state
  emptyState: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 8,
  },
  emptyIcon: {
    fontSize: 32,
    color: gameColors.muted,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 12,
    color: gameColors.secondary,
    fontFamily: "monospace",
    letterSpacing: 2,
  },
  emptySubtitle: {
    fontSize: 10,
    color: gameColors.muted,
    fontFamily: "monospace",
  },

  // Tech decoration
  techPattern: {
    position: "absolute",
    top: 16,
    right: 16,
    opacity: 0.03,
  },
  techText: {
    fontSize: 8,
    fontFamily: "monospace",
    color: gameColors.info,
    letterSpacing: 1,
  },
});
